import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import type {
  AppNewsItem,
  NotificationItem as NotificationItemData,
} from '@/shared/domain/notification/notification.types';
import { colors } from '@/shared/theme/colors';
import { BackHeader } from '@/shared/ui/BackHeader';

import { AppNewsCard } from './components/AppNewsCard';
import { NotificationEmpty } from './components/NotificationEmpty';
import { NotificationItem } from './components/NotificationItem';

// 알림 탭 = 매장 알림(로그인 필요) + 앱 소식(로그인 무관) 병합 피드 (2026-07-18 BE 개편, docs/09 §3-5).
// 비로그인은 앱 소식만 + 하단 로그인 유도(QA 비로그인 #5). 앱 소식 읽음은 기기 로컬 관리.
type FeedEntry =
  | { kind: 'shop'; time: string; shop: NotificationItemData }
  | { kind: 'news'; time: string; news: AppNewsItem };

export function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = user != null;

  const { data: notifications, isPending, isError, refetch } = useNotifications(isLoggedIn);
  const appNews = useAppNews();
  const markRead = useMarkNotificationRead();

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
    if (item.link) Linking.openURL(item.link).catch(() => {});
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

  return (
    <View className="flex-1 bg-white">
      <BackHeader title="알림" />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      ) : isLoggedIn && isError ? (
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
      )}
    </View>
  );
}
