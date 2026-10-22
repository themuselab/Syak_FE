import { Platform, ScrollView } from 'react-native';

import { SERVICE_FIELDS } from '../serviceFields';
import { useHomeFilterStore } from '../useHomeFilterStore';
import { CategoryChip } from './CategoryChip';

// 홈 상단(검색바 아래) 지도 위 칩 줄 — 샥 파트너 + 시술 분야.
// 하나를 누르면 그것만 골라지고, 칩 줄은 사라지며 검색바가 "< 네일 ✕" 헤더로 바뀐다
// (디자이너 시안 2026-10-15 "시술분야 선택시"). 해제는 헤더의 < 또는 ✕.
export function CategoryChipBar() {
  const setPicked = useHomeFilterStore((s) => s.setPicked);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // 칩 밖 빈 공간의 탭은 지도로 흘려보낸다(키보드 닫기·포커스 해제 — QA #60).
      // 단 웹(= 앱 웹뷰)에선 box-none이 스크롤 영역 자체를 터치 불가로 만들어 아이폰에서 칩 줄이
      // 옆으로 안 밀렸다(사용자 제보 2026-10-22) — 웹은 스크롤 영역이 터치를 받게 둔다.
      pointerEvents={Platform.OS === 'web' ? 'auto' : 'box-none'}
      // 그림자가 잘리지 않게 위아래 여백을 준다.
      contentContainerStyle={{ gap: 6, paddingHorizontal: 20, paddingVertical: 4 }}
    >
      <CategoryChip label="샥 파트너샵" brand onPress={() => setPicked({ kind: 'partner' })} />
      {SERVICE_FIELDS.map((f) => (
        <CategoryChip key={f} label={f} onPress={() => setPicked({ kind: 'category', label: f })} />
      ))}
    </ScrollView>
  );
}
