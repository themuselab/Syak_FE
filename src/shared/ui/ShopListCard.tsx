import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

const FAVORITE_COLOR = '#FFC107';

// 목록 카드에 가로로 늘어놓는 작업 사진 수(백엔드도 목록 응답을 3장으로 자른다).
const MAX_PHOTOS = 3;

// 카드가 실제로 쓰는 필드만의 구조적 타입 — 홈 ShopCardView(지도 필드 포함)와
// 즐겨찾기 화면의 상세 파생 카드가 모두 이 형태를 만족한다.
export type ShopCardInfo = {
  name: string;
  reviewCount: number | null; // null이면 숨김
  // 한 줄 소개. 백엔드 introduction이 비면 카테고리 → 주소 순으로 대체한다(shopToView).
  subtitle: string;
  badges: string[];
  todayOpen: boolean;
  favorite: boolean;
  photos: string[]; // 포트폴리오(작업 사진). 없으면 대표 이미지 1장, 그것도 없으면 빈 배열
};

function Badge({ label }: { label: string }) {
  const isDeal = label.includes('특가') || label.includes('이벤트');
  return (
    <View
      className="rounded px-1.5 py-0.5"
      style={{ backgroundColor: isDeal ? colors.primary[50] : colors.gray[100] }}
    >
      <Text
        className="text-caption-s font-pretendard-medium"
        numberOfLines={1}
        style={{ color: isDeal ? colors.primary[600] : colors.gray[600] }}
      >
        {label}
      </Text>
    </View>
  );
}

// 영업 상태 배지. 백엔드가 주는 건 "오늘 영업하는 날인가"(today_open) 한 건이라
// 마감 시각에 맞춰 바뀌지는 않는다 — 영업시간 데이터가 들어오면 그때 시각 기준으로 바꾼다.
function OpenBadge({ open }: { open: boolean }) {
  return (
    <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: open ? '#e6f7ed' : colors.gray[100] }}>
      <Text
        className="text-caption-s font-pretendard-medium"
        style={{ color: open ? '#0f9d58' : colors.gray[600] }}
      >
        {open ? '영업 중' : '영업 종료'}
      </Text>
    </View>
  );
}

type Props = {
  shop: ShopCardInfo;
  onPress?: () => void;
  onToggleFavorite?: () => void;
};

// 매장 카드: 이름/리뷰/한 줄 소개/배지 + 즐겨찾기 별, 그 아래 작업 사진 가로 3장.
// 사진을 눌러도 카드와 같이 상세로 간다(네이버 플레이스식). (홈 목록·즐겨찾기 목록 공용)
export function ShopListCard({ shop, onPress, onToggleFavorite }: Props) {
  const photos = shop.photos.slice(0, MAX_PHOTOS);

  return (
    <Pressable onPress={onPress} className="border-b px-5 py-4" style={{ borderColor: '#f3f3f3' }}>
      <View className="flex-row items-start justify-between">
        {/* flex-1: 배지 줄바꿈(flex-wrap)이 동작하려면 컬럼에 폭 제약이 필요 (QA #46) */}
        <View className="flex-1 gap-1 pr-2">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-heading-m font-pretendard-semibold text-gray-900"
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {shop.name}
            </Text>
            {shop.reviewCount != null && (
              <Text className="text-caption-m font-pretendard-medium" style={{ color: '#adb5bd' }}>
                리뷰 {shop.reviewCount}
              </Text>
            )}
          </View>
          <Text className="text-body-m font-pretendard text-gray-600" numberOfLines={1}>
            {shop.subtitle}
          </Text>
          <View className="flex-row flex-wrap items-center gap-1">
            {shop.badges.map((b) => (
              <Badge key={b} label={b} />
            ))}
            <OpenBadge open={shop.todayOpen} />
          </View>
        </View>
        <Pressable onPress={onToggleFavorite} hitSlop={8}>
          <Star
            size={24}
            color={shop.favorite ? FAVORITE_COLOR : colors.gray[300]}
            fill={shop.favorite ? FAVORITE_COLOR : 'transparent'}
          />
        </Pressable>
      </View>

      {/* 작업 사진(포트폴리오). 사진이 없는 샵은 줄 자체를 비워 카드 높이를 줄인다. */}
      {photos.length > 0 && (
        <View className="mt-2.5 flex-row gap-1">
          {photos.map((uri) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{ flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: '#e3e3e3' }}
              contentFit="cover"
            />
          ))}
          {/* 사진이 3장 미만이면 빈 칸으로 채워 폭(1/3)을 고정한다 — 2장이 반반으로 커지지 않게. */}
          {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, i) => (
            <View key={`gap-${i}`} style={{ flex: 1 }} />
          ))}
        </View>
      )}
    </Pressable>
  );
}
