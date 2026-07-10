import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ShopCardView } from '../shopToView';

export type HomeMapRef = { moveTo: (lat: number, lng: number) => void };

type Props = {
  shops: ShopCardView[];
  onMarkerPress: (id: string) => void;
  onMapPress?: () => void;
  myLocation?: { lat: number; lng: number } | null; // 네이티브와 시그니처 일치용 (placeholder라 미표시)
  selectedShopId?: string | null; // 네이티브와 시그니처 일치용 (placeholder라 미표시)
};

// web/Expo Go: 네이버 지도는 네이티브 전용이라 회색 placeholder. (실제 지도는 dev build)
export const HomeMap = forwardRef<HomeMapRef, Props>((_props, ref) => {
  useImperativeHandle(ref, () => ({ moveTo: () => {} }));
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#e9edf1' }]} />;
});

HomeMap.displayName = 'HomeMap';
