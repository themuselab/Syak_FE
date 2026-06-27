import { Text, View } from 'react-native';

// 디자인: designs/온보딩/*, designs/design.pen (온보딩 페이지)
// 임시 화면 — 디자인 토큰(색/타이포/폰트) 적용 확인용. 실제 구현은 온보딩 단계에서.
export function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-white">
      <Text className="text-display-l font-pretendard-semibold text-primary-500">
        대기 예약은 syak에서 샥!
      </Text>
      <Text className="text-body-m font-pretendard text-gray-500">designs/온보딩 참고</Text>
    </View>
  );
}
