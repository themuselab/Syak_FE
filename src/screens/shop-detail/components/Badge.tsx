import { Text, View } from 'react-native';

type Props = {
  label: string;
  bg: string;
  color: string;
  fontSize?: number;
  /** 카드 최대 폭. 긴 이벤트 문구가 한 장으로 늘어나지 않게 제한(캐러셀에서 사용). */
  maxWidth?: number;
};

// 상세페이지 전용 배지/태그 칩. 위치별 색이 홈과 달라(디자인 HEX) 로컬 유지.
// 첫방문 특가 / 2만원대 / 리뷰 키워드 모두 이 컴포넌트로 표현.
export function Badge({ label, bg, color, fontSize = 13, maxWidth }: Props) {
  return (
    <View className="justify-center rounded-[4px] px-1.5" style={{ backgroundColor: bg, maxWidth }}>
      <Text
        className="font-pretendard-semibold"
        numberOfLines={1}
        style={{ color, fontSize, lineHeight: 20 }}
      >
        {label}
      </Text>
    </View>
  );
}
