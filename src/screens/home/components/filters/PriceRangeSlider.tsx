import { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import { PRICE_MAX, type PriceRange } from '../../useHomeFilterStore';

// 가격 범위 듀얼 슬라이더(만원 단위, 0 ~ PRICE_MAX). 디자이너 시안 2026-10-15 필터 패널.
// 새 라이브러리 없이 PanResponder로 처리 — react-native-web(웹뷰)에서도 그대로 동작한다.
//
// 좌표는 pageX - 트랙의 화면상 x로 계산한다. locationX를 쓰면 손가락이 노브(자식 뷰) 위에
// 있을 때 노브 기준 좌표가 들어와 값이 튄다(RadiusSlider와 다른 점).
const KNOB = 22;
const TRACK_H = 6;

type Props = {
  value: PriceRange;
  onChange: (next: PriceRange) => void;
};

export function PriceRangeSlider({ value, onChange }: Props) {
  const trackRef = useRef<View>(null);
  const [trackW, setTrackW] = useState(0);
  const geom = useRef({ left: 0, width: 0 });
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // 이번 드래그가 잡은 노브 (0 = 최소, 1 = 최대)
  const activeRef = useRef<0 | 1>(0);

  const toValue = (pageX: number) => {
    const { left, width } = geom.current;
    if (width <= 0) return 0;
    const ratio = Math.min(1, Math.max(0, (pageX - left) / width));
    return Math.round(ratio * PRICE_MAX);
  };

  const apply = (pageX: number) => {
    const v = toValue(pageX);
    const [min, max] = valueRef.current;
    // 두 노브가 서로를 넘어가지 않게 클램프한다.
    const next: PriceRange = activeRef.current === 0 ? [Math.min(v, max), max] : [min, Math.max(v, min)];
    if (next[0] !== min || next[1] !== max) onChangeRef.current(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // 바텀시트 드래그가 가로 슬라이드를 뺏어가지 않게 제스처를 놓지 않는다.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const v = toValue(e.nativeEvent.pageX);
        const [min, max] = valueRef.current;
        // 터치한 곳에서 더 가까운 노브를 잡는다. 두 노브가 겹쳐 있으면 진행 방향으로 결정되도록
        // 오른쪽 끝이면 최소 노브, 아니면 최대 노브를 잡는다.
        if (min === max) activeRef.current = v >= max && max < PRICE_MAX ? 1 : 0;
        else activeRef.current = Math.abs(v - min) <= Math.abs(v - max) ? 0 : 1;
        apply(e.nativeEvent.pageX);
      },
      onPanResponderMove: (e) => apply(e.nativeEvent.pageX),
    }),
  ).current;

  const measure = () => {
    trackRef.current?.measureInWindow((x, _y, w) => {
      geom.current = { left: x, width: w };
      setTrackW(w);
    });
  };

  const [min, max] = value;
  const minX = (min / PRICE_MAX) * trackW;
  const maxX = (max / PRICE_MAX) * trackW;

  return (
    <View
      ref={trackRef}
      {...pan.panHandlers}
      onLayout={measure}
      // 노브가 트랙 양끝에서 반쯤 삐져나오므로 좌우 여백을 준다.
      style={{ height: KNOB + 8, justifyContent: 'center', marginHorizontal: KNOB / 2 }}
    >
      {/* 전체 트랙 */}
      <View style={{ height: TRACK_H, borderRadius: 999, backgroundColor: colors.brand.tint }} />
      {/* 선택 구간 */}
      <View
        style={{
          position: 'absolute',
          left: minX,
          width: Math.max(maxX - minX, 0),
          height: TRACK_H,
          borderRadius: 999,
          backgroundColor: colors.brand.deep,
        }}
      />
      {[minX, maxX].map((x, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: x - KNOB / 2,
            width: KNOB,
            height: KNOB,
            borderRadius: 999,
            backgroundColor: colors.brand.deep,
          }}
        />
      ))}
    </View>
  );
}
