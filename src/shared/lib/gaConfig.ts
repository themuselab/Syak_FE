// GA4 측정 ID — 소비자 웹(www, themuselab.kr)과 같은 속성("Syak")을 쓴다. 웹/앱은 이벤트 파라미터
// `platform`(web | ios | android)으로 구분한다. app/+html.tsx(정적 HTML head의 gtag 로더)와
// analytics.ts가 함께 읽는다 — 의존성 없는 상수 파일로 둬서 정적 렌더(Node)에서도 안전하게 import된다.
export const GA_MEASUREMENT_ID = 'G-Q0WLLSMTXM';
