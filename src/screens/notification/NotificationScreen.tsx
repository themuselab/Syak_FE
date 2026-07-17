import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/shared/domain/auth/auth.store';
import {
  useMarkNotificationRead,
  useNotifications,
} from '@/shared/domain/notification/notification.queries';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';

import { NotificationEmpty } from './components/NotificationEmpty';
import { NotificationItem } from './components/NotificationItem';

// 비회원: 팝업 차단 대신 화면 자체를 보여주고 하단에 로그인 유도(QA 비로그인 #5 개선 요청).
// 문구·레이아웃은 디자인 부재 — 임시(디자이너 확인 항목). "앱 소식" 목록 노출은 BE 알림 타입 신설 후.
function GuestNotificationView() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-center text-body-m font-pretendard text-gray-500">
          로그인하면 즐겨찾는 샵의{'\n'}빈자리·소식 알림을 받아볼 수 있어요
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
        <Pressable
          onPress={() => router.replace('/login')}
          className="h-12 items-center justify-center rounded-sm bg-primary-500"
        >
          <Text className="font-pretendard-semibold text-white" style={{ fontSize: 16 }}>
            로그인 하러가기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// 디자인: designs/알림/*, designs/design.pen (알림 페이지, frame SXtVD)
// GET /notifications 연동 (오늘 생성분만, 인증 필요). 비회원은 인화면 안내(쿼리 미발생).
// 탭 → 읽음 처리(미읽음만, fire-and-forget) + 샵 상세 이동. 로딩/에러 상태는 디자인 미제공 — 임시 처리.
export function NotificationScreen() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;

  const { data: notifications, isPending, isError, refetch } = useNotifications(isLoggedIn);
  const markRead = useMarkNotificationRead();

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="알림" />
      {!isLoggedIn ? (
        <GuestNotificationView />
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
            <NotificationItem
              item={item}
              onPress={() => {
                if (item.readAt === null) markRead(item.id); // 읽음 처리는 이동을 막지 않음
                router.push(`/shop/${item.shopId}`);
              }}
            />
          )}
        />
      )}
    </View>
  );
}
