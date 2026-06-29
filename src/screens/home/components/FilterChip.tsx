import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

import { colors } from '@/shared/theme/colors';

type Props = {
  label: string;
  selected?: boolean;
  // 아이콘은 색을 받아 선택 상태에 맞춰 렌더 (선택 시 핑크).
  leftIcon?: (color: string) => ReactNode;
  rightIcon?: (color: string) => ReactNode;
  onPress?: () => void;
};

// 필터 칩: 흰 배경 pill, 테두리 gray-300. 선택 시 테두리·텍스트·아이콘 핑크.
export function FilterChip({ label, selected, leftIcon, rightIcon, onPress }: Props) {
  const color = selected ? colors.primary[500] : colors.gray[800];
  return (
    <Pressable
      onPress={onPress}
      className="h-[33px] flex-row items-center gap-1 rounded-full border bg-white px-3"
      style={{ borderColor: selected ? colors.primary[500] : colors.gray[300] }}
    >
      {leftIcon?.(color)}
      <Text className="text-body-m font-pretendard-medium" style={{ color }}>
        {label}
      </Text>
      {rightIcon?.(color)}
    </Pressable>
  );
}
