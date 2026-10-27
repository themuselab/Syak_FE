import { Image } from 'expo-image';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '@/shared/theme/colors';

const SYMBOL = require('../../../../assets/images/syak-symbol-pink.png');

type Props = {
  visible: boolean;
  onSetRegion: () => void; // "동네 설정하고 알림받기" → 관심 동네 검색 시트
  onLater: () => void; // "나중에 할게요" · 바깥 탭
};

// 관심 동네 안내 시트(디자이너 시안 2026-10-27 첫 화면). 로그인했지만 관심 동네가 없을 때 홈에서 1회.
// 위쪽 분홍 원 장식 + 알림 미리보기 카드로 "설정하면 이런 알림이 와요"를 보여준다.
export function RegionPromptSheet({ visible, onSetRegion, onLater }: Props) {
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

        {/* 알림 미리보기 카드 */}
        <View className="px-7 pt-10">
          <View className="flex-row gap-3 rounded-md bg-white p-3" style={shadow.md}>
            <View
              className="items-center justify-center rounded-sm"
              style={{
                width: 36,
                height: 36,
                borderWidth: 1,
                borderColor: colors.line.base,
              }}
            >
              <Image source={SYMBOL} style={{ width: 30, height: 30 }} contentFit="contain" />
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className="font-pretendard-semibold"
                  style={{ fontSize: 12, color: colors.text.strong }}
                >
                  syak 취소석 알림
                </Text>
                <Text className="font-pretendard" style={{ fontSize: 10, color: colors.text.faint }}>
                  지금
                </Text>
              </View>
              <Text
                className="font-pretendard"
                style={{
                  fontSize: 11,
                  lineHeight: 16,
                  color: colors.text.strong,
                }}
              >
                <Text className="font-pretendard-semibold">역삼동</Text>
                {' 예쁜 네일\n오늘 '}
                <Text className="font-pretendard-semibold">15:00</Text>
                {' 빈자리가 생겼어요!'}
              </Text>
            </View>
          </View>
        </View>

        <View className="items-center px-5 pt-8">
          <Text className="font-pretendard-semibold" style={{ fontSize: 18, color: colors.text.strong }}>
            우리 동네 뷰티 혜택을 놓치지 마세요!
          </Text>
          <Text
            className="mt-2 text-center font-pretendard"
            style={{ fontSize: 13, lineHeight: 20, color: colors.text.muted }}
          >
            {'관심 동네를 설정하면 그 동네 샵의\n'}
            <Text className="font-pretendard-semibold" style={{ color: colors.primary[500] }}>
              빈자리
            </Text>
            와{' '}
            <Text className="font-pretendard-semibold" style={{ color: colors.primary[500] }}>
              할인 소식
            </Text>
            을 알려드려요.
          </Text>
        </View>

        <View className="px-5 pt-6">
          <Pressable
            onPress={onSetRegion}
            className="h-12 items-center justify-center rounded-sm"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Text className="font-pretendard-semibold" style={{ fontSize: 16, color: colors.white }}>
              동네 설정하고 알림받기
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
