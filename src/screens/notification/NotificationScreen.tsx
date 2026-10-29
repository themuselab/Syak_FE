import { router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openExternal } from '@/shared/lib/openExternal';
import { useAuthStore } from '@/shared/domain/auth/auth.store';
import {
  getReadAppNewsIds,
  markAppNewsRead,
} from '@/shared/domain/notification/appNewsLocal';
import {
  useAppNews,
  useMarkNotificationRead,
  useNotifications,
} from '@/shared/domain/notification/notification.queries';
import { useDeleteSlotAlerts, useSlotAlerts } from '@/shared/domain/notification/slotAlert.queries';
import type {
  AppNewsItem,
  NotificationItem as NotificationItemData,
} from '@/shared/domain/notification/notification.types';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';
import { useLoginGate } from '@/shared/ui/loginGate';

import { AppNewsCard } from './components/AppNewsCard';
import { EditExitModal } from './components/EditExitModal';
import { NotificationEmpty } from './components/NotificationEmpty';
import { NotificationItem } from './components/NotificationItem';
import { SlotAlertRequests } from './components/SlotAlertRequests';

// 알림함 (디자이너 시안 2026-10-29): [받은 알림] [신청 현황 N] 두 탭.
// 받은 알림 = 매장 알림(로그인 필요) + 앱 소식(로그인 무관) 병합 피드 (2026-07-18 BE 개편, docs/09 §3-5).
//   비로그인은 앱 소식만 + 하단 로그인 유도(QA 비로그인 #5). 앱 소식 읽음은 기기 로컬 관리.
// 신청 현황 = 빈자리 알림 신청 목록(docs/slot-alert.md). 로그인 필요 — 비회원이 탭하면 로그인 유도.
//   "편집" → 칩 × 로 지우고(로컬) "완료" 때 DELETE 1회. 지운 게 있는데 나가려 하면 확인 모달.
type FeedEntry =
  | { kind: 'shop'; time: string; shop: NotificationItemData }
  | { kind: 'news'; time: string; news: AppNewsItem };

type Tab = 'received' | 'requests';

export function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;
  const { requireLogin, loginModal } = useLoginGate();

  // 토스트 "내역보기" → /notifications?tab=requests
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(isLoggedIn && tabParam === 'requests' ? 'requests' : 'received');
  useEffect(() => {
    if (tabParam === 'requests' && isLoggedIn) setTab('requests');
  }, [tabParam, isLoggedIn]);

  const { data: notifications, isPending, isError, refetch } = useNotifications(isLoggedIn);
  const appNews = useAppNews();
  const markRead = useMarkNotificationRead();

  const slotAlerts = useSlotAlerts(isLoggedIn);
  const deleteAlerts = useDeleteSlotAlerts();
  const activeCount = (slotAlerts.data ?? []).filter((a) => a.status === 'active').length;

  // ── 신청 현황 편집 ──
  const [editing, setEditing] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [exitModal, setExitModal] = useState(false);
  // 확인 모달에서 "나가기"를 누르면 이어서 할 일(뒤로가기 / 탭 전환).
  const pendingExit = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(false);
  dirtyRef.current = editing && removed.size > 0;

  const stopEditing = () => {
    setEditing(false);
    setRemoved(new Set());
    deleteAlerts.reset();
  };

  // 지운 게 있으면 확인 모달, 없으면 편집만 끄고 바로 실행.
  const guardEdit = (action: () => void) => {
    if (dirtyRef.current) {
      pendingExit.current = action;
      setExitModal(true);
      return;
    }
    if (editing) stopEditing();
    action();
  };

  // 안드 하드웨어 뒤로·브라우저 뒤로처럼 헤더 < 를 거치지 않는 화면 제거도 여기서 막는다.
  const navigation = useNavigation();
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!dirtyRef.current) return;
        e.preventDefault();
        pendingExit.current = () => navigation.dispatch(e.data.action);
        setExitModal(true);
      }),
    [navigation],
  );

  const handleExit = () => {
    setExitModal(false);
    dirtyRef.current = false; // 이어지는 화면 제거가 다시 막히지 않게
    stopEditing();
    const next = pendingExit.current;
    pendingExit.current = null;
    next?.();
  };

  const handleDone = () => {
    if (removed.size === 0) {
      stopEditing();
      return;
    }
    deleteAlerts.mutate([...removed], { onSuccess: stopEditing });
  };

  const selectTab = (next: Tab) => {
    if (next === tab) return;
    if (next === 'requests') requireLogin(() => guardEdit(() => setTab(next)));
    else guardEdit(() => setTab(next));
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  // 앱 소식 로컬 읽음 — 화면 포커스마다 재조회(다른 화면에서 읽었을 가능성은 없지만 초기 로드 겸용).
  const [readNewsIds, setReadNewsIds] = useState<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      getReadAppNewsIds().then(setReadNewsIds);
    }, []),
  );

  const handleNewsPress = (item: AppNewsItem) => {
    if (!readNewsIds.has(item.id)) {
      setReadNewsIds((prev) => new Set(prev).add(item.id));
      markAppNewsRead(item.id); // fire-and-forget — 실패해도 다음 진입 시 미읽음 표시일 뿐
    }
    if (item.link) openExternal(item.link);
  };

  // 병합 시간순(최신 우선). ISO 문자열이라 문자열 비교 = 시간 비교.
  const feed: FeedEntry[] = useMemo(() => {
    const news = (appNews.data ?? []).map(
      (n) => ({ kind: 'news', time: n.publishedAt, news: n }) as FeedEntry,
    );
    const shops = isLoggedIn
      ? (notifications ?? []).map((n) => ({ kind: 'shop', time: n.createdAt, shop: n }) as FeedEntry)
      : [];
    return [...news, ...shops].sort((a, b) => b.time.localeCompare(a.time));
  }, [appNews.data, notifications, isLoggedIn]);

  // 로딩: 로그인은 두 소스 모두, 비로그인은 앱 소식만. 에러는 매장 알림 기준(전체 화면) —
  // 앱 소식 조회 실패는 병합에서 빠질 뿐 차단하지 않음(공지 성격이라 soft-fail).
  const loading = isLoggedIn ? isPending || appNews.isPending : appNews.isPending;

  const list =
    feed.length === 0 ? (
      isLoggedIn ? (
        <NotificationEmpty />
      ) : (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center text-body-m font-pretendard text-gray-500">
            로그인하면 즐겨찾는 샵의{'\n'}빈자리·소식 알림을 받아볼 수 있어요
          </Text>
        </View>
      )
    ) : (
      <FlatList
        data={feed}
        keyExtractor={(e) => (e.kind === 'shop' ? `shop-${e.shop.id}` : `news-${e.news.id}`)}
        renderItem={({ item: entry }) =>
          entry.kind === 'shop' ? (
            <NotificationItem
              item={entry.shop}
              onPress={() => {
                if (entry.shop.readAt === null) markRead(entry.shop.id); // 읽음 처리는 이동을 막지 않음
                router.push(`/shop/${entry.shop.shopId}`);
              }}
            />
          ) : (
            <AppNewsCard
              item={entry.news}
              read={readNewsIds.has(entry.news.id)}
              onPress={() => handleNewsPress(entry.news)}
            />
          )
        }
      />
    );

  const received = loading ? (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color={colors.primary[500]} />
    </View>
  ) : isLoggedIn && isError ? (
    <View className="flex-1 items-center justify-center gap-3">
      <Text className="font-pretendard-medium" style={{ fontSize: 15, color: colors.text.subtle }}>
        알림을 불러오지 못했어요
      </Text>
      <Pressable onPress={() => refetch()}>
        <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: colors.primary[500] }}>
          다시 시도
        </Text>
      </Pressable>
    </View>
  ) : (
    <View className="flex-1">
      {list}
      {/* 비로그인: 앱 소식은 위에 노출, 로그인 유도는 화면 하단(QA 비로그인 #5 원안) */}
      {!isLoggedIn && (
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
      )}
    </View>
  );

  // "편집"/"완료"는 신청 현황에 알림이 하나라도 있을 때만.
  const canEdit = tab === 'requests' && (slotAlerts.data?.length ?? 0) > 0;
  const headerRight = canEdit ? (
    <Pressable
      onPress={editing ? handleDone : () => setEditing(true)}
      disabled={deleteAlerts.isPending}
      hitSlop={8}
    >
      {deleteAlerts.isPending ? (
        <ActivityIndicator size="small" color={colors.primary[500]} />
      ) : (
        <Text
          className="font-pretendard-semibold"
          style={{ fontSize: 15, color: editing ? colors.primary[500] : colors.text.muted }}
        >
          {editing ? '완료' : '편집'}
        </Text>
      )}
    </Pressable>
  ) : null;

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="알림함" right={headerRight} onBack={() => guardEdit(goBack)} />

      <View className="flex-row gap-2 px-5 pb-4">
        <TabPill label="받은 알림" active={tab === 'received'} onPress={() => selectTab('received')} />
        <TabPill
          label="신청 현황"
          count={isLoggedIn ? activeCount : undefined}
          active={tab === 'requests'}
          onPress={() => selectTab('requests')}
        />
      </View>

      {tab === 'received' ? (
        received
      ) : (
        <View className="flex-1">
          {deleteAlerts.isError && (
            <Text className="px-5 pb-2 text-caption-m font-pretendard" style={{ color: colors.status.error }}>
              삭제하지 못했어요. 다시 시도해 주세요
            </Text>
          )}
          <SlotAlertRequests
            alerts={slotAlerts.data}
            isPending={slotAlerts.isPending}
            isError={slotAlerts.isError}
            onRetry={() => slotAlerts.refetch()}
            editing={editing}
            removed={removed}
            onRemove={(id) => setRemoved((prev) => new Set(prev).add(id))}
            bottomPad={insets.bottom + 24}
          />
        </View>
      )}

      <EditExitModal
        visible={exitModal}
        onContinue={() => {
          pendingExit.current = null;
          setExitModal(false);
        }}
        onExit={handleExit}
      />
      {loginModal}
    </View>
  );
}

// 알림함 상단 알약 탭. 선택 = 진한 채움, 나머지 = 흰 바탕 테두리. 신청 현황엔 진행 중 개수.
function TabPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1 rounded-full px-3.5 py-2"
      style={{
        borderWidth: 1,
        borderColor: active ? colors.text.strong : colors.line.base,
        backgroundColor: active ? colors.text.strong : colors.white,
      }}
    >
      <Text
        className="text-label-m font-pretendard-semibold"
        style={{ color: active ? colors.white : colors.text.muted }}
      >
        {label}
      </Text>
      {count != null && (
        <Text
          className="text-label-m font-pretendard-semibold"
          style={{ color: active ? colors.white : colors.primary[500] }}
        >
          {count}
        </Text>
      )}
    </Pressable>
  );
}
