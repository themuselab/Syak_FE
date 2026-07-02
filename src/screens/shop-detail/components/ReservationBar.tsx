import { ArrowUpRight } from 'lucide-react-native';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  phone: string | null;
  bookingUrl: string | null;
  onReserveClick?: () => void; // 예약 버튼 클릭 애널리틱스 (fire-and-forget)
};

// 고정 하단 예약 바: 전화로 예약(tel:) / 네이버 예약(bookingUrl 열기). 값 없으면 해당 버튼 비활성.
export function ReservationBar({ phone, bookingUrl, onReserveClick }: Props) {
  const insets = useSafeAreaInsets();

  const openBooking = () => {
    if (!bookingUrl) return;
    onReserveClick?.();
    Linking.openURL(bookingUrl).catch(() => {});
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
          disabled={!bookingUrl}
          className="flex-row items-center justify-center rounded-sm"
          style={{
            flex: 225,
            backgroundColor: '#00de5a',
            paddingVertical: 12,
            gap: 9,
            opacity: bookingUrl ? 1 : 0.4,
          }}
        >
          <Text
            className="font-pretendard-semibold text-[16px]"
            style={{ color: '#ffffff', letterSpacing: -0.32 }}
          >
            네이버 예약
          </Text>
          <ArrowUpRight size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
