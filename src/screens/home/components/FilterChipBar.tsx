import { Image } from 'expo-image';
import { ArrowDownUp, ChevronDown } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { useHomeFilterStore, type SortKey } from '../useHomeFilterStore';
import { FilterChip } from './FilterChip';

// 칩 아이콘은 지도 핀과 같은 컬러 글리프(디자이너 시안) — lucide 모노톤이 아니다.
// 핀 PNG에서 글리프를 뽑아 만든 것이라 핀 색과 정확히 같다.
const ICON_SAMEDAY = require('../../../../assets/icons/chip-sameday.png');
const ICON_DISCOUNT = require('../../../../assets/icons/chip-discount.png');
const ICON_STYLE = { width: 15, height: 15, marginRight: 1 } as const;

const SORT_LABEL: Record<SortKey, string> = {
  default: '기본순',
  price_asc: '가격 낮은순',
  price_desc: '가격 높은순',
  partner: '샥 파트너',
};

// 바텀시트 칩바: 좌측 고정 정렬칩(divider) + 가로 스크롤 칩. 칩 탭 → activeFilter 전환/모드 토글.
// 지도 모드(당일 예약·이벤트)는 상호 배타라 하나를 켜면 다른 하나가 꺼진다(store의 toggle).
// 홈 상단에는 시술분야 카테고리 칩(CategoryChipBar)이 올라간다 — 역할이 겹치지 않는다.
export function FilterChipBar() {
  const { sort, regions, prices, date, times, serviceFields, services, toggles, toggle, setActiveFilter } =
    useHomeFilterStore();

  return (
    <View className="flex-row items-center border-b pb-[11px]" style={{ borderColor: '#f3f3f3' }}>
      {/* 좌측 고정 정렬 칩 (오른쪽 divider만). 보이는 아이콘이 18px(디자인)에 오도록
          lucide 아이콘 내부 여백(~3px) 보정 → pl 15px. (카드 썸네일 20px와 시각적 정렬) */}
      <Pressable
        onPress={() => setActiveFilter('sort')}
        className="h-[33px] flex-row items-center gap-1 border-r pr-3 pl-[15px]"
        style={{ borderColor: colors.gray[300] }}
      >
        <ArrowDownUp size={14} color={colors.gray[800]} />
        <Text className="text-body-m font-pretendard-medium text-gray-800">{SORT_LABEL[sort]}</Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 6 }}
      >
        <FilterChip
          label="당일 예약"
          selected={toggles.sameDay}
          leftIcon={() => <Image source={ICON_SAMEDAY} style={ICON_STYLE} contentFit="contain" />}
          onPress={() => toggle('sameDay')}
        />
        <FilterChip
          label="이벤트"
          selected={toggles.discount}
          leftIcon={() => <Image source={ICON_DISCOUNT} style={ICON_STYLE} contentFit="contain" />}
          onPress={() => toggle('discount')}
        />
        <FilterChip
          label="가격"
          selected={prices.length > 0}
          rightIcon={(c) => <ChevronDown size={14} color={c} />}
          onPress={() => setActiveFilter('price')}
        />
        <FilterChip
          label="지역"
          selected={regions.length > 0}
          rightIcon={(c) => <ChevronDown size={14} color={c} />}
          onPress={() => setActiveFilter('region')}
        />
        <FilterChip
          label="예약 시간"
          selected={!!date || times.length > 0}
          rightIcon={(c) => <ChevronDown size={14} color={c} />}
          onPress={() => setActiveFilter('time')}
        />
        <FilterChip
          label="시술"
          selected={serviceFields.length > 0 || services.length > 0}
          rightIcon={(c) => <ChevronDown size={14} color={c} />}
          onPress={() => setActiveFilter('service')}
        />
      </ScrollView>
    </View>
  );
}
