import { Pressable, Text } from 'react-native';

import { colors } from '@/shared/theme/colors';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

// 홈 상단 카테고리 칩. 바텀시트 FilterChip과 디자인이 다르다(디자이너 시안 — 지도 위용).
//  선택   = 핑크로 꽉 채우고 글씨는 흰색
//  미선택 = 흰 배경 + 핑크 테두리 + 핑크 글씨
// 지도 위에 얹히므로 둘 다 그림자로 배경과 분리한다.
export function CategoryChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="h-[33px] flex-row items-center justify-center rounded-full border px-3.5"
      style={{
        backgroundColor: selected ? colors.primary[600] : '#ffffff',
        borderColor: selected ? colors.primary[600] : colors.primary[500],
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3.5,
        elevation: 2,
      }}
    >
      <Text
        className="text-body-m font-pretendard-medium"
        style={{ color: selected ? '#ffffff' : colors.primary[500] }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
