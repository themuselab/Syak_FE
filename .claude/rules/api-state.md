---
paths:
  - "src/shared/**/*"
  - "app/src/shared/**/*"
---

## 4. API / 데이터 레이어 규칙 (백엔드 계약 기반)

- **인증은 HTTP-only 쿠키 방식**이다 (`syak_access` / `syak_refresh`). `Authorization` 헤더를 쓰지 않으며, 토큰을 JS·AsyncStorage에 저장하지 않는다. RN 네이티브 쿠키 저장소에 의존한다.
- **Base URL은 환경변수**로 둔다: `EXPO_PUBLIC_API_URL` (개발 기본값 `http://localhost:3000/api/v1`).
- **공통 에러 형식** `{ code, message, details }` 를 파싱하는 단일 에러 핸들러를 쓴다. 분기는 `message`가 아니라 `code` 기준으로 한다.
- **토큰 자동 갱신 인터셉터**: 응답이 `AUTH_TOKEN_EXPIRED`이면 `POST /auth/token/refresh`를 호출한 뒤 원래 요청을 재시도한다.
  - 동시에 여러 요청이 만료될 때 **refresh는 1회만** 실행한다(중복 방지 큐 / single-flight).
  - `AUTH_REFRESH_INVALID`를 받으면 재로그인 필요 → 로그인 화면으로 이동.
- **React Query 컨벤션**: 쿼리 키는 `[도메인, 식별자]` 배열 규칙을 쓴다. (예: `['shops', filters]`, `['shops', shopId]`) `staleTime` 등 캐시 정책은 백엔드 TTL과 무관하게 클라에서 별도로 정한다.
- **위치**: 요청 함수와 react-query 훅은 `src/shared/domain/<도메인>`에, 공통 fetch 래퍼·인터셉터·`queryClient`는 `src/shared/api`·`src/shared/lib`에 둔다.
## 5. 상태 관리 규칙

- **서버에서 온 데이터 = React Query** (캐싱/로딩/에러 관리).
- **순수 클라이언트 상태 = Zustand** (예: UI 토글, 온보딩 단계, 지도 카메라 상태 등).
- 이 둘을 섞지 않는다. 서버 데이터를 Zustand에 복사해 들고 있지 않는다.
