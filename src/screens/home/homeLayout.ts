// 홈 지도뷰의 세로 좌표 상수. 시트 위치를 기준으로 지도 컨트롤·내 위치 버튼이 줄줄이 배치되므로,
// 각 컴포넌트가 따로 계산하지 않게 한곳에 모은다(QA #54·#55).
// HomeScreen에 두면 ShopBottomSheet ← HomeScreen 순환 import가 되어 별도 모듈로 분리.

// 시트 기본 스냅(디자인). 시트 snapPoints와 지도 오버레이가 같은 값을 써야 겹치지 않는다.
export const SHEET_DEFAULT_RATIO = 0.4;
export const SHEET_DEFAULT_SNAP = `${SHEET_DEFAULT_RATIO * 100}%`;

// 시트를 끝까지 내렸을 때 남는 높이 = gorhom 기본 핸들(≈33) + 필터 칩바(정렬칩 33 + pb 11) + 여유.
// "끝까지 내리면 모달 윗부분만 살짝 노출"(QA #54) — 지도를 거의 풀스크린으로 본다.
// 기본 위치는 여전히 40%이고, 이건 사용자가 더 끌어내렸을 때 도달하는 최소 스냅이다.
export const SHEET_MIN_HEIGHT = 96;

// 네이버 SDK 기본 컨트롤(+/-)을 앱 커스텀 '내 위치' 버튼 위로 올리기 위한 여유.
// = 버튼 아래 여백(16) + 버튼 높이(40) + 버튼과의 간격(8). mapPadding.bottom에 더해 쓴다(QA #55).
export const MAP_CONTROL_CLEARANCE = 64;
