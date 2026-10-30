import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { useHardwareBack } from '@/shared/lib/backStack';
import { colors, shadow } from '@/shared/theme/colors';

type Props = {
  visible: boolean;
  onContinue: () => void; // "계속 편집하기" · ✕ · 바깥 탭
  onExit: () => void; // "나가기" — 지운 것을 버리고 나간다
};

// 편집 중 나가기 확인 (디자이너 시안 2026-10-29). 로그인 유도 모달과 같은 카드 체계.
//                                         ✕
//   편집을 그만할까요?
//   지금 나가면 삭제한 알림이 그대로 남아요.
//   [계속 편집하기]
//   나가기
export function EditExitModal({ visible, onContinue, onExit }: Props) {
  // 안드 물리 뒤로가기(웹뷰 셸) = 닫기. 웹에선 Modal onRequestClose가 안 불려 따로 건다(backStack).
  useHardwareBack(visible, onContinue);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: colors.overlay.dim }}
        onPress={onContinue}
      >
        <Pressable
          onPress={() => {}}
          className="w-full items-center rounded-lg bg-white"
          style={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16, ...shadow.modal }}
        >
          <View className="w-full flex-row justify-end">
            <Pressable onPress={onContinue} hitSlop={10} accessibilityLabel="닫기" className="p-1">
              <X size={20} color={colors.text.muted} />
            </Pressable>
          </View>

          <Text
            className="mt-1 text-center font-pretendard-semibold"
            style={{ fontSize: 18, lineHeight: 26, color: colors.text.strong }}
          >
            편집을 그만할까요?
          </Text>
          <Text className="mt-2 text-center text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
            지금 나가면 삭제한 알림이 그대로 남아요.
          </Text>

          <Pressable
            onPress={onContinue}
            className="mt-7 h-12 w-full items-center justify-center rounded-sm"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Text className="font-pretendard-semibold" style={{ fontSize: 16, color: colors.white }}>
              계속 편집하기
            </Text>
          </Pressable>

          <Pressable onPress={onExit} hitSlop={6} className="mt-3 py-1">
            <Text className="text-body-m font-pretendard" style={{ color: colors.text.muted }}>
              나가기
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
