import { router, useFocusEffect } from 'expo-router';
import { Bell, ChevronRight, Star } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSignOut } from '@/shared/domain/auth/auth.queries';
import { useAuthStore } from '@/shared/domain/auth/auth.store';
import {
  getAppNewsEnabled,
  setAppNewsEnabled,
} from '@/shared/domain/notification/appNewsLocal';
import { useInterestRegion } from '@/shared/domain/notification/interestRegion';
import {
  useNotifications,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/shared/domain/notification/notification.queries';
import { registerDeviceForAppNews } from '@/shared/domain/notification/push';
import { getPushPermission, togglePushPermission } from '@/shared/lib/pushPermission';
import { useMe } from '@/shared/domain/user/user.queries';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';
import { useLoginGate } from '@/shared/ui/loginGate';
import { RegionSearchSheet } from '@/shared/ui/RegionSearchSheet';

import { SettingToggleRow } from './components/SettingToggleRow';

// 디자인: designs/마이페이지/*, design.pen (M6Lry 회원·OFF / y1ARc 회원·ON+슬라이더 / nnRIy 비회원)
// 회원/비회원은 useAuthStore.user로 분기. 알림 설정은 GET/PATCH /notifications/settings 연동
// (값은 서버 파생 — PATCH 응답이 캐시를 교체하므로 로컬 미러링·롤백 불필요).
const FAVORITE_COLOR = colors.accent.favorite; // 즐겨찾기 골드(기존 DetailHeader와 동일)
const iconLocation = require('../../../assets/icons/my-location-permission.png');
const iconAppNews = require('../../../assets/icons/my-app-news.png');

export function MyScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn, requireLogin, loginModal } = useLoginGate();
  // 닉네임 폴백용 로그인 시점 스냅샷 (최신 값은 아래 me 쿼리).
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOut();

  // 프로필은 서버 파생(GET /users/me) — 로그인 시점 스냅샷(auth store)이 아닌 최신 값 표시.
  // 조회 중엔 store 값 폴백(깜빡임 방지). 프로필 사진·연동 현황은 디자인 부재로 미표시(docs/my.md §9).
  const { data: me } = useMe(isLoggedIn);

  // "알림" 토글 = OS 푸시 알림 권한(위치 권한 토글과 같은 패턴). 설정 앱에서 바꾸고 돌아오면 포커스 재조회.
  const [pushPermission, setPushPermission] = useState(false);
  useFocusEffect(
    useCallback(() => {
      getPushPermission().then(({ granted }) => setPushPermission(granted));
    }, []),
  );
  const handlePushToggle = (next: boolean) => {
    togglePushPermission(next).then(setPushPermission);
  };

  // "샥 알림" 메뉴의 분홍 점 = 안 읽은 샵 알림이 있을 때(시안 아이콘의 점을 미읽음 표시로 썼다).
  const { data: notifications } = useNotifications(isLoggedIn);
  const hasUnread = (notifications ?? []).some((n) => n.readAt === null);

  // 앱 소식 토글 = 디바이스 단위 설정(2026-07-18 BE 개편, QA 비로그인 #4 — 비회원도 동작).
  // 로컬 저장값이 원본, 변경 시 POST /notifications/devices 재등록으로 서버 반영.
  const [appNews, setAppNews] = useState(true);
  useFocusEffect(
    useCallback(() => {
      getAppNewsEnabled().then(setAppNews);
    }, []),
  );
  const handleAppNewsToggle = (next: boolean) => {
    setAppNews(next);
    setAppNewsEnabled(next).then(() => registerDeviceForAppNews());
  };

  // 알림 설정: 서버 값 파생. 로딩 중엔 조작 차단.
  // 비회원은 disabled로 막지 않는다 — 탭이 들어와야 로그인 유도 모달을 띄울 수 있다(QA #59).
  const { data: settings } = useNotificationSettings(isLoggedIn);
  const update = useUpdateNotificationSettings();
  const settingsLoading = isLoggedIn && settings == null;

  // 관심 동네(시안 2026-10-27): "내 주변 알림(GPS)·위치 권한·반경" 자리를 대신한다.
  // 동네를 고르면 그 동네 빈자리·할인 알림이 켜진다(useInterestRegion.setRegion).
  const interest = useInterestRegion();
  const [regionSheet, setRegionSheet] = useState(false);

  // 즐겨찾기 알림도 계정 단위 설정 — 비회원은 동일하게 로그인 유도.
  const handleFavoriteToggle = (next: boolean) =>
    requireLogin(() => update.mutate({ favoriteEnabled: next }));

  const subtitle = isLoggedIn
    ? (me?.nickname ?? user?.nickname ?? '닉네임 미설정')
    : '로그인하고 편리하게 샥-';

  const handleLogout = () => {
    // useSignOut이 onSettled에서 로컬 세션을 비운다(성공/실패 모두). 이동만 처리.
    signOut.mutate(undefined, { onSettled: () => router.replace('/login') });
  };

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="마이" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <View style={{ gap: 20 }}>
          {/* 이름 행: 좌 닉네임 + 우 '계정 관리'(회원만 — 사용자 확정). pill 스타일은 pen 미반영이라
              기존 칩 패턴 준용(r999·회색 테두리) — 디자이너 확인 항목(docs/account.md). */}
          <View className="flex-row items-center justify-between">
            <Text
              className="font-pretendard-semibold text-black"
              style={{ fontSize: 18, letterSpacing: -0.36 }}
            >
              {subtitle}
            </Text>
            {isLoggedIn && (
              <Pressable
                onPress={() => router.push('/account')}
                className="rounded-full"
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: colors.line.baseAlt2,
                }}
              >
                <Text className="font-pretendard-medium" style={{ fontSize: 13, color: colors.text.muted }}>
                  계정 관리
                </Text>
              </Pressable>
            )}
          </View>

          <View style={{ gap: 16 }}>
            {/* 즐겨찾기 목록으로 이동. 비회원 게이팅은 즐겨찾기 화면이 담당(알림과 동일 정책). */}
            <Pressable
              onPress={() => router.push('/favorites')}
              className="flex-row items-center gap-2"
              style={{ paddingVertical: 12 }}
            >
              <Star size={16} color={FAVORITE_COLOR} fill={FAVORITE_COLOR} />
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: colors.text.muted }}>
                즐겨찾기
              </Text>
            </Pressable>

            {/* 샥 알림 = 알림 목록. 홈 검색바의 알림 벨이 시안(2026-10-15)에서 빠져 진입점이 여기다.
                비회원은 알림 화면이 앱 소식만 보여주고 샵 알림은 로그인 유도한다(화면이 담당). */}
            <Pressable
              onPress={() => router.push('/notifications')}
              className="flex-row items-center gap-2"
              style={{ paddingVertical: 12 }}
            >
              <View>
                <Bell size={16} color={colors.text.faint} fill={colors.text.faint} />
                {hasUnread && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -1,
                      right: -1,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.primary[500],
                    }}
                  />
                )}
              </View>
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: colors.text.muted }}>
                샥 알림
              </Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: colors.line.divider }} />

            {/* 관심동네(시안): 미설정이면 분홍 "설정하기", 설정돼 있으면 동네 이름. 비회원은 로그인 유도. */}
            <Pressable
              onPress={() => requireLogin(() => setRegionSheet(true))}
              className="flex-row items-center justify-between"
              style={{ paddingVertical: 12 }}
            >
              <View className="flex-row items-center gap-2">
                <Image source={iconLocation} style={{ width: 20, height: 20 }} contentFit="contain" tintColor={colors.text.faint} />
                <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: colors.text.muted }}>
                  관심동네
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text
                  className="font-pretendard-medium"
                  style={{ fontSize: 14, color: interest.region ? colors.text.strong : colors.primary[500] }}
                >
                  {interest.region?.name ?? '설정하기'}
                </Text>
                <ChevronRight size={18} color={colors.gray[800]} />
              </View>
            </Pressable>

            <View style={{ height: 1, backgroundColor: colors.line.divider }} />

            {/* 상위 "알림" = OS 푸시 권한. 아래 항목들은 한 단계 들여쓴다(시안). */}
            <SettingToggleRow
              iconNode={<Bell size={16} color={colors.text.faint} fill={colors.text.faint} />}
              label="알림"
              value={pushPermission}
              onValueChange={handlePushToggle}
            />
            <SettingToggleRow
              indent
              iconNode={<Star size={16} color={colors.text.faint} fill={colors.text.faint} />}
              label="즐겨찾기 알림"
              value={settings?.favoriteEnabled ?? false}
              onValueChange={handleFavoriteToggle}
              disabled={settingsLoading}
            />
            {/* 앱 소식 = 디바이스 단위(계정 무관) — 위치 권한 토글처럼 비회원도 활성 */}
            <SettingToggleRow
              indent
              icon={iconAppNews}
              label="앱 소식"
              value={appNews}
              onValueChange={handleAppNewsToggle}
            />
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
        {isLoggedIn ? (
          <Pressable
            onPress={handleLogout}
            className="items-center justify-center rounded-sm bg-white"
            style={{ paddingVertical: 12, borderWidth: 1, borderColor: colors.error[500] }}
          >
            <Text className="font-pretendard-semibold" style={{ fontSize: 16, color: colors.error[500] }}>
              로그아웃
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/login')}
            className="h-12 items-center justify-center rounded-sm bg-primary-500"
          >
            <Text className="font-pretendard-semibold text-white" style={{ fontSize: 16 }}>
              로그인
            </Text>
          </Pressable>
        )}
      </View>

      <RegionSearchSheet
        visible={regionSheet}
        current={interest.region}
        onSelect={(d) => {
          setRegionSheet(false);
          interest.setRegion(d).catch(() => {});
        }}
        onClose={() => setRegionSheet(false)}
      />
      {loginModal}
    </View>
  );
}
