import { ArrowUpRight } from 'lucide-react-native';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReservationRoute } from '@/shared/domain/shops/shops.types';

type Props = {
  phone: string | null;
  route: ReservationRoute | null; // 대표 예약 수단 (BE bookingType 기준, 라벨 포함 — QA #32 개편)
  onReserveClick?: () => void; // 예약 버튼 클릭 애널리틱스 (fire-and-forget)
};

// route.type='phone'이면 value가 전화번호 문자열 → tel: 링크로 변환. 그 외는 URL 그대로.
function hrefOf(route: ReservationRoute): string {
  return route.type === 'phone' ? `tel:${route.value.replace(/[^\d+]/g, '')}` : route.value;
}

// 고정 하단 예약 바: 전화로 예약(tel:) / 대표 예약 수단(라벨은 서버 제공 — "네이버로 예약"/"인스타로 문의" 등).
// 수단 없으면 비활성. 다수 라우트 동시 노출은 디자인 부재 — 디자이너 확인 후(docs/shop-detail.md).
// 우측 버튼 색은 전 종류 네이버 그린 유지 — 종류별 디자인 부재, 디자이너 확인 항목.
export function ReservationBar({ phone, route, onReserveClick }: Props) {
  const insets = useSafeAreaInsets();

  const openBooking = () => {
    if (!route) return;
    onReserveClick?.();
    Linking.openURL(hrefOf(route)).catch(() => {});
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white"
      style={{
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderTopColor: '#e6e6e6',
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => phone && Linking.openURL(`tel:${phone}`).catch(() => {})}
          disabled={!phone}
          className="items-center justify-center rounded-sm"
          style={{
            flex: 102,
            borderWidth: 1,
            borderColor: '#e6e6e6',
            paddingVertical: 12,
            opacity: phone ? 1 : 0.4,
          }}
        >
          <Text
            className="font-pretendard-semibold text-[16px]"
            style={{ color: '#7d7d7d', letterSpacing: -0.32 }}
          >
            전화로 예약
          </Text>
        </Pressable>

        <Pressable
          onPress={openBooking}
          disabled={!route}
          className="flex-row items-center justify-center rounded-sm"
          style={{
            flex: 225,
            backgroundColor: '#00de5a',
            paddingVertical: 12,
            gap: 9,
            opacity: route ? 1 : 0.4,
          }}
        >
          <Text
            className="font-pretendard-semibold text-[16px]"
            style={{ color: '#ffffff', letterSpacing: -0.32 }}
          >
            {route?.label ?? '네이버 예약'}
          </Text>
          <ArrowUpRight size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
