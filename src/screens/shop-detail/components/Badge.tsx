import { Text, View } from 'react-native';

type Props = {
  label: string;
  bg: string;
  color: string;
  fontSize?: number;
};

// 상세페이지 전용 배지/태그 칩. 위치별 색이 홈과 달라(디자인 HEX) 로컬 유지.
// 첫방문 특가 / 2만원대 / 리뷰 키워드 모두 이 컴포넌트로 표현.
export function Badge({ label, bg, color, fontSize = 13 }: Props) {
  return (
    <View className="justify-center rounded-[4px] px-1.5" style={{ backgroundColor: bg }}>
      <Text className="font-pretendard-semibold" style={{ color, fontSize, lineHeight: 20 }}>
        {label}
      </Text>
    </View>
  );
}
