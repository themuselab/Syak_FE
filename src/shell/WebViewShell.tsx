import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { colors } from '@/shared/theme/colors';

// 네이티브 셸 — 화면은 전부 웹(Vercel)이 그리고, 앱은 웹이 못 하는 것만 맡는다
// (푸시 수신, 위치 권한, 앱투앱 소셜 로그인). docs/webview-migration.md 참고.
//
// 웹 번들에는 이 파일 대신 WebViewShell.web.tsx가 들어간다. react-native-webview는
// 네이티브 모듈이라 웹 빌드에 섞이면 안 된다.

type Props = { url: string };

export function WebViewShell({ url }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const reload = () => {
    setFailed(false);
    setLoading(true);
    webRef.current?.reload();
  };

  // 로드 실패 시 흰 화면만 남으면 "앱이 죽은" 것처럼 보인다. 재시도 화면을 네이티브로 띄운다
  // (심사에서도 오프라인 상태가 빈 화면이면 지적 대상이다).
  if (failed) {
    return (
      <View
        className="flex-1 items-center justify-center gap-3 bg-white"
        style={{ paddingTop: insets.top }}
      >
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
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <WebView
        ref={webRef}
        source={{ uri: url }}
        // 쿠키 인증(syak_access/syak_refresh)이 웹과 동일하게 동작하려면 서드파티 쿠키와
        // 공유 쿠키 저장소가 필요하다. 끄면 로그인이 매번 풀린다.
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        // 지도·시트 제스처가 네이티브 스크롤과 싸우지 않게 웹에 맡긴다.
        bounces={false}
        overScrollMode="never"
        // 외부 링크(예약 페이지 등)는 웹뷰 안에서 열리지 않게 — 추후 브리지에서 처리.
        setSupportMultipleWindows={false}
        onLoadEnd={() => setLoading(false)}
        onError={() => setFailed(true)}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.statusCode >= 500) setFailed(true);
        }}
      />
      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-white">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      )}
    </View>
  );
}
