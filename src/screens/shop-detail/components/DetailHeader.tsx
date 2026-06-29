import { router } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/shared/theme/colors';

const FAVORITE_COLOR = '#FFC107';

type Props = {
  favorite: boolean;
  onToggleFavorite: () => void;
};

// 고정 헤더: 뒤로가기(좌) + 즐겨찾기 별(우). SafeArea 상단 여백 포함, 흰 배경.
export function DetailHeader({ favorite, onToggleFavorite }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-11 flex-row items-center justify-between pl-[17px] pr-5">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color="#bfbfbf" />
        </Pressable>
        <Pressable onPress={onToggleFavorite} hitSlop={8}>
          <Star
            size={24}
            color={favorite ? FAVORITE_COLOR : colors.gray[300]}
            fill={favorite ? FAVORITE_COLOR : 'transparent'}
          />
        </Pressable>
      </View>
    </View>
  );
}
