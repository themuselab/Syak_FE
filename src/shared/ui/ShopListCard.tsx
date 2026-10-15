import { Image } from 'expo-image';
import { Clock, Star } from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { sizedImage } from '@/shared/lib/image';
import { colors } from '@/shared/theme/colors';

// 카드가 실제로 쓰는 필드만의 구조적 타입 — 홈 ShopCardView(지도 필드 포함)와
// 즐겨찾기 화면의 상세 파생 카드가 모두 이 형태를 만족한다.
export type ShopCardInfo = {
  name: string;
  dealLabel: string | null; // "첫방문 특가"
  priceTier: string | null; // "2만원대"
  locationLabel: string; // "320m 전농동"
  availability: string | null; // "오늘 15:00 예약 가능"
  previewReview: string | null;
  favorite: boolean;
  photos: string[];
  reviewCount?: number; // 컴팩트 카드에서 이름 옆 "리뷰 98"
};

// 사진은 세로로 긴 3:4 비율로 가로 스크롤(시안). 마지막 장이 살짝 잘려 보여야 넘겨볼 수 있다는 게 읽힌다.
const PHOTO_W = 112;
const PHOTO_H = 150;

type Props = {
  shop: ShopCardInfo;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  /**
   * feed    = 홈 목록: 사진 가로 스크롤 + 예약 가능 시각 + 리뷰 한 줄
   * compact = 즐겨찾기 목록: 왼쪽 썸네일 1장 + 이름·리뷰 수 + 메타 한 줄 (시안 2026-10-15 "즐겨찾기")
   */
  variant?: 'feed' | 'compact';
};

// 매장 카드 (디자이너 시안 2026-10-15). 홈 목록·즐겨찾기 목록 공용.
//   이름                                  ★
//   첫방문 특가 · 2만원대 · 320m 전농동
//   ⏰ 오늘 15:00 예약 가능
//   [사진][사진][사진]→
//   [리뷰 한 줄]
export function ShopListCard({ shop, onPress, onToggleFavorite, variant = 'feed' }: Props) {
  // 메타 줄: 값이 있는 것만 · 로 잇는다. 이벤트 문구만 핑크.
  const meta: { text: string; pink?: boolean }[] = [];
  if (shop.dealLabel) meta.push({ text: shop.dealLabel, pink: true });
  if (shop.priceTier) meta.push({ text: shop.priceTier });
  if (shop.locationLabel) meta.push({ text: shop.locationLabel });

  const metaRow = meta.length > 0 && (
    // 한 줄 고정. 실제 이벤트 문구는 "첫방문50% 할인 /손젤 22.500/발젤…"처럼 길어서 줄바꿈되면
    // 둘째 줄이 "•"로 시작했다. 이벤트 문구만 줄어들며 말줄임되고 가격·동네는 항상 보인다.
    <View className="flex-row items-center">
      {meta.map((m, i) => (
        <Fragment key={`${i}-${m.text}`}>
          {i > 0 && (
            <Text className="mx-1.5 text-caption-m" style={{ color: colors.line.strong }}>
              •
            </Text>
          )}
          <Text
            className="text-body-m font-pretendard"
            numberOfLines={1}
            style={{
              color: m.pink ? colors.primary[500] : colors.text.subtle,
              flexShrink: m.pink ? 1 : 0,
            }}
          >
            {m.text}
          </Text>
        </Fragment>
      ))}
    </View>
  );

  const star = (
    <Pressable onPress={onToggleFavorite} hitSlop={8}>
      <Star
        size={24}
        color={shop.favorite ? colors.accent.favorite : colors.gray[300]}
        fill={shop.favorite ? colors.accent.favorite : 'transparent'}
      />
    </Pressable>
  );

  if (variant === 'compact') {
    const thumb = shop.photos[0];
    return (
      <Pressable
        onPress={onPress}
        className="mx-5 flex-row items-center gap-3 border-b py-4"
        style={{ borderColor: colors.line.divider }}
      >
        {thumb ? (
          <Image
            source={{ uri: sizedImage(thumb, 'thumb') }}
            recyclingKey={thumb}
            cachePolicy="memory-disk"
            style={{ width: 64, height: 64, borderRadius: 8 }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: colors.line.base }} />
        )}
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Text
              className="text-heading-m font-pretendard-semibold"
              numberOfLines={1}
              style={{ color: colors.text.strong, flexShrink: 1 }}
            >
              {shop.name}
            </Text>
            {shop.reviewCount != null && (
              <Text className="text-caption-m font-pretendard" style={{ color: colors.text.faint }}>
                리뷰 {shop.reviewCount}
              </Text>
            )}
          </View>
          {metaRow}
        </View>
        {star}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} className="border-b py-4" style={{ borderColor: colors.line.divider }}>
      <View className="flex-row items-start justify-between px-5">
        <View className="flex-1 gap-1 pr-2">
          <Text
            className="text-heading-m font-pretendard-semibold"
            numberOfLines={1}
            style={{ color: colors.text.strong }}
          >
            {shop.name}
          </Text>

          {metaRow}

          {shop.availability && (
            <View className="flex-row items-center gap-1">
              <Clock size={14} color={colors.primary[500]} />
              <Text className="text-body-m font-pretendard-medium" style={{ color: colors.primary[500] }}>
                {shop.availability}
              </Text>
            </View>
          )}
        </View>

        {star}
      </View>

      {/* 작업 사진(포트폴리오). 눌러도 카드와 같이 상세로 간다. 사진이 없는 샵은 줄을 비운다. */}
      {shop.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 4, paddingHorizontal: 20 }}
        >
          {shop.photos.map((uri) => (
            <Pressable key={uri} onPress={onPress}>
              <Image
                // 원본(최대 1MB) 대신 카드 크기로 줄인 사진 — 목록 로딩·앱 메모리(크래시) 대책
                source={{ uri: sizedImage(uri, 'card') }}
                recyclingKey={uri}
                cachePolicy="memory-disk"
                style={{
                  width: PHOTO_W,
                  height: PHOTO_H,
                  borderRadius: 6,
                  backgroundColor: colors.surface.mutedAlt,
                }}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {shop.previewReview && (
        <View className="mx-5 mt-2.5 rounded-sm px-3 py-2.5" style={{ backgroundColor: colors.surface.muted }}>
          <Text className="text-body-m font-pretendard" numberOfLines={2} style={{ color: colors.text.muted }}>
            {shop.previewReview}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
