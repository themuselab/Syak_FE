import { Pressable, Text, View } from 'react-native';

import { useHomeFilterStore, type PriceKey } from '../../useHomeFilterStore';

const OPTIONS: { key: PriceKey | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: '1', label: '1만원대' },
  { key: '2', label: '2만원대' },
  { key: '3', label: '3만원대' },
];

const SELECTED = '#c9516e';

// 가격대 복수 선택(QA #14 — BE price_tiers 콤마 구분 지원). '전체' = 전부 해제(빈 배열).
// 복수 유지형이라 선택 즉시 닫지 않음 — 닫기는 FilterView 하단 버튼(시술/시간과 동일).
export function PriceFilterContent() {
  const prices = useHomeFilterStore((s) => s.prices);
  const setPrices = useHomeFilterStore((s) => s.setPrices);

  const toggle = (key: PriceKey) =>
    setPrices(prices.includes(key) ? prices.filter((p) => p !== key) : [...prices, key]);

  return (
    <View className="gap-0.5">
      {OPTIONS.map((o) => {
        const selected = o.key === 'all' ? prices.length === 0 : prices.includes(o.key);
        return (
          <Pressable
            key={o.key}
            onPress={() => (o.key === 'all' ? setPrices([]) : toggle(o.key))}
            className="items-center"
            style={{ paddingVertical: 12, paddingHorizontal: 20 }}
          >
            <Text
              className="text-body-m font-pretendard-medium"
              style={{ color: selected ? SELECTED : '#1a1a1a' }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
