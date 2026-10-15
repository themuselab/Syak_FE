import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { useBottomInset } from '@/shared/lib/safeArea';
import { colors } from '@/shared/theme/colors';

import { PRICE_MAX, type SortKey, useHomeFilterStore } from '../../useHomeFilterStore';
import { PriceRangeSlider } from './PriceRangeSlider';
import { SelectChip } from './SelectChip';
import { TimeFilterContent } from './TimeFilterContent';

// 통합 필터 패널(디자이너 시안 2026-10-15 "필터" 프레임). 바텀시트가 80%로 올라가며 이 화면을 보여준다.
// 정렬·가격·예약시간을 한 화면에서 고르고, 고르는 즉시 목록·핀에 반영된다(적용 버튼 없음 — 닫기만).

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: '관련도순' },
  { key: 'review', label: '리뷰 많은순' },
  { key: 'price_asc', label: '가격 낮은순' },
];

export function FilterPanel({ onClose }: { onClose: () => void }) {
  const bottomInset = useBottomInset();
  const sort = useHomeFilterStore((s) => s.sort);
  const setSort = useHomeFilterStore((s) => s.setSort);
  const priceRange = useHomeFilterStore((s) => s.priceRange);
  const setPriceRange = useHomeFilterStore((s) => s.setPriceRange);

  return (
    <View className="flex-1">
      <View className="border-b" style={{ borderColor: colors.line.divider }}>
        <Text
          className="pb-3 pt-1 text-center text-heading-m font-pretendard-semibold"
          style={{ color: colors.text.strong }}
        >
          필터
        </Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ paddingTop: 20, paddingBottom: 12, gap: 28 }}>
        <Section title="정렬">
          <View className="flex-row flex-wrap gap-[6px]">
            {SORT_OPTIONS.map((o) => (
              <SelectChip
                key={o.key}
                label={o.label}
                selected={sort === o.key}
                color={colors.brand.deep}
                onPress={() => setSort(o.key)}
              />
            ))}
          </View>
        </Section>

        <Section title="가격">
          <PriceRangeSlider value={priceRange} onChange={setPriceRange} />
          <View className="mt-3 flex-row items-center gap-2">
            <PriceInput
              value={priceRange[0]}
              onCommit={(v) => setPriceRange([Math.min(v, priceRange[1]), priceRange[1]])}
            />
            <Text style={{ color: colors.text.disabled }}>–</Text>
            <PriceInput
              value={priceRange[1]}
              isUpper
              onCommit={(v) => setPriceRange([priceRange[0], Math.max(v, priceRange[0])])}
            />
          </View>
        </Section>

        <View>
          <Text
            className="mb-3 px-5 text-heading-m font-pretendard-semibold"
            style={{ color: colors.text.strong }}
          >
            예약시간
          </Text>
          <TimeFilterContent />
        </View>
      </BottomSheetScrollView>

      <View className="px-5 pt-2" style={{ paddingBottom: bottomInset + 12 }}>
        <Pressable
          onPress={onClose}
          className="h-12 items-center justify-center rounded-sm border"
          style={{ borderColor: colors.line.base, backgroundColor: colors.white }}
        >
          <Text className="text-label-l font-pretendard-semibold" style={{ color: colors.text.strong }}>
            닫기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="px-5">
      <Text className="mb-3 text-heading-m font-pretendard-semibold" style={{ color: colors.text.strong }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// 가격 입력칸(만원 단위). 슬라이더와 양방향으로 맞물린다 — 입력은 손 뗄 때(blur/완료) 반영해
// 타이핑 도중 "1" 같은 중간값으로 목록이 재조회되지 않게 한다.
function PriceInput({
  value,
  isUpper,
  onCommit,
}: {
  value: number;
  isUpper?: boolean;
  onCommit: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  // 슬라이더로 값이 바뀌면 입력칸도 따라간다.
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const n = Number.parseInt(text.replace(/[^0-9]/g, ''), 10);
    const clamped = Number.isNaN(n) ? value : Math.min(PRICE_MAX, Math.max(0, n));
    setText(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <View
      className="h-11 flex-1 flex-row items-center rounded-sm border px-3"
      style={{ borderColor: colors.line.base }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        maxLength={2}
        className="text-body-m font-pretendard"
        // 웹(react-native-web)에서 TextInput은 고유 폭(size 속성)을 가져서 flex-1만으로는 줄어들지 않는다.
        // minWidth:0을 줘야 남는 칸만 차지하고, 단위 글자가 세로로 찌그러져 숫자와 겹치지 않는다.
        style={{ flex: 1, minWidth: 0, color: colors.text.strong, paddingVertical: 0 }}
      />
      <Text
        className="text-body-m font-pretendard"
        numberOfLines={1}
        style={{ flexShrink: 0, color: colors.text.subtle }}
      >
        {isUpper && value >= PRICE_MAX ? '만원 이상' : '만원'}
      </Text>
    </View>
  );
}
