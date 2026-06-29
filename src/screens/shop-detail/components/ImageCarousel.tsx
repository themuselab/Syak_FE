import { ScrollView, View } from 'react-native';

type Props = {
  count: number;
};

// 가로 스크롤 이미지 캐러셀. Phase 1: 회색 placeholder (실제 이미지는 백엔드 연동 시).
export function ImageCarousel({ count }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ height: 152 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ width: 126, height: 152, borderRadius: 20, backgroundColor: '#e3e3e3' }}
        />
      ))}
    </ScrollView>
  );
}
