import { ArrowUpRight } from 'lucide-react-native';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  phone: string | null;
  bookingUrl: string | null;
  onReserveClick?: () => void; // 예약 버튼 클릭 애널리틱스 (fire-and-forget)
};

// bookingUrl은 단일 필드라 네이버 외 값이 들어온다(QA #32 + 운영 데이터 확인):
// 인스타 URL, 심지어 전화번호 문자열("0507-…")도 다수 — 그대로 openURL하면 조용히 실패한다.
// 종류를 판별해 라벨·열기 방식을 맞춘다. (버튼 색상은 종류별 디자인 부재 — 디자이너 확인 항목)
function resolveBooking(bookingUrl: string | null): { label: string; href: string } | null {
  const u = bookingUrl?.trim();
  if (!u) return null;
  if (/^[\d\-+() ]+$/.test(u)) return { label: '전화로 예약', href: `tel:${u.replace(/[^\d+]/g, '')}` };
  const lower = u.toLowerCase();
  if (lower.includes('instagram.com')) return { label: '인스타 예약', href: u };
  if (lower.includes('naver.com') || lower.includes('naver.me')) return { label: '네이버 예약', href: u };
  return { label: '예약하기', href: u };
}

// 고정 하단 예약 바: 전화로 예약(tel:) / 예약 채널 열기(bookingUrl). 값 없으면 해당 버튼 비활성.
export function ReservationBar({ phone, bookingUrl, onReserveClick }: Props) {
  const insets = useSafeAreaInsets();
  const booking = resolveBooking(bookingUrl);

  const openBooking = () => {
    if (!booking) return;
    onReserveClick?.();
    Linking.openURL(booking.href).catch(() => {});
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
          disabled={!booking}
          className="flex-row items-center justify-center rounded-sm"
          style={{
            flex: 225,
            backgroundColor: '#00de5a',
            paddingVertical: 12,
            gap: 9,
            opacity: booking ? 1 : 0.4,
          }}
        >
          <Text
            className="font-pretendard-semibold text-[16px]"
            style={{ color: '#ffffff', letterSpacing: -0.32 }}
          >
            {booking?.label ?? '네이버 예약'}
          </Text>
          <ArrowUpRight size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
