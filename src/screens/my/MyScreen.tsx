import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSignOut } from '@/shared/domain/auth/auth.queries';
import { useAuthStore } from '@/shared/domain/auth/auth.store';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/shared/domain/notification/notification.queries';
import { useMe } from '@/shared/domain/user/user.queries';
import { getCurrentCoords } from '@/shared/lib/location';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';

import { RadiusSlider } from './components/RadiusSlider';
import { SettingToggleRow } from './components/SettingToggleRow';

// 디자인: designs/마이페이지/*, design.pen (M6Lry 회원·OFF / y1ARc 회원·ON+슬라이더 / nnRIy 비회원)
// 회원/비회원은 useAuthStore.user로 분기. 알림 설정은 GET/PATCH /notifications/settings 연동
// (값은 서버 파생 — PATCH 응답이 캐시를 교체하므로 로컬 미러링·롤백 불필요).
const FAVORITE_COLOR = '#FFC107'; // 즐겨찾기 골드(기존 DetailHeader와 동일)
const iconLocation = require('../../../assets/icons/my-location-permission.png');
const iconNear = require('../../../assets/icons/my-near-alarm.png');
const iconAppNews = require('../../../assets/icons/my-app-news.png');

export function MyScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOut();
  const isLoggedIn = user != null;

  // 프로필은 서버 파생(GET /users/me) — 로그인 시점 스냅샷(auth store)이 아닌 최신 값 표시.
  // 조회 중엔 store 값 폴백(깜빡임 방지). 프로필 사진·연동 현황은 디자인 부재로 미표시(docs/my.md §9).
  const { data: me } = useMe(isLoggedIn);

  // 위치 권한 토글: BE 대응 필드가 없어 로컬 UI 상태 유지 (실권한 연동은 남은 작업 — docs/my.md).
  const [locationPermission, setLocationPermission] = useState(false);

  // 알림 설정: 서버 값 파생. 로딩 중엔 조작 차단.
  const { data: settings } = useNotificationSettings(isLoggedIn);
  const update = useUpdateNotificationSettings();
  const settingsDisabled = !isLoggedIn || settings == null;

  const nearEnabled = settings?.nearEnabled ?? false;
  // 반경: 드래그 중 표시용 draft만 로컬, 드롭 시 1회 PATCH 후 서버 값으로 복귀.
  const [radiusDraft, setRadiusDraft] = useState<number | null>(null);
  const radiusKm = radiusDraft ?? settings?.radiusKm ?? 3;

  // 내 주변 알림 ON: 위치 권한 → 현재 좌표를 기준점(nearLat/nearLng)으로 함께 저장.
  // 거부 시 mutate 안 함 → 값이 서버 파생이라 토글이 OFF에 그대로 머묾(되돌리기 불필요).
  const handleNearToggle = async (next: boolean) => {
    if (!next) {
      update.mutate({ nearEnabled: false });
      return;
    }
    const coords = await getCurrentCoords();
    if (!coords) {
      Alert.alert('위치 권한이 필요해요', '내 주변 알림을 받으려면 설정에서 위치 권한을 허용해 주세요.');
      return;
    }
    update.mutate({ nearEnabled: true, nearLat: coords.lat, nearLng: coords.lng });
  };

  const subtitle = isLoggedIn
    ? (me?.nickname ?? user.nickname ?? '닉네임 미설정')
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
                  borderColor: '#e6e6e6',
                }}
              >
                <Text className="font-pretendard-medium" style={{ fontSize: 13, color: '#555555' }}>
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
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: '#555555' }}>
                즐겨찾기
              </Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: '#f3f3f3' }} />

            <SettingToggleRow
              icon={iconLocation}
              label="위치 권한"
              value={locationPermission}
              onValueChange={setLocationPermission}
              disabled={!isLoggedIn}
            />
            <SettingToggleRow
              icon={iconNear}
              label="내 주변 알림"
              value={nearEnabled}
              onValueChange={handleNearToggle}
              disabled={settingsDisabled}
            />
            {nearEnabled && (
              <RadiusSlider
                value={radiusKm}
                onChange={setRadiusDraft}
                onRelease={(v) =>
                  update.mutate({ radiusKm: v }, { onSettled: () => setRadiusDraft(null) })
                }
              />
            )}
            <SettingToggleRow
              label="즐겨찾기 알림"
              value={settings?.favoriteEnabled ?? false}
              onValueChange={(next) => update.mutate({ favoriteEnabled: next })}
              disabled={settingsDisabled}
            />
            {/* "앱 소식" ↔ BE shopNewsEnabled 매핑 */}
            <SettingToggleRow
              icon={iconAppNews}
              label="앱 소식"
              value={settings?.shopNewsEnabled ?? false}
              onValueChange={(next) => update.mutate({ shopNewsEnabled: next })}
              disabled={settingsDisabled}
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
    </View>
  );
}
