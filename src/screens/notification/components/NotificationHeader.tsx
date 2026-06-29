import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 알림 헤더: 뒤로가기 화살표 행 + "알림" 타이틀 줄. SafeArea 상단 여백 포함.
// 디자인: designs/알림/알림.png, design.pen frame SXtVD
export function NotificationHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-11 flex-row items-center pl-[17px] pr-5">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color="#bfbfbf" />
        </Pressable>
      </View>
      <View className="px-5 pb-4 pt-2">
        <Text
          className="font-pretendard-semibold text-black"
          style={{ fontSize: 20, letterSpacing: -0.4 }}
        >
          알림
        </Text>
      </View>
    </View>
  );
}
