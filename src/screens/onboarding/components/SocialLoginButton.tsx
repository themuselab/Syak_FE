import { Image } from 'expo-image';
import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  backgroundColor: string;
  textColor: string;
  icon: number; // require(...) 결과
  onPress: () => void;
  disabled?: boolean;
};

// 소셜 로그인 버튼 (온보딩 전용). 높이 48 / radius 8 / 아이콘+텍스트 가운데, gap 8.
export function SocialLoginButton({
  label,
  backgroundColor,
  textColor,
  icon,
  onPress,
  disabled,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="h-12 flex-row items-center justify-center gap-2 rounded-sm"
      style={{ backgroundColor, opacity: disabled ? 0.6 : 1 }}
    >
      <Image source={icon} style={{ width: 24, height: 24 }} contentFit="contain" />
      <Text className="text-label-l font-pretendard-semibold" style={{ color: textColor }}>
        {label}
      </Text>
    </Pressable>
  );
}
