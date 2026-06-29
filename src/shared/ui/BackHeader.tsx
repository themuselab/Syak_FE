import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 공용 헤더: 뒤로가기 화살표 행 + 타이틀 줄. SafeArea 상단 여백 포함.
// 알림(designs/알림), 마이페이지(designs/마이페이지) 공용. design.pen 헤더(화살표 #bfbfbf, 타이틀 20 SemiBold) 기준.
type Props = {
  title: string;
  onBack?: () => void;
};

export function BackHeader({ title, onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-11 flex-row items-center pl-[17px] pr-5">
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={8}>
          <ArrowLeft size={24} color="#bfbfbf" />
        </Pressable>
      </View>
      <View className="px-5 pb-4 pt-2">
        <Text
          className="font-pretendard-semibold text-black"
          style={{ fontSize: 20, letterSpacing: -0.4 }}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}
