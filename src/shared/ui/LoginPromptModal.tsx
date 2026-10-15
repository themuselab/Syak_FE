import { Image } from 'expo-image';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { colors, shadow } from '@/shared/theme/colors';

const SYMBOL = require('../../../assets/images/login-prompt-symbol.png'); // 383x383 (빛나는 원형 심볼)

// 비회원 로그인 유도 모달 (디자이너 시안 2026-10-15 "로그인유도 팝업 시안").
//   [심볼]
//   로그인하고
//   샥을 이용해보세요!        ← "샥"만 핑크
//   [로그인하러 가기]
//   나중에 할게요
// 위치 권한 팝업과 같은 카드 모양·크기 체계. 트리거는 호출부(useLoginGate / LoginRequired)가 제어.
type Props = {
  visible: boolean;
  onClose: () => void;
  onPressLogin?: () => void;
};

export function LoginPromptModal({ visible, onClose, onPressLogin }: Props) {
  const handleLogin = onPressLogin ?? (() => router.push('/login'));

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

          <Image source={SYMBOL} style={{ width: 84, height: 84 }} contentFit="contain" />

          <Text
            className="mt-3 text-center font-pretendard-semibold"
            style={{ fontSize: 18, lineHeight: 26, color: colors.text.strong }}
          >
            {'로그인하고\n'}
            <Text style={{ color: colors.primary[500] }}>샥</Text>을 이용해보세요!
          </Text>

          <Pressable
            onPress={handleLogin}
            className="mt-7 h-12 w-full items-center justify-center rounded-sm"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Text className="font-pretendard-semibold" style={{ fontSize: 16, color: colors.white }}>
              로그인하러 가기
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
