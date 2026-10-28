import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

import {
  SocialAuthCancelledError,
  SocialAuthNotReadyError,
  SocialAuthTimeoutError,
  getSocialToken,
} from '@/shared/domain/auth/socialAuth';

import {
  getCurrentCoords,
  getLocationPermission,
  requestLocationPermission,
} from '@/shared/lib/location';
import { getPushPermission, togglePushPermission } from '@/shared/lib/pushPermission';
import { colors } from '@/shared/theme/colors';

import type { ShellEnvelope, ShellInfo, ShellMessage, ShellRequest } from './bridge.types';
import { getPushTokenForShell, pathFromNotificationData } from './nativePush';

// 네이티브 셸 — 화면은 전부 웹(Vercel)이 그리고, 앱은 웹이 못 하는 것만 맡는다:
// 소셜 로그인 SDK, OS 권한(위치·푸시), 푸시 토큰·알림 탭, 바깥 앱 열기. docs/webview-migration.md
//
// 웹 번들에는 이 파일 대신 WebViewShell.web.tsx가 들어간다(react-native-webview는 네이티브 모듈).

type Props = { url: string };

// 소셜 로그인 에러 → 웹에 넘길 종류. 웹이 원래 에러 클래스로 되돌려 같은 안내 문구를 띄운다.
function socialErrorKind(e: unknown) {
  if (e instanceof SocialAuthCancelledError) return 'cancelled' as const;
  if (e instanceof SocialAuthTimeoutError) return 'timeout' as const;
  if (e instanceof SocialAuthNotReadyError) return 'not_ready' as const;
  return 'failed' as const;
}

// 웹의 요청을 네이티브 기능으로 처리한다.
async function handle(request: ShellRequest): Promise<unknown> {
  switch (request.type) {
    case 'socialLogin':
      return getSocialToken(request.provider);
    case 'getLocationPermission':
      return getLocationPermission();
    case 'requestLocationPermission':
      return requestLocationPermission();
    case 'getCurrentCoords':
      return getCurrentCoords(request.fresh);
    case 'getPushPermission':
      return getPushPermission();
    case 'togglePushPermission':
      return togglePushPermission(request.next);
    case 'getPushToken':
      return getPushTokenForShell();
    case 'openSettings':
      await Linking.openSettings().catch(() => {});
      return null;
    case 'openExternal':
      await Linking.openURL(request.url).catch(() => {});
      return null;
  }
}

export function WebViewShell({ url }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // 처음 열 주소. 종료 상태에서 알림을 눌러 켜졌다면 그 샵 화면으로 바로 연다.
  const [startUrl, setStartUrl] = useState<string | null>(null);
  // React Native의 URL 구현은 origin을 지원하지 않아(호출 시 예외) 정규식으로 뽑는다.
  const origin = url.match(/^https?:\/\/[^/]+/)?.[0] ?? url;

  useEffect(() => {
    let alive = true;
    Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        const path = r ? pathFromNotificationData(r.notification.request.content.data) : null;
        if (alive) setStartUrl(path ? `${origin}${path}` : url);
      })
      .catch(() => alive && setStartUrl(url));
    return () => {
      alive = false;
    };
  }, [url, origin]);

  const send = useCallback((msg: ShellMessage) => {
    webRef.current?.injectJavaScript(
      `window.__syakBridge && window.__syakBridge.receive(${JSON.stringify(msg)}); true;`,
    );
  }, []);

  // 앱이 켜진 상태의 알림: 누르면 해당 화면으로, 도착하면 웹이 알림 목록을 새로고침.
  useEffect(() => {
    const tap = Notifications.addNotificationResponseReceivedListener((r) => {
      const path = pathFromNotificationData(r.notification.request.content.data);
      if (path) send({ kind: 'event', event: 'navigate', path });
    });
    const recv = Notifications.addNotificationReceivedListener(() =>
      send({ kind: 'event', event: 'pushReceived' }),
    );
    return () => {
      tap.remove();
      recv.remove();
    };
  }, [send]);

  // 안드로이드 뒤로가기: 웹 안에서 뒤로 갈 수 있으면 웹 뒤로, 첫 화면이면 앱 종료(기본 동작).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBackRef.current) return false;
      webRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback(
    async (e: WebViewMessageEvent) => {
      let envelope: ShellEnvelope;
      try {
        envelope = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (!envelope?.id || !envelope.request) return;
      try {
        const data = await handle(envelope.request);
        send({ kind: 'response', id: envelope.id, ok: true, data: data ?? null });
      } catch (err) {
        const kind = envelope.request.type === 'socialLogin' ? socialErrorKind(err) : 'failed';
        send({
          kind: 'response',
          id: envelope.id,
          ok: false,
          error: { kind, message: err instanceof Error ? err.message : String(err) },
        });
      }
    },
    [send],
  );

  // 우리 사이트가 아닌 주소로 이동하려 하면(네이버 예약·인스타·전화 등) 웹뷰 안에서 열지 않고
  // 네이티브로 넘긴다. 웹이 브리지(openExternal)를 쓰지만, 빠뜨린 링크의 안전장치다.
  const onShouldStart = useCallback(
    (req: ShouldStartLoadRequest) => {
      if (req.url.startsWith(origin) || req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
      if (Platform.OS === 'ios' && (req as { isTopFrame?: boolean }).isTopFrame === false) return true;
      Linking.openURL(req.url).catch(() => {});
      return false;
    },
    [origin],
  );

  // 페이지보다 먼저 심는 정보: 실제 OS·셸 버전·안전 영역. 웹은 이걸로 셸 안인지 알고,
  // Apple 로그인 노출·여백 계산에 쓴다(bridge.types ShellInfo).
  const info: ShellInfo = {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    version: Constants.expoConfig?.version ?? '0',
    insets: { top: insets.top, bottom: insets.bottom, left: insets.left, right: insets.right },
  };
  const beforeLoad = `window.__SYAK_SHELL__ = ${JSON.stringify(info)}; true;`;
  // 앱처럼: 페이지 확대(핀치 줌) 끄기. 지도 확대는 지도가 직접 처리한다.
  const afterLoad = `(function(){var m=document.querySelector('meta[name=viewport]');
    if(m){m.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');}})(); true;`;

  const reload = () => {
    setFailed(false);
    webRef.current?.reload();
  };

  // 로드 실패 시 흰 화면만 남으면 "앱이 죽은" 것처럼 보인다. 재시도 화면을 네이티브로 띄운다
  // (심사에서도 오프라인 상태가 빈 화면이면 지적 대상이다).
  if (failed) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white">
        <Text className="text-body-l font-pretendard-medium" style={{ color: colors.text.muted }}>
          연결에 실패했어요
        </Text>
        <Text className="text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
          네트워크를 확인하고 다시 시도해 주세요
        </Text>
        <Pressable
          onPress={reload}
          className="mt-2 rounded-full px-5 py-2.5"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <Text className="text-label-l font-pretendard-semibold" style={{ color: colors.white }}>
            다시 시도
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    // 화면 끝까지 채운다(여백은 웹이 셸이 넘겨준 insets로 직접 잡는다 — ShellInsets).
    <View className="flex-1" style={{ backgroundColor: colors.onboarding.gradient[0] }}>
      {startUrl && (
        <WebView
          ref={webRef}
          source={{ uri: startUrl }}
          injectedJavaScriptBeforeContentLoaded={beforeLoad}
          injectedJavaScript={afterLoad}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={onShouldStart}
          onOpenWindow={(ev) => Linking.openURL(ev.nativeEvent.targetUrl).catch(() => {})}
          onNavigationStateChange={(s) => {
            canGoBackRef.current = s.canGoBack;
          }}
          // 로그인 쿠키(syak_access/syak_refresh)가 웹뷰 안에 저장되고 앱 재실행 후에도 유지된다.
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          // 위치는 웹뷰가 직접 쓰지 않고 브리지로 네이티브에 부탁한다(권한을 앱 하나로 일원화).
          geolocationEnabled={false}
          // iOS: 화면 왼쪽 끝 스와이프로 뒤로가기(네이티브 앱 같은 느낌)
          allowsBackForwardNavigationGestures
          // 지도·시트 제스처가 네이티브 스크롤과 싸우지 않게 웹에 맡긴다.
          bounces={false}
          overScrollMode="never"
          // 시스템 글꼴 크기 설정이 레이아웃을 깨지 않게(안드로이드)
          textZoom={100}
          setSupportMultipleWindows={false}
          contentInsetAdjustmentBehavior="never"
          style={{ backgroundColor: 'transparent' }}
          onLoadEnd={() => setFirstLoaded(true)}
          onError={() => setFailed(true)}
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.statusCode >= 500) setFailed(true);
          }}
        />
      )}
      {/* 첫 로드 동안: 웹 스플래시와 같은 분홍 배경이라 넘어갈 때 튀지 않는다 */}
      {!firstLoaded && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: colors.onboarding.gradient[0] }}
        >
          <ActivityIndicator color={colors.white} />
        </View>
      )}
    </View>
  );
}
