import { AlertCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { colors, shadow } from '@/shared/theme/colors';

type Props = { message: string };

// 로그인 실패 안내(디자이너 시안 2026-10-15).
// 화면 하단에 띄우던 반투명 토스트에서, 버튼 패널 안 "비회원으로 둘러보기" 자리를 대체하는
// 흰 카드로 바뀌었다. 둘이 동시에 보이지 않으므로 레이아웃이 밀리지 않는다.
export function LoginErrorToast({ message }: Props) {
  return (
    <View
      className="flex-row items-center justify-center gap-1.5 rounded-sm px-3 py-2.5"
      style={{ backgroundColor: colors.white, ...shadow.sm }}
    >
      <AlertCircle size={16} color={colors.primary[500]} />
      <Text
        className="text-label-m font-pretendard-medium"
        numberOfLines={2}
        style={{ color: colors.text.muted, flexShrink: 1 }}
      >
        {message}
      </Text>
    </View>
  );
}
