import { StyleSheet, View } from 'react-native';

// Phase 1: 지도 placeholder (단색 배경). Phase 2(dev build)에서 NaverMapView로 교체.
// design.pen의 지도는 외부 이미지 fill이라 export가 안 됨 → 실제 지도는 Phase 2에서.
export function MapPlaceholder() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e9edf1' }]} />;
}
