import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

// 로그인 버튼 묶음을 감싸는 반투명 패널.
// 스플래시에서 넘어올 때 아래에서 올라오며 나타난다(디자이너 요청 2026-10-15) —
// 스플래시는 로고만 가운데 있다가 로그인 화면에서 이 패널이 붙는 흐름이라,
// 그냥 "툭" 나타나면 화면이 바뀐 게 아니라 깜빡인 것처럼 보인다.
//
// useNativeDriver는 네이티브에서만 true. react-native-web은 네이티브 드라이버가 없어서
// true로 두면 애니메이션이 아예 시작되지 않고 opacity:0에 멈춘다 — 즉 웹(웹뷰)에서
// 로그인 버튼이 통째로 안 보인다. 실제로 그렇게 터졌다.

type Props = { children: ReactNode };

export function LoginPanel({ children }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 520,
      delay: 120, // 화면 전환이 끝난 뒤 시작해야 전환 애니메이션과 겹치지 않는다
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
        ],
      }}
    >
      <View
        className="gap-3 rounded-lg px-4 pb-4 pt-4"
        // 핑크 배경 위 반투명 흰 패널. 시안에서 추출한 불투명도(0.12).
        style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
