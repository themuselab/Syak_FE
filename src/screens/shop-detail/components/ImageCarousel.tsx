import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';

type Props = {
  photos: string[];
};

// 가로 스크롤 이미지 캐러셀. 사진 없으면 회색 placeholder 유지(레이아웃 보존).
// 현재 백엔드는 대표 이미지 1장만 제공 — 여러 장(detail.images)은 백엔드 노출 대기(갭).
export function ImageCarousel({ photos }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ height: 152 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {photos.length > 0
        ? photos.map((uri, i) => (
            <Image
              key={`${uri}-${i}`}
              source={{ uri }}
              style={{ width: 126, height: 152, borderRadius: 20 }}
              contentFit="cover"
            />
          ))
        : Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={{ width: 126, height: 152, borderRadius: 20, backgroundColor: '#e3e3e3' }}
            />
          ))}
    </ScrollView>
  );
}
