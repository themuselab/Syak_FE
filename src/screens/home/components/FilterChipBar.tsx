import { Image } from 'expo-image';
import { ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import {
  type DateKey,
  isFullPrice,
  PRICE_MAX,
  type PriceRange,
  useHomeFilterStore,
} from '../useHomeFilterStore';
import { FilterChip } from './FilterChip';
import { SORT_OPTIONS } from './filters/FilterPanel';

// 칩 아이콘은 지도 핀과 같은 컬러 글리프(핀 PNG에서 추출) — 핀 색과 정확히 같다.
const ICON_SAMEDAY = require('../../../../assets/icons/chip-sameday.png');
const ICON_DISCOUNT = require('../../../../assets/icons/chip-discount.png');
const ICON_STYLE = { width: 15, height: 15, marginRight: 1 } as const;

const DATE_LABEL: Record<DateKey, string> = { today: '오늘', tomorrow: '내일', day_after: '모레' };

function priceLabel([min, max]: PriceRange): string {
  if (min > 0 && max >= PRICE_MAX) return `${min}만원 이상`;
  if (min <= 0) return `${max}만원 이하`;
  return `${min}~${max}만원`;
}

function timeLabel(date: DateKey | null, times: string[]): string {
  const day = DATE_LABEL[date ?? 'today'];
  if (!times.length) return day;
  return times.length === 1 ? `${day} ${times[0]}` : `${day} ${times[0]} 외 ${times.length - 1}`;
}

// 바텀시트 칩바 (디자이너 시안 2026-10-15).
//  왼쪽: 지도 모드 토글(당일 예약 / 할인·이벤트 — 상호 배타)
//  가운데: 관련도순·가격·예약시간 — 현재 고른 값을 라벨로 보여주고, 누르면 통합 필터 패널이 열린다
//  오른쪽 고정: 필터 버튼 — 같은 패널을 연다
export function FilterChipBar() {
  const sort = useHomeFilterStore((s) => s.sort);
  const priceRange = useHomeFilterStore((s) => s.priceRange);
  const date = useHomeFilterStore((s) => s.date);
  const times = useHomeFilterStore((s) => s.times);
  const toggles = useHomeFilterStore((s) => s.toggles);
  const toggle = useHomeFilterStore((s) => s.toggle);
  const setActiveFilter = useHomeFilterStore((s) => s.setActiveFilter);

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? '관련도순';
  const priceOn = !isFullPrice(priceRange);
  const timeOn = date !== null || times.length > 0;
  const chevron = (c: string) => <ChevronDown size={14} color={c} />;

  return (
    <View className="flex-row items-center border-b pb-[11px]" style={{ borderColor: colors.line.divider }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ gap: 6, paddingLeft: 20, paddingRight: 8, alignItems: 'center' }}
      >
        <FilterChip
          label="당일 예약"
          selected={toggles.sameDay}
          leftIcon={() => <Image source={ICON_SAMEDAY} style={ICON_STYLE} contentFit="contain" />}
          onPress={() => toggle('sameDay')}
        />
        <FilterChip
          label="할인·이벤트"
          selected={toggles.discount}
          leftIcon={() => <Image source={ICON_DISCOUNT} style={ICON_STYLE} contentFit="contain" />}
          onPress={() => toggle('discount')}
        />
        <View className="mx-1 h-5 w-px" style={{ backgroundColor: colors.line.base }} />
        <FilterChip
          label={sortLabel}
          selected={sort !== 'default'}
          rightIcon={chevron}
          onPress={() => setActiveFilter('sort')}
        />
        <FilterChip
          label={priceOn ? priceLabel(priceRange) : '가격'}
          selected={priceOn}
          rightIcon={chevron}
          onPress={() => setActiveFilter('price')}
        />
        <FilterChip
          label={timeOn ? timeLabel(date, times) : '예약시간'}
          selected={timeOn}
          rightIcon={chevron}
          onPress={() => setActiveFilter('time')}
        />
      </ScrollView>

      {/* 필터 버튼 — 스크롤 밖에 고정해 칩이 많아도 항상 보이게 */}
      <Pressable
        onPress={() => setActiveFilter('sort')}
        accessibilityLabel="필터"
        className="mr-5 h-[33px] w-[33px] items-center justify-center rounded-full border"
        style={{ borderColor: colors.gray[300], backgroundColor: colors.white }}
      >
        <SlidersHorizontal size={16} color={colors.gray[800]} />
      </Pressable>
    </View>
  );
}
