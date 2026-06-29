import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

// 비회원 로그인 유도 모달 (재사용).
// 디자인: designs/비회원로그인 알림/*, design.pen frame B9m9C (카드 KfxCM, 딤 JihSb)
// 디자인 전용 hex(#00000099/#c24a6b/#e8e8e8/#555555)는 토큰 스케일에 없어 .pen 실측값 사용.
// (#c24a6b는 토큰 primary.500(#d23e6a)과 근사하지만 .pen 실측값을 따른다.)
// 트리거는 호출부에서 제어 — 추후 비회원 게이팅 시 visible로 연결한다.
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
        style={{ backgroundColor: '#00000099' }}
        onPress={onClose}
      >
        {/* 카드 탭은 닫힘 전파 차단 */}
        <Pressable
          onPress={() => {}}
          className="w-full justify-between rounded-lg bg-white"
          style={{
            minHeight: 222,
            paddingTop: 28,
            paddingRight: 28,
            paddingBottom: 20,
            paddingLeft: 28,
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
            <Text
              className="text-center font-pretendard-semibold text-black"
              style={{ fontSize: 20, lineHeight: 28 }}
            >
              로그인하고{'\n'}
              <Text style={{ color: '#c24a6b' }}>샥-</Text> 이용해보세요!
            </Text>
          </View>

          <Pressable
            onPress={handleLogin}
            className="h-12 items-center justify-center rounded-sm"
            style={{ backgroundColor: '#c24a6b', borderWidth: 1, borderColor: '#e8e8e8' }}
          >
            <Text className="font-pretendard-semibold text-white" style={{ fontSize: 16 }}>
              로그인하러 가기
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
