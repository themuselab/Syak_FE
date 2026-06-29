import { Text, View } from 'react-native';

import type { ReviewItem } from '../mockShopDetail';
import { Badge } from './Badge';

type Props = {
  reviewCount: number;
  reviews: ReviewItem[];
};

// 리뷰 섹션: 본문 + 키워드 태그 + 날짜. 항목별 하단 구분선.
export function ReviewSection({ reviewCount, reviews }: Props) {
  return (
    <View className="gap-4">
      <Text
        className="font-pretendard-medium text-[18px]"
        style={{ color: '#1a1a1a', letterSpacing: -0.36 }}
      >
        리뷰 {reviewCount}
      </Text>
      <View>
        {reviews.map((review, i) => (
          <View
            key={i}
            className="gap-[7px]"
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' }}
          >
            <View className="gap-1.5">
              <Text
                className="font-pretendard-medium text-[14px]"
                style={{ color: '#5b5b5b', lineHeight: 21, letterSpacing: -0.28 }}
              >
                {review.text}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {review.tags.map((tag, ti) => (
                  <Badge key={`${tag}-${ti}`} label={tag} bg="#f1f1f1" color="#7a7a7a" fontSize={11} />
                ))}
              </View>
            </View>
            <Text className="text-right font-pretendard text-[12px]" style={{ color: '#5b5b5b' }}>
              {review.date}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
