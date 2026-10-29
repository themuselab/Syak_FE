import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/theme/colors';

// 공용 헤더: 뒤로가기 화살표 행 + 타이틀 줄. SafeArea 상단 여백 포함.
// 알림(designs/알림), 마이페이지(designs/마이페이지) 공용. design.pen 헤더(화살표 #bfbfbf, 타이틀 20 SemiBold) 기준.
type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode; // 뒤로가기 행 오른쪽 끝 액션(알림함 "편집"/"완료")
};

export function BackHeader({ title, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-11 flex-row items-center justify-between pl-[17px] pr-5">
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={8}>
          {/* 뒤로가기는 앱 전체 < 모양·진한 회색으로 통일(디자이너 요청 2026-10-23, 검색창 < 와 같은 모양) */}
          <ChevronLeft size={26} color={colors.gray[800]} />
        </Pressable>
        {right}
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
