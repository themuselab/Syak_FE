import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSignOut } from '@/shared/domain/auth/auth.queries';
import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';

import { RadiusSlider } from './components/RadiusSlider';
import { SettingToggleRow } from './components/SettingToggleRow';

// 디자인: designs/마이페이지/*, design.pen (M6Lry 회원·OFF / y1ARc 회원·ON+슬라이더 / nnRIy 비회원)
// 프론트 UI 전용 — 회원/비회원은 useAuthStore.user로 분기, 설정은 로컬 상태. 백엔드 연동은 추후.
const FAVORITE_COLOR = '#FFC107'; // 즐겨찾기 골드(기존 DetailHeader와 동일)
const iconLocation = require('../../../assets/icons/my-location-permission.png');
const iconNear = require('../../../assets/icons/my-near-alarm.png');
const iconAppNews = require('../../../assets/icons/my-app-news.png');

export function MyScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useSignOut();
  const isLoggedIn = user != null;

  // 알림 설정(로컬 상태). 추후 GET/PATCH /notifications/settings로 대체.
  const [locationPermission, setLocationPermission] = useState(false);
  const [nearAlarm, setNearAlarm] = useState(false);
  const [radiusKm, setRadiusKm] = useState(3);
  const [favoriteAlarm, setFavoriteAlarm] = useState(false);
  const [appNews, setAppNews] = useState(false);

  const subtitle = isLoggedIn ? (user.nickname ?? '닉네임 미설정') : '로그인하고 편리하게 샥-';

  const handleLogout = () => {
    // useSignOut이 onSettled에서 로컬 세션을 비운다(성공/실패 모두). 이동만 처리.
    signOut.mutate(undefined, { onSettled: () => router.replace('/login') });
  };

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="마이" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <View style={{ gap: 20 }}>
          <Text
            className="font-pretendard-semibold text-black"
            style={{ fontSize: 18, letterSpacing: -0.36 }}
          >
            {subtitle}
          </Text>

          <View style={{ gap: 16 }}>
            {/* 즐겨찾기 메뉴 (탭 동작은 즐겨찾기 화면 확보 후 연결 예정) */}
            <View className="flex-row items-center gap-2" style={{ paddingVertical: 12 }}>
              <Star size={16} color={FAVORITE_COLOR} fill={FAVORITE_COLOR} />
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: '#555555' }}>
                즐겨찾기
              </Text>
            </View>

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
              value={nearAlarm}
              onValueChange={setNearAlarm}
              disabled={!isLoggedIn}
            />
            {nearAlarm && <RadiusSlider value={radiusKm} onChange={setRadiusKm} />}
            <SettingToggleRow
              label="즐겨찾기 알림"
              value={favoriteAlarm}
              onValueChange={setFavoriteAlarm}
              disabled={!isLoggedIn}
            />
            <SettingToggleRow
              icon={iconAppNews}
              label="앱 소식"
              value={appNews}
              onValueChange={setAppNews}
              disabled={!isLoggedIn}
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
