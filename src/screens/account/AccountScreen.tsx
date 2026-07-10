import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import type { SocialProvider } from '@/shared/domain/auth/auth.types';
import { useMe, useWithdraw } from '@/shared/domain/user/user.queries';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';
import { LoginPromptModal } from '@/shared/ui/LoginPromptModal';

import { WithdrawConfirmModal } from './components/WithdrawConfirmModal';

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  kakao: '카카오',
  naver: '네이버',
  apple: '애플',
};

// 계정 관리 (design.pen ZEDJC). 마이페이지 '계정 관리' 버튼에서 진입(회원 전용 노출이지만
// 딥링크 대비 비회원 게이팅 유지 — 알림 화면과 동일 정책).
// 닉네임 행 → 닉네임 설정 화면, 계정 탈퇴 → 확인 모달(o8fLU1) → DELETE /users/me → 로그인 화면.
export function AccountScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;

  const { data: me } = useMe(isLoggedIn);
  const withdraw = useWithdraw();
  const [modalVisible, setModalVisible] = useState(false);

  // 서버 파생 우선, 조회 중엔 store 스냅샷 폴백(마이페이지와 동일).
  const nickname = me?.nickname ?? user?.nickname ?? null;
  const linkedLabel =
    me && me.linkedProviders.length > 0
      ? `${me.linkedProviders.map((p) => PROVIDER_LABEL[p]).join(', ')} 계정`
      : '-';

  const handleWithdraw = () => {
    if (withdraw.isPending) return;
    withdraw.mutate(undefined, {
      onSuccess: () => {
        setModalVisible(false);
        router.replace('/login'); // BE 체크리스트: 탈퇴 후 로컬 초기화 + 로그인 이동 (사용자 확정)
      },
      onError: () => {
        Alert.alert('탈퇴에 실패했어요', '잠시 후 다시 시도해 주세요.');
      },
    });
  };

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="계정 관리" />
      {!isLoggedIn ? (
        <LoginPromptModal
          visible
          onClose={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          onPressLogin={() => router.replace('/login')}
        />
      ) : (
        <>
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            {/* 닉네임 행 — 값 없으면 '설정하기'. 탭 → 닉네임 설정 화면 */}
            <Pressable
              onPress={() => router.push('/nickname')}
              className="flex-row items-center justify-between"
              style={{ paddingVertical: 12 }}
            >
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: '#555555' }}>
                닉네임
              </Text>
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: '#adb5bd' }}>
                {nickname ?? '설정하기'}
              </Text>
            </Pressable>

            {/* 연결된 계정 행 — 표시 전용 */}
            <View
              className="flex-row items-center justify-between"
              style={{ paddingVertical: 12 }}
            >
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: '#555555' }}>
                연결된 계정
              </Text>
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: '#adb5bd' }}>
                {linkedLabel}
              </Text>
            </View>
          </View>

          <View className="flex-1" />

          {/* 계정 탈퇴 — 로그아웃 버튼과 동일 스타일(error 테두리) */}
          <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
            <Pressable
              onPress={() => setModalVisible(true)}
              className="items-center justify-center rounded-sm bg-white"
              style={{ paddingVertical: 12, borderWidth: 1, borderColor: colors.error[500] }}
            >
              <Text
                className="font-pretendard-semibold"
                style={{ fontSize: 16, color: colors.error[500] }}
              >
                계정 탈퇴
              </Text>
            </Pressable>
          </View>

          <WithdrawConfirmModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onConfirm={handleWithdraw}
            confirming={withdraw.isPending}
          />
        </>
      )}
    </View>
  );
}
