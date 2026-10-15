import { Text, View } from 'react-native';

import type { ReviewItem } from '../shopDetailToView';
import { Badge } from './Badge';
import { colors } from '@/shared/theme/colors';

type Props = {
  reviewCount: number;
  reviews: ReviewItem[];
};

// 리뷰 섹션: 본문 + 키워드 태그 + 날짜. 항목별 하단 구분선. 목록 없으면 빈 상태 문구(백엔드 노출 대기).
export function ReviewSection({ reviewCount, reviews }: Props) {
  return (
    <View className="gap-1">
      <Text className="text-heading-m font-pretendard-semibold" style={{ color: colors.text.strong }}>
        리뷰 <Text style={{ color: colors.text.subtle }}>{reviewCount}</Text>
      </Text>
      {reviews.length === 0 && (
        <Text className="font-pretendard text-[14px]" style={{ color: colors.text.faint }}>
          리뷰를 준비 중이에요
        </Text>
      )}
      <View>
        {reviews.map((review, i) => (
          <View
            key={i}
            className="gap-[7px]"
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line.divider }}
          >
            <View className="gap-1.5">
              <Text
                className="font-pretendard-medium text-[14px]"
                style={{ color: colors.text.base, lineHeight: 21, letterSpacing: -0.28 }}
              >
                {review.text}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {review.tags.map((tag, ti) => (
                  <Badge key={`${tag}-${ti}`} label={tag} bg={colors.surface.mutedAlt} color={colors.text.subtleAlt} fontSize={11} />
                ))}
              </View>
            </View>
            {review.date != null && (
              <Text className="text-right font-pretendard text-[12px]" style={{ color: colors.text.mutedAlt }}>
                {review.date}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
