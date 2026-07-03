import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { useNotifications } from '@/shared/domain/notification/notification.queries';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';
import { LoginPromptModal } from '@/shared/ui/LoginPromptModal';

import { NotificationEmpty } from './components/NotificationEmpty';
import { NotificationItem } from './components/NotificationItem';

// 디자인: designs/알림/*, designs/design.pen (알림 페이지, frame SXtVD)
// GET /notifications 연동 (오늘 생성분만, 인증 필요). 비회원은 LoginPromptModal 게이팅(쿼리 미발생).
// 로딩/에러 상태는 디자인 미제공 — 임시 처리.
export function NotificationScreen() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;

  const { data: notifications, isPending, isError, refetch } = useNotifications(isLoggedIn);

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="알림" />
      {!isLoggedIn ? (
        // 비회원: 빈 배경 + 로그인 유도. 닫으면 진입 전 화면으로 복귀.
        // 딥링크 등 히스토리 없이 진입하면 back()이 no-op이라 모달이 안 닫힘 → 홈으로 대체.
        // 로그인 이동은 push가 아니라 replace — push면 이 화면(과 모달)이 스택에 남아 로그인 화면을 계속 덮는다.
        <LoginPromptModal
          visible
          onClose={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          onPressLogin={() => router.replace('/login')}
        />
      ) : isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="font-pretendard-medium" style={{ fontSize: 15, color: '#7e7e7e' }}>
            알림을 불러오지 못했어요
          </Text>
          <Pressable onPress={() => refetch()}>
            <Text
              className="font-pretendard-semibold"
              style={{ fontSize: 15, color: colors.primary[500] }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <NotificationEmpty />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => router.push(`/shop/${item.shopId}`)} />
          )}
        />
      )}
    </View>
  );
}
