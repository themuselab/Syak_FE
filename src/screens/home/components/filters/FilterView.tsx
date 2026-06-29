import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { type FilterKey } from '../../useHomeFilterStore';
import { PriceFilterContent } from './PriceFilterContent';
import { RegionFilterContent } from './RegionFilterContent';
import { ServiceFilterContent } from './ServiceFilterContent';
import { SortFilterContent } from './SortFilterContent';
import { TimeFilterContent } from './TimeFilterContent';

const TITLE: Record<FilterKey, string> = {
  sort: '정렬',
  region: '지역',
  price: '가격',
  time: '예약 시간',
  service: '시술',
};

// 바텀시트 안에서 필터 화면을 렌더 (목록 대신). 핸들은 시트가 제공.
export function FilterView({ filterKey, onClose }: { filterKey: FilterKey; onClose: () => void }) {
  return (
    <View className="flex-1">
      {/* 제목 + divider */}
      <View className="border-b" style={{ borderColor: '#f3f3f3' }}>
        <Text
          className="pb-3 pt-1 text-center text-[15px] font-pretendard-medium"
          style={{ color: '#1a1a1a' }}
        >
          {TITLE[filterKey]}
        </Text>
      </View>

      {/* 콘텐츠 */}
      <BottomSheetScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
        {filterKey === 'sort' && <SortFilterContent onSelect={onClose} />}
        {filterKey === 'price' && <PriceFilterContent onSelect={onClose} />}
        {filterKey === 'time' && <TimeFilterContent />}
        {filterKey === 'service' && <ServiceFilterContent />}
        {filterKey === 'region' && <RegionFilterContent />}
      </BottomSheetScrollView>

      {/* 닫기 */}
      <View className="px-5 pb-3 pt-2">
        <Pressable
          onPress={onClose}
          className="h-11 items-center justify-center rounded-sm border"
          style={{ borderColor: colors.gray[300] }}
        >
          <Text className="text-label-l font-pretendard-semibold text-gray-900">닫기</Text>
        </Pressable>
      </View>
    </View>
  );
}
