import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { useHardwareBack } from '@/shared/lib/backStack';
import { colors, shadow } from '@/shared/theme/colors';

const PIN = require('../../../assets/images/location-permission.png'); // 201x245
const PIN_W = 56;

type Props = {
  visible: boolean;
  /** "위치 권한 설정하기" — OS 권한 팝업(또는 이미 거부했다면 설정 앱)으로 넘긴다 */
  onAllow: () => void;
  /** "나중에 할게요" · ✕ · 바깥 탭 */
  onClose: () => void;
};

// 위치 권한 안내 팝업 (디자이너 시안 2026-10-15 "위치권한 팝업").
// OS 권한 팝업을 바로 띄우지 않고, 왜 필요한지 먼저 보여준 뒤 사용자가 누르면 그때 요청한다.
// 거절해도 앱은 기본 위치(강남역)로 그대로 쓸 수 있어야 하므로 "나중에 할게요"를 항상 둔다
// (닫을 수 없는 권한 유도는 심사 가이드라인 5.1.1 위반 소지).
export function LocationPermissionModal({ visible, onAllow, onClose }: Props) {
  // 안드 물리 뒤로가기(웹뷰 셸) = 닫기. 웹에선 Modal onRequestClose가 안 불려 따로 건다(backStack).
  useHardwareBack(visible, onClose);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: colors.overlay.dim }}
        onPress={onClose}
      >
        {/* 카드 탭은 닫힘 전파 차단 */}
        <Pressable
          onPress={() => {}}
          className="w-full items-center rounded-lg bg-white"
          style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16, ...shadow.modal }}
        >
          <View className="w-full flex-row justify-end">
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="닫기" className="p-1">
              <X size={20} color={colors.text.muted} />
            </Pressable>
          </View>

          <Image
            source={PIN}
            style={{ width: PIN_W, height: Math.round((PIN_W * 245) / 201) }}
            contentFit="contain"
          />

          <Text
            className="mt-4 text-center font-pretendard-semibold"
            style={{ fontSize: 18, lineHeight: 26, color: colors.text.strong }}
          >
            {'내 주변 샵을 찾으려면\n위치 권한이 필요해요!'}
          </Text>
          <Text
            className="mt-2 text-center text-body-m font-pretendard"
            style={{ color: colors.text.muted, lineHeight: 20 }}
          >
            {'위치 권한을 허용하면 가까운 뷰티샵을\n쉽게 찾을 수 있어요.'}
          </Text>

          <Pressable
            onPress={onAllow}
            className="mt-7 h-12 w-full items-center justify-center rounded-sm"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Text className="font-pretendard-semibold" style={{ fontSize: 16, color: colors.white }}>
              위치 권한 설정하기
            </Text>
          </Pressable>

          <Pressable onPress={onClose} hitSlop={6} className="mt-3 py-1">
            <Text className="text-body-m font-pretendard" style={{ color: colors.text.muted }}>
              나중에 할게요
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
