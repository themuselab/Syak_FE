import { Text, View } from 'react-native';

type Props = {
  visible: boolean;
  message?: string;
};

// 로그인 실패 토스트 (디자인: 로그인 실패시.png). 하단 중앙, 반투명 배경.
export function LoginErrorToast({
  visible,
  message = '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.',
}: Props) {
  if (!visible) return null;
  return (
    <View
      className="absolute items-center justify-center rounded-sm"
      style={{ left: 23, right: 23, bottom: 32, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#f8f9fa33' }}
    >
      <Text className="font-pretendard-medium text-gray-500" style={{ fontSize: 15 }}>
        {message}
      </Text>
    </View>
  );
}
