import { LocateFixed } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';

import { colors } from '@/shared/theme/colors';

type Props = {
  onPress?: () => void;
  active?: boolean;
  loading?: boolean; // GPS 좌표 대기 중 — 스피너 + 중복 탭 차단(QA #56)
};

// 현재위치 버튼: 40×40 원형, 흰 배경, 회색 테두리. (지도 우하단)
// active = 내 주변 모드 on — 아이콘만 파랑(#007AFF, 마커와 동일)으로 표시(사용자 확정, 배경·테두리 유지).
export function CurrentLocationButton({ onPress, active, loading }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
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
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary[500]} />
      ) : (
        <LocateFixed size={22} color={active ? colors.myLocation : colors.gray[700]} />
      )}
    </Pressable>
  );
}
