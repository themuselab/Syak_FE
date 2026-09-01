import { Pressable, Text } from 'react-native';

import { colors } from '@/shared/theme/colors';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  width?: number | `${number}%`; // grid 정렬용 고정 너비
  color?: string; // 선택 시 핑크 (기본 primary-500)
};

// 필터 모달용 선택 칩. 선택 시 테두리·텍스트만 핑크, 배경은 흰색(디자인).
export function SelectChip({ label, selected, onPress, width, color }: Props) {
  const pink = color ?? colors.primary[500];
  return (
    <Pressable
      onPress={onPress}
      // 고정 width가 있으면 좌우 패딩을 빼서(width−28px로 눌리는 것 방지) 63px 전체를 중앙정렬에 쓴다.
      // width 없는 칩(날짜 등)은 콘텐츠 크기라 패딩 유지. (QA #16 — 시간 칩 텍스트 밀림)
      className={`h-9 items-center justify-center rounded-full border bg-white ${width ? '' : 'px-3.5'}`}
      style={{ width, borderColor: selected ? pink : colors.gray[300] }}
    >
      <Text
        className="text-body-m font-pretendard-medium"
        style={{ color: selected ? pink : colors.gray[700] }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
