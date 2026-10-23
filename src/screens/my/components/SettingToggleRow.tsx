import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Toggle } from '@/shared/ui/Toggle';
import { colors } from '@/shared/theme/colors';

// 설정 한 행: (아이콘) + 라벨 + 토글. design.pen 마이페이지 설정 행 기준(패딩 [12,0], 라벨 15 SemiBold #555).
type Props = {
  icon?: number; // PNG 아이콘(require)
  iconNode?: ReactNode; // 벡터 아이콘(lucide 등)
  indent?: boolean; // "알림" 아래 하위 설정(시안 2026-10-15: 한 단계 들여쓰기)
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

export function SettingToggleRow({ icon, iconNode, indent, label, value, onValueChange, disabled }: Props) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ paddingVertical: 12, paddingLeft: indent ? 16 : 0 }}
    >
      <View className="flex-row items-center gap-2">
        {icon != null && (
          // PNG 아이콘은 원본이 더 연해서 시안(TO-BE 2026-10-23) 아이콘 색 #ADB5BD로 칠한다 — 종·별 벡터 아이콘과 같은 색.
          <Image source={icon} style={{ width: 20, height: 20 }} contentFit="contain" tintColor={colors.text.faint} />
        )}
        {iconNode != null && <View style={{ width: 20, alignItems: 'center' }}>{iconNode}</View>}
        <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: colors.text.muted }}>
          {label}
        </Text>
      </View>
      <Toggle value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}
