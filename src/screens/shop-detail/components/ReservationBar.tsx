import { ArrowUpRight, Phone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openExternal } from '@/shared/lib/openExternal';
import type { ReservationRoute } from '@/shared/domain/shops/shops.types';
import { colors } from '@/shared/theme/colors';
import { InstagramIcon } from '@/shared/ui/InstagramIcon';

type Props = {
  instagram: { handle: string; url: string } | null;
  phone: string | null;
  route: ReservationRoute | null; // 온라인 예약 수단(네이버 우선, 없으면 카카오·톡톡)
  onReserveClick?: () => void; // 예약 버튼 클릭 애널리틱스 (fire-and-forget)
};

// 하단 고정 예약 바 (디자이너 시안 2026-10-15).
//  왼쪽  : 인스타 있으면 [둘러보기] → 없고 전화 있으면 [전화예약] → 둘 다 없으면 버튼 없음
//  오른쪽: 온라인 예약 수단 있으면 초록 [네이버 예약 ↗]
//          없으면 회색 안내 "네이버 예약이 불가한 샵이에요"(누를 수 없음)
// 시안에는 네이버만 있지만, 네이버가 없고 카카오·톡톡 예약만 있는 샵은 그 수단을 같은 자리에
// 띄운다 — 예약 경로를 숨기면 손님이 예약할 방법이 사라진다.
export function ReservationBar({ instagram, phone, route, onReserveClick }: Props) {
  const insets = useSafeAreaInsets();
  const open = openExternal;

  let left: { icon: ReactNode; label: string; onPress: () => void } | null = null;
  if (instagram) {
    left = {
      icon: <InstagramIcon size={16} color={colors.text.strong} />,
      label: '둘러보기',
      onPress: () => open(instagram.url),
    };
  } else if (phone) {
    left = {
      icon: <Phone size={16} color={colors.text.strong} />,
      label: '전화예약',
      onPress: () => open(`tel:${phone.replace(/[^\d+]/g, '')}`),
    };
  }

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white"
      style={{
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        borderTopColor: colors.line.divider,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 12,
      }}
    >
      <View className="flex-row gap-2">
        {left && (
          <Pressable
            onPress={left.onPress}
            className="flex-row items-center justify-center gap-1.5 rounded-sm border"
            style={{ flex: 1, height: 48, borderColor: colors.line.base }}
          >
            {left.icon}
            <Text className="text-label-l font-pretendard-semibold" style={{ color: colors.text.strong }}>
              {left.label}
            </Text>
          </Pressable>
        )}

        {route ? (
          <Pressable
            onPress={() => {
              onReserveClick?.();
              open(route.value);
            }}
            className="flex-row items-center justify-center gap-2 rounded-sm"
            style={{ flex: 2, height: 48, backgroundColor: colors.social.naver }}
          >
            <Text className="text-label-l font-pretendard-semibold" style={{ color: colors.white }}>
              {route.type === 'naver' ? '네이버 예약' : route.label}
            </Text>
            <ArrowUpRight size={18} color={colors.white} />
          </Pressable>
        ) : (
          <View
            className="items-center justify-center rounded-sm"
            style={{ flex: 2, height: 48, backgroundColor: colors.surface.muted }}
          >
            <Text className="text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
              네이버 예약이 불가한 샵이에요
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
