import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { useHomeFilterStore } from '../../useHomeFilterStore';
import { SelectChip } from './SelectChip';

// Phase 1 mock 지역 데이터 (백엔드 단계에서 실제 행정구역으로 교체).
const REGION_DATA: Record<string, string[]> = {
  서울: ['강남구', '강동구', '송파구', '마포구', '종로구', '용산구', '성동구', '광진구', '서초구', '관악구'],
  경기: ['수원시', '성남시', '용인시', '고양시', '부천시', '안양시'],
  인천: ['중구', '남동구', '부평구', '연수구'],
  부산: ['해운대구', '부산진구', '동래구', '수영구'],
  대구: ['중구', '수성구', '달서구'],
  광주: ['동구', '서구', '남구', '북구'],
  전라: ['전주시', '군산시', '여수시', '순천시'],
};
const SIDO = Object.keys(REGION_DATA);

export function RegionFilterContent() {
  const regions = useHomeFilterStore((s) => s.regions);
  const setRegions = useHomeFilterStore((s) => s.setRegions);
  const [sido, setSido] = useState('서울');

  const toggleRegion = (r: string) =>
    setRegions(regions.includes(r) ? regions.filter((x) => x !== r) : [...regions, r]);

  return (
    <View>
      {/* 시·도 탭(좌측 flush, 우측 divider) + 구 그리드(우측 패딩 20) */}
      <View className="flex-row gap-5 pr-5">
        <View className="w-[55px] border-r" style={{ borderColor: '#f3f3f3' }}>
          {SIDO.map((s) => (
            <Pressable key={s} onPress={() => setSido(s)} className="items-center py-4">
              <Text
                className="text-body-m font-pretendard-medium"
                style={{ color: s === sido ? colors.primary[500] : colors.gray[600] }}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-1 flex-row flex-wrap content-start gap-[5px] py-2.5">
          {REGION_DATA[sido].map((d) => (
            // 그리드 칩은 선택 표시 안 함(디자인). 선택은 아래 칩으로 노출.
            <SelectChip key={d} label={d} selected={false} onPress={() => toggleRegion(d)} />
          ))}
        </View>
      </View>

      {/* 선택된 지역 칩: 어두운 글자 + 핑크 테두리 + X (디자인) */}
      {regions.length > 0 && (
        <View className="mt-4 flex-row flex-wrap gap-2 px-5">
          {regions.map((r) => (
            <Pressable
              key={r}
              onPress={() => toggleRegion(r)}
              className="h-9 flex-row items-center gap-1 rounded-full border bg-white px-[10px]"
              style={{ borderColor: colors.primary[500] }}
            >
              <Text className="text-body-m font-pretendard-semibold" style={{ color: '#212529' }}>
                {r}
              </Text>
              <X size={14} color={colors.gray[500]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
