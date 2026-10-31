import { MapPin } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHardwareBack } from '@/shared/lib/backStack';
import { colors, shadow } from '@/shared/theme/colors';

type Props = {
  visible: boolean;
  onSetRegion: () => void; // "관심 동네 설정하기" → 관심 동네 검색 시트
  onLater: () => void; // "나중에 할게요" · 바깥 탭
};

// 관심 동네 안내 시트(디자이너 시안 2026-10-29 "빈자리 알림받기" 첫 화면). 로그인했지만 관심 동네가 없을 때 홈에서 1회.
// 위쪽 분홍 원 장식 + 분홍 핀. 관심 동네는 홈 시작 위치용 — 동네 기준 알림은 없앴다(2026-10-31, 알림은 즐겨찾기·빈자리 알림 신청만).
export function RegionPromptSheet({ visible, onSetRegion, onLater }: Props) {
  // 안드 물리 뒤로가기(웹뷰 셸) = 닫기. 웹에선 Modal onRequestClose가 안 불려 따로 건다(backStack).
  useHardwareBack(visible, onLater);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onLater}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay.dim }} onPress={onLater} />
      <View
        className="overflow-hidden bg-white"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* 장식: 위쪽 가운데 겹친 연분홍 원 */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -170,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 420,
              height: 420,
              borderRadius: 210,
              backgroundColor: colors.brand.tint,
            }}
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -60,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: colors.brand.tintAlt,
            }}
          />
        </View>

        <View className="items-center pt-2.5">
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.line.handle,
            }}
          />
        </View>

        {/* 분홍 핀(시안) */}
        <View className="items-center pt-12">
          <MapPin size={64} color={colors.white} fill={colors.primary[300]} strokeWidth={1.5} />
        </View>

        <View className="items-center px-5 pt-6">
          <Text className="font-pretendard-semibold" style={{ fontSize: 18, color: colors.text.strong }}>
            관심 동네를 설정하고 시작해볼까요?
          </Text>
          <Text
            className="mt-2 text-center font-pretendard"
            style={{ fontSize: 13, lineHeight: 20, color: colors.text.muted }}
          >
            {'관심 동네를 설정해보세요!\n마이 > 관심 동네에서 변경 가능해요'}
          </Text>
        </View>

        <View className="px-5 pt-6">
          <Pressable
            onPress={onSetRegion}
            className="h-12 items-center justify-center rounded-sm"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Text className="font-pretendard-semibold" style={{ fontSize: 16, color: colors.white }}>
              관심 동네 설정하기
            </Text>
          </Pressable>
          <Pressable onPress={onLater} hitSlop={6} className="mt-3 items-center py-1">
            <Text className="text-body-m font-pretendard" style={{ color: colors.text.muted }}>
              나중에 할게요
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
