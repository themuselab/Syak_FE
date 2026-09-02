import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Pressable, Text, View } from 'react-native';

import { useBottomInset } from '@/shared/lib/safeArea';
import { colors } from '@/shared/theme/colors';
import { useHomeFilterStore, type FilterKey } from '../../useHomeFilterStore';
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
// 버튼 영역은 하단 고정이 아니라 콘텐츠 바로 아래 밀착(QA #55) — 짧은 필터(가격 등)에서
// 콘텐츠와 버튼 사이 공백 제거. 긴 콘텐츠는 ScrollView가 줄어들어(flexShrink) 버튼 항상 노출.
export function FilterView({ filterKey, onClose }: { filterKey: FilterKey; onClose: () => void }) {
  const bottomInset = useBottomInset(); // 버튼이 하단 내비 바에 가리지 않게(안드는 내비바 높이 하한 보장)
  const store = useHomeFilterStore();

  // 초기화 = 열려있는 필터의 선택만 해제(QA #16 — 사용자 확정). 다른 필터는 유지.
  const resetCurrent = () => {
    switch (filterKey) {
      case 'sort':
        store.setSort('default');
        break;
      case 'region':
        store.setRegions([]);
        break;
      case 'price':
        store.setPrices([]);
        break;
      case 'time':
        store.setDate(null);
        store.setTimes([]);
        break;
      case 'service':
        store.setServiceFields([]);
        store.setServices([]);
        break;
    }
  };

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

      {/* 콘텐츠 — flexGrow:0 으로 내용 높이만큼만 차지(버튼 밀착), flexShrink:1 로 넘치면 스크롤 */}
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 1 }}
        contentContainerStyle={{ paddingVertical: 12 }}
      >
        {filterKey === 'sort' && <SortFilterContent onSelect={onClose} />}
        {filterKey === 'price' && <PriceFilterContent />}
        {filterKey === 'time' && <TimeFilterContent />}
        {filterKey === 'service' && <ServiceFilterContent />}
        {filterKey === 'region' && <RegionFilterContent />}
      </BottomSheetScrollView>

      {/* 초기화(현재 필터만) + 닫기. 초기화 버튼 디자인 부재 — 닫기 스타일 준용(디자이너 확인 항목) */}
      <View className="flex-row gap-2 px-5 pt-2" style={{ paddingBottom: 12 + bottomInset }}>
        <Pressable
          onPress={resetCurrent}
          className="h-11 flex-1 items-center justify-center rounded-sm border"
          style={{ borderColor: colors.gray[300] }}
        >
          <Text className="text-label-l font-pretendard-semibold text-gray-700">초기화</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          className="h-11 flex-1 items-center justify-center rounded-sm border"
          style={{ borderColor: colors.gray[300] }}
        >
          <Text className="text-label-l font-pretendard-semibold text-gray-900">닫기</Text>
        </Pressable>
      </View>
    </View>
  );
}
