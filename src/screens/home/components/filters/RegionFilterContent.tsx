import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { REGION_GROUPS } from '@/shared/lib/region';
import { colors } from '@/shared/theme/colors';
import { useHomeFilterStore } from '../../useHomeFilterStore';
import { SelectChip } from './SelectChip';

// 지역 목록 = 실데이터 gu 고유값 스냅샷(@/shared/lib/region). 칩은 label 표시, 서버엔 value(원값) 전송.
const SIDO = REGION_GROUPS.map((g) => g.sido);

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
          {REGION_GROUPS.find((g) => g.sido === sido)!.items.map((d) => (
            // 그리드 칩은 선택 표시 안 함(디자인). 선택은 아래 칩으로 노출.
            <SelectChip
              key={d.value}
              label={d.label}
              selected={false}
              onPress={() => toggleRegion(d.value)}
            />
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
