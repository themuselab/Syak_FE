import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void; // X·계속 이용하기·딤 탭
  onConfirm: () => void; // "계정 탈퇴" 텍스트 탭
  confirming?: boolean; // 탈퇴 요청 진행 중 — 중복 탭 방지
};

// 계정 탈퇴 확인 모달 (design.pen o8fLU1 — 딤 #00000099, 카드 r20, 계속 이용하기 우선 버튼).
export function WithdrawConfirmModal({ visible, onClose, onConfirm, confirming }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: '#00000099' }}
        onPress={onClose}
      >
        {/* 카드 탭은 닫힘 전파 차단 */}
        <Pressable
          onPress={() => {}}
          className="w-full rounded-[20px] bg-white"
          style={{
            paddingTop: 28,
            paddingRight: 28,
            paddingBottom: 20,
            paddingLeft: 28,
            gap: 40,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.13,
            shadowRadius: 3.5,
            elevation: 3,
          }}
        >
          <View className="gap-2">
            <View className="flex-row justify-end">
              <Pressable onPress={onClose} hitSlop={8} className="p-[5px]">
                <X size={14} color="#555555" />
              </Pressable>
            </View>
            <View className="gap-4">
              <Text
                className="text-center font-pretendard-medium text-black"
                style={{ fontSize: 20 }}
              >
                계정을 탈퇴하시겠어요?
              </Text>
              <Text
                className="text-center font-pretendard"
                style={{ fontSize: 16, color: '#495057' }}
              >
                예약 내역, 즐겨찾기, 취소석 알림에 관한 모든 내용이 삭제되며 복구할 수 없어요
              </Text>
            </View>
          </View>

          <View className="gap-4">
            <Pressable
              onPress={onClose}
              className="h-12 items-center justify-center rounded-sm bg-primary-500"
            >
              <Text className="font-pretendard-semibold text-white" style={{ fontSize: 16 }}>
                계속 이용하기
              </Text>
            </Pressable>
            <Pressable onPress={onConfirm} disabled={confirming} hitSlop={8}>
              <Text
                className="text-center font-pretendard-semibold"
                style={{ fontSize: 16, color: '#868e96', opacity: confirming ? 0.4 : 1 }}
              >
                계정 탈퇴
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
