import { ScrollView } from 'react-native';

import { SERVICE_FIELDS } from '../serviceFields';
import { useHomeFilterStore } from '../useHomeFilterStore';
import { CategoryChip } from './CategoryChip';

// 홈 상단(검색바 아래) 지도 위 시술분야 칩 — 시트를 열지 않고 바로 거르는 용도.
// 바텀시트 "시술" 필터와 같은 store 필드(serviceFields)라 양쪽 선택 상태가 항상 같다.
export function CategoryChipBar() {
  const serviceFields = useHomeFilterStore((s) => s.serviceFields);
  const setServiceFields = useHomeFilterStore((s) => s.setServiceFields);

  const toggle = (f: string) =>
    setServiceFields(
      serviceFields.includes(f) ? serviceFields.filter((x) => x !== f) : [...serviceFields, f],
    );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // 칩 밖 빈 공간의 탭은 지도로 흘려보낸다(키보드 닫기·포커스 해제 — QA #60).
      pointerEvents="box-none"
      contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}
    >
      {SERVICE_FIELDS.map((f) => (
        <CategoryChip
          key={f}
          label={f}
          selected={serviceFields.includes(f)}
          onPress={() => toggle(f)}
        />
      ))}
    </ScrollView>
  );
}
