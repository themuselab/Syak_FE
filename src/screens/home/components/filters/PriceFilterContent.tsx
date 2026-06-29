import { Pressable, Text, View } from 'react-native';

import { useHomeFilterStore, type PriceKey } from '../../useHomeFilterStore';

const OPTIONS: { key: PriceKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '1', label: '1만원대' },
  { key: '2', label: '2만원대' },
  { key: '3', label: '3만원대' },
];

const SELECTED = '#c9516e';

export function PriceFilterContent({ onSelect }: { onSelect: () => void }) {
  const price = useHomeFilterStore((s) => s.price);
  const setPrice = useHomeFilterStore((s) => s.setPrice);
  return (
    <View className="gap-0.5">
      {OPTIONS.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => {
            setPrice(o.key);
            onSelect();
          }}
          className="items-center"
          style={{ paddingVertical: 12, paddingHorizontal: 20 }}
        >
          <Text
            className="text-body-m font-pretendard-medium"
            style={{ color: price === o.key ? SELECTED : '#1a1a1a' }}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
