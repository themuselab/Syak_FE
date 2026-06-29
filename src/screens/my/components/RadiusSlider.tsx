import { useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';

// 알림 반경 슬라이더 (커스텀). design.pen frame y1ARc(k1H7d) 기준.
// 트랙 8px #ebebeb / 채움 #ffdfea / 노브 20 #ef6491. 상·하 보더 1px #f3f3f3. 범위 1~10(정수, km).
// 새 라이브러리 없이 RN PanResponder로 드래그 처리.
const MIN = 1;
const MAX = 10;
const KNOB = 20;
const TRACK_H = 8;

type Props = {
  value: number;
  onChange: (next: number) => void;
};

export function RadiusSlider({ value, onChange }: Props) {
  const [trackW, setTrackW] = useState(0);
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const valueFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return value;
    const ratio = Math.min(1, Math.max(0, x / w));
    return Math.round(MIN + ratio * (MAX - MIN));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onChangeRef.current(valueFromX(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => onChangeRef.current(valueFromX(e.nativeEvent.locationX)),
    }),
  ).current;

  const ratio = (value - MIN) / (MAX - MIN);
  const center = ratio * trackW;
  const knobLeft = Math.min(Math.max(center - KNOB / 2, 0), Math.max(trackW - KNOB, 0));

  return (
    <View
      style={{
        gap: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f3f3f3',
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-pretendard-medium" style={{ fontSize: 14, color: '#555555' }}>
          알림 반경
        </Text>
        <Text className="font-pretendard-semibold" style={{ fontSize: 14, color: '#1a1a1a' }}>
          {value}km
        </Text>
      </View>

      <View
        {...pan.panHandlers}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          widthRef.current = w;
          setTrackW(w);
        }}
        style={{ height: KNOB, justifyContent: 'center' }}
      >
        {/* 트랙 */}
        <View style={{ height: TRACK_H, borderRadius: 999, backgroundColor: '#ebebeb' }} />
        {/* 채움 */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            height: TRACK_H,
            width: center,
            borderRadius: 999,
            backgroundColor: '#ffdfea',
          }}
        />
        {/* 노브 */}
        <View
          style={{
            position: 'absolute',
            left: knobLeft,
            width: KNOB,
            height: KNOB,
            borderRadius: 999,
            backgroundColor: '#ef6491',
          }}
        />
      </View>
    </View>
  );
}
