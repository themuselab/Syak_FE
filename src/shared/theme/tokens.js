// 단일 출처 디자인 토큰.
// tailwind.config.js(require)와 TS 코드(import)가 같은 값을 공유한다.
// 출처: designs/공통/* + designs/design.pen
// 결정: Primary = Red 스케일, 폰트 = Pretendard, 흰색 오타는 #FFFFFF로 보정.

const colors = {
  primary: {
    50: '#fbecf0',
    100: '#f1c3d1',
    200: '#eaa6ba',
    300: '#e17e9b',
    400: '#db6588',
    500: '#d23e6a',
    600: '#bf3860',
    700: '#952c4b',
    800: '#74223a',
    900: '#581a2d',
  },
  gray: {
    50: '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#C5CCD4',
    500: '#868E96',
    600: '#868E96', // TODO: 디자이너 확인 (Neutral 표에서 500과 중복)
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },
  white: '#FFFFFF',
  success: { 100: '#E6FCF5', 500: '#2FB344' },
  warning: { 100: '#FFF4E6', 500: '#F5B301' },
  error: { 100: '#FFF5F5', 500: '#E03131' },
};

// 굵기별 폰트 패밀리 (RN 안드로이드 weight 합성이 약해 굵기를 패밀리로 매핑)
const fontFamily = {
  pretendard: ['Pretendard-Regular'],
  'pretendard-medium': ['Pretendard-Medium'],
  'pretendard-semibold': ['Pretendard-SemiBold'],
};

// 텍스트 스케일: [size, { lineHeight, letterSpacing }] — 굵기는 font-pretendard-* 클래스로 적용.
const fontSize = {
  'display-l': ['24px', { lineHeight: '32px', letterSpacing: '-0.48px' }],
  'heading-xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.2px' }],
  'heading-l': ['18px', { lineHeight: '24px', letterSpacing: '0px' }],
  'heading-m': ['16px', { lineHeight: '22px', letterSpacing: '0px' }],
  'body-l': ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
  'body-m': ['14px', { lineHeight: '20px', letterSpacing: '0px' }],
  'label-l': ['16px', { lineHeight: '20px', letterSpacing: '0px' }],
  'label-m': ['14px', { lineHeight: '18px', letterSpacing: '0px' }],
  'label-s': ['12px', { lineHeight: '16px', letterSpacing: '0px' }],
  'caption-m': ['12px', { lineHeight: '16px', letterSpacing: '0px' }],
  'caption-s': ['11px', { lineHeight: '14px', letterSpacing: '0.11px' }],
};

const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '20px',
  xl: '28px',
  full: '999px',
};

module.exports = { colors, fontFamily, fontSize, borderRadius };
