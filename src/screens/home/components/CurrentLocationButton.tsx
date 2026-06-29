import { LocateFixed } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { colors } from '@/shared/theme/colors';

// 현재위치 버튼: 40×40 원형, 흰 배경, 회색 테두리. (지도 우하단)
export function CurrentLocationButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-[20px] border bg-white"
      style={{
        borderColor: colors.gray[300],
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <LocateFixed size={22} color={colors.gray[700]} />
    </Pressable>
  );
}
