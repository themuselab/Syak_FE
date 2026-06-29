import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Toggle } from '@/shared/ui/Toggle';

// 설정 한 행: (아이콘) + 라벨 + 토글. design.pen 마이페이지 설정 행 기준(패딩 [12,0], 라벨 15 SemiBold #555).
type Props = {
  icon?: number;
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

export function SettingToggleRow({ icon, label, value, onValueChange, disabled }: Props) {
  return (
    <View className="flex-row items-center justify-between" style={{ paddingVertical: 12 }}>
      <View className="flex-row items-center gap-2">
        {icon != null && (
          <Image source={icon} style={{ width: 16, height: 16 }} contentFit="contain" />
        )}
        <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: '#555555' }}>
          {label}
        </Text>
      </View>
      <Toggle value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}
