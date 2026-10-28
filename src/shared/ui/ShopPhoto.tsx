import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import { View, type ImageStyle } from 'react-native';

import { colors } from '@/shared/theme/colors';

const LOGO = require('../../../assets/images/logo.png');

type Props = Omit<ImageProps, 'style'> & { style: ImageStyle & { width: number; height: number } };

// 샵 사진. 사진은 네이버 이미지 서버 주소를 그대로 쓰므로(우리 서버에 파일이 없음) 네이버가 외부 표시를 막거나
// 사진이 지워지면 깨진다 → 실패하면 같은 크기의 칸에 샥 로고를 보여준다(2026-10-28, 네이버 의존 리스크 대응).
export function ShopPhoto({ style, onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    const logo = Math.round(Math.min(style.width, style.height) * 0.36);
    return (
      <View
        style={{
          width: style.width,
          height: style.height,
          borderRadius: style.borderRadius,
          backgroundColor: colors.surface.mutedAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image source={LOGO} style={{ width: logo, height: logo, borderRadius: logo * 0.22 }} contentFit="contain" />
      </View>
    );
  }
  return (
    <Image
      {...rest}
      style={style}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
