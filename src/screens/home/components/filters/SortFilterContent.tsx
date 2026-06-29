import { Pressable, Text, View } from 'react-native';

import { useHomeFilterStore, type SortKey } from '../../useHomeFilterStore';

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: '기본순' },
  { key: 'price_asc', label: '가격 낮은순' },
  { key: 'price_desc', label: '가격 높은순' },
  { key: 'partner', label: '샥 파트너' },
];

const SELECTED = '#c9516e'; // 정렬 선택 텍스트 (디자인 원값)

export function SortFilterContent({ onSelect }: { onSelect: () => void }) {
  const sort = useHomeFilterStore((s) => s.sort);
  const setSort = useHomeFilterStore((s) => s.setSort);
  return (
    <View className="gap-0.5">
      {OPTIONS.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => {
            setSort(o.key);
            onSelect();
          }}
          className="items-center"
          style={{ paddingVertical: 12, paddingHorizontal: 20 }}
        >
          <Text
            className="text-body-m font-pretendard-medium"
            style={{ color: sort === o.key ? SELECTED : '#1a1a1a' }}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
