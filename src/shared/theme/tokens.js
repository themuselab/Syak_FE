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
  // 내 위치 파랑 (design.pen 내위치 마크업 wMGlf — 마커·현재위치 버튼 활성 상태 공용)
  myLocation: '#007AFF',
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

// ─────────────────────────────────────────────────────────────────────────────
// 의미 기반 토큰 (2026-10-12 리팩토링)
// 화면마다 흩어져 있던 하드코딩 hex 168건을 여기로 모았다. 값은 그대로 보존했으므로
// 이 단계에서 화면이 바뀌지 않는다. 아래 "통합 후보" 주석의 색들은 육안 구분이 안 되는
// 수준이라 디자이너 확인 후 한 단계로 합치면 토큰 수를 더 줄일 수 있다.
// ─────────────────────────────────────────────────────────────────────────────

// 글자색
const text = {
  strong: '#1a1a1a',       // 제목·본문 강조 (최다 사용)
  heading: '#212529',      // 통합 후보 → strong
  dark: '#222222',         // 통합 후보 → strong
  base: '#333333',
  body: '#3f3f3f',         // 통합 후보 → base
  secondary: '#495057',    // 통합 후보 → muted
  muted: '#555555',
  mutedAlt: '#5b5b5b',     // 통합 후보 → muted
  subtleAlt: '#7a7a7a',    // 통합 후보 → subtle
  subtleAlt2: '#7d7d7d',   // 통합 후보 → subtle
  subtle: '#7e7e7e',
  hint: '#868e96',
  weak: '#999999',
  faint: '#adb5bd',
  disabled: '#bfbfbf',
  placeholder: '#c3c3c3',
  inverse: '#FFFFFF',
};

// 구분선·테두리
const line = {
  divider: '#f3f3f3',      // 카드 사이 얇은 구분선
  base: '#ebebeb',
  baseAlt: '#e8e8e8',      // 통합 후보 → base
  baseAlt2: '#e6e6e6',     // 통합 후보 → base
  strong: '#e3e3e3',
  strongAlt: '#dee2e6',    // 통합 후보 → strong
  handle: '#d9d9d9',       // 바텀시트 핸들 인디케이터
};

// 배경
const surface = {
  base: '#FFFFFF',
  muted: '#f3f1f2',
  mutedAlt: '#f1f1f1',     // 통합 후보 → muted
  map: '#e9edf1',          // 지도 자리(키 없을 때 placeholder)
  scrim: '#f8f9fa33',      // 반투명 헤더 배경
};

// 브랜드(핑크) — primary 스케일로 안 떨어지는 디자이너 시안 색들
const brand = {
  deep: '#c24a6b',         // 선택된 카테고리 칩 채움
  selected: '#c9516e',     // 통합 후보 → deep
  active: '#b32f58',
  light: '#d46b8b',
  pale: '#ef6491',
  tint: '#fff1f6',         // 선택된 필터 칩 배경
  tintAlt: '#fdeef2',      // 통합 후보 → tint
  tintStrong: '#ffdfea',
};

// 상태
const status = {
  open: '#0f9d58',         // 영업 중 글자
  openBg: '#e6f7ed',       // 영업 중 배경
  error: '#e03131',
};

// 포인트
const accent = {
  favorite: '#FFC107',     // 즐겨찾기 별
  location: '#007AFF',     // 내 위치 파랑 (= colors.myLocation)
};

// 소셜 로그인 버튼 (각 사 브랜드 규정 색 — 임의 변경 금지)
const social = {
  kakao: '#ffee01',
  kakaoText: '#3c1e1e',
  naver: '#00de5a',
};

// 온보딩(스플래시·로그인) — 디자이너 시안 2026-10-15에서 추출
const onboarding = {
  // 세로 그라데이션: 시안 상단 #F8ADC7 → 하단 #D6426F (중간 지점 #F1709A)
  gradient: ['#f8adc7', '#f1709a', '#d6426f'],
  // 버튼 패널 = 흰색 12% 반투명. 시안 픽셀(#DD4E7B → #E1638A)에서 역산한 값
  glass: 'rgba(255,255,255,0.12)',
};

// 오버레이·그림자
const overlay = {
  dim: '#00000099',        // 모달 딤
  shadow: '#000000',       // 그림자 색
};

// 그림자 프리셋 — 6곳에 같은 블록이 복붙돼 있던 것을 모았다.
// iOS(shadow*)와 Android(elevation)를 함께 지정해야 양쪽에 보인다(CLAUDE.md §8).
const shadow = {
  // 검색바·칩처럼 지도 위에 살짝 떠 있는 요소
  sm: {
    shadowColor: overlay.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3.5,
    elevation: 2,
  },
  // "현 지도에서 검색"처럼 더 떠 보여야 하는 버튼
  md: {
    shadowColor: overlay.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  // 현재위치 버튼 — sm보다 한 단계 옅다
  xs: {
    shadowColor: overlay.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // 모달 카드(로그인 유도·탈퇴 확인)
  modal: {
    shadowColor: overlay.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.13,
    shadowRadius: 3.5,
    elevation: 3,
  },
};


module.exports = {
  colors: { ...colors, text, line, surface, brand, status, accent, social, overlay, onboarding },
  fontFamily,
  fontSize,
  borderRadius,
  shadow,
};
