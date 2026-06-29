import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

// 커스텀 토글 (design.pen 마이페이지 기준). RN 기본 Switch 대신 디자인 치수/색을 정확히 재현.
// 트랙 39×18, 노브 흰색 20×12. ON 트랙 #ef6491 / OFF 트랙 #ebebeb. 디자인 전용 hex(토큰 외).
const TRACK_W = 39;
const TRACK_H = 18;
const KNOB_W = 20;
const KNOB_H = 12;
const PAD = 2;
const OFF_X = PAD;
const ON_X = TRACK_W - KNOB_W - PAD;

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ value, onValueChange, disabled }: Props) {
  const x = useRef(new Animated.Value(value ? ON_X : OFF_X)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: value ? ON_X : OFF_X,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value, x]);

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      hitSlop={8}
      style={{
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: 999,
        backgroundColor: value ? '#ef6491' : '#ebebeb',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          width: KNOB_W,
          height: KNOB_H,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          transform: [{ translateX: x }],
        }}
      />
    </Pressable>
  );
}
