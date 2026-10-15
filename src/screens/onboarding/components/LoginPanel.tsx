import type { ReactNode } from 'react';
import { Animated, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

// 로그인 버튼 묶음을 감싸는 반투명 패널.
// 등장 애니메이션은 화면(LoginScreen)이 가진 progress(0→1) 하나로 로고 이동과 함께 돌린다 —
// 스플래시의 로고·문구가 위로 올라가는 동시에 이 패널이 아래에서 올라와야 자연스럽다(디자이너 요청).

type Props = {
  progress: Animated.Value;
  /** 등장 전(스플래시 단계)에는 버튼이 눌리면 안 된다 */
  interactive: boolean;
  children: ReactNode;
};

export function LoginPanel({ progress, interactive, children }: Props) {
  return (
    <Animated.View
      pointerEvents={interactive ? 'auto' : 'none'}
      style={{
        opacity: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.2, 1] }),
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) },
        ],
      }}
    >
      <View
        className="gap-3 rounded-lg px-4 pb-4 pt-4"
        // 핑크 배경 위 반투명 흰 패널(tokens onboarding.glass — 시안에서 역산한 12%).
        style={{ backgroundColor: colors.onboarding.glass }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
