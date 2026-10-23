import { router } from 'expo-router';
import { ChevronLeft, Star, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/shared/theme/colors';

const FAVORITE_COLOR = colors.accent.favorite;

type Props = {
  favorite: boolean;
  onToggleFavorite: () => void;
  onBack?: () => void; // 미지정 시 라우터 뒤로가기 — 홈 포커스 시트에선 시트 접기 콜백 주입
  // ✕ = 상세를 닫고 지도로(시안 2026-10-15). 미지정 시 홈으로. 홈 시트에선 선택 해제 콜백 주입.
  onClose?: () => void;
};

// 고정 헤더: 뒤로가기(좌) + 즐겨찾기 별(우). SafeArea 상단 여백 포함, 흰 배경.
export function DetailHeader({ favorite, onToggleFavorite, onBack, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-11 flex-row items-center justify-between pl-[17px] pr-5">
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={8}>
          <ChevronLeft size={26} color={colors.gray[800]} />
        </Pressable>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={onToggleFavorite} hitSlop={8}>
            <Star
              size={24}
              color={favorite ? FAVORITE_COLOR : colors.gray[300]}
              fill={favorite ? FAVORITE_COLOR : 'transparent'}
            />
          </Pressable>
          <Pressable onPress={onClose ?? (() => router.replace('/home'))} hitSlop={8} accessibilityLabel="닫기">
            <X size={24} color={colors.gray[800]} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
