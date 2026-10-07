import { Clock, Percent } from 'lucide-react-native';
import { ScrollView } from 'react-native';

import { useHomeFilterStore } from '../useHomeFilterStore';
import { FilterChip } from './FilterChip';

// 홈 상단(검색바 아래) 지도 위에 얹는 토글 칩 줄 — 디자인 리뷰 반영.
// 자주 쓰는 3개(당일 예약 / 할인·이벤트 / 예약 가능)만 올리고, 상세 조건(기본순·시술·가격·
// 지역·예약 시간)은 바텀시트 칩바(FilterChipBar)에 그대로 둔다.
// 지도 위라 그림자(elevated)로 배경과 분리하고, 가로 스크롤은 좁은 화면 대비.
export function MapToggleChipBar() {
  const toggles = useHomeFilterStore((s) => s.toggles);
  const toggle = useHomeFilterStore((s) => s.toggle);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // 칩 밖 빈 공간의 탭은 지도로 흘려보낸다(키보드 닫기·포커스 해제 — QA #60).
      pointerEvents="box-none"
      contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}
    >
      <FilterChip
        label="당일 예약"
        selected={toggles.sameDay}
        elevated
        leftIcon={(c) => <Clock size={14} color={c} />}
        onPress={() => toggle('sameDay')}
      />
      <FilterChip
        label="할인·이벤트"
        selected={toggles.discount}
        elevated
        leftIcon={(c) => <Percent size={14} color={c} />}
        onPress={() => toggle('discount')}
      />
      <FilterChip
        label="예약 가능"
        selected={toggles.available}
        elevated
        onPress={() => toggle('available')}
      />
    </ScrollView>
  );
}
