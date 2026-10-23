import { View } from 'react-native';

// 인스타그램 글리프(둥근 사각 + 원 + 점). lucide-react-native가 브랜드 아이콘을 제거해서
// 이미지 에셋 없이 View로 그린다 — 크기·색을 다른 아이콘처럼 props로 받는다.
// filled: 둥근 사각을 색으로 채우고 렌즈·점을 흰색으로 뚫는다(상세 정보·버튼의 채워진 아이콘 스타일).
export function InstagramIcon({ size = 16, color, filled = false }: { size?: number; color: string; filled?: boolean }) {
  const stroke = Math.max(1.5, size / 10);
  const lens = size * 0.42;
  if (filled) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{ width: lens, height: lens, borderRadius: lens / 2, borderWidth: stroke, borderColor: '#fff' }}
        />
        <View
          style={{
            position: 'absolute',
            top: size * 0.16,
            right: size * 0.16,
            width: stroke * 1.2,
            height: stroke * 1.2,
            borderRadius: stroke,
            backgroundColor: '#fff',
          }}
        />
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        borderWidth: stroke,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{ width: lens, height: lens, borderRadius: lens / 2, borderWidth: stroke, borderColor: color }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.12,
          right: size * 0.12,
          width: stroke * 1.2,
          height: stroke * 1.2,
          borderRadius: stroke,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
