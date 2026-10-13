# Vercel 배포 (앱 웹 빌드)

소비자 앱을 그대로 웹으로 export해서 Vercel에 올린다. 네이티브 셸(웹뷰)이 이 주소를 띄운다.
전환 배경과 전체 단계는 [webview-migration.md](./webview-migration.md) 참고.

---

## 1. 빌드 설정

레포 루트의 `vercel.json`이 전부 들고 있다. 대시보드에서 따로 만질 것은 없다.

| 항목 | 값 |
|---|---|
| Framework Preset | **Other** (`framework: null`) |
| Build Command | `npx expo export --platform web --output-dir dist` |
| Output Directory | `dist` |
| Root Directory | **`.`** (이 레포가 앱 레포다) |

- `cleanUrls: true` — expo-router 정적 export는 `/home` → `home.html` 형태를 전제한다.
- `rewrites` — 동적 라우트 `/shop/123`은 파일이 `shop/[id].html`이라 매핑이 필요하다.

---

## 2. 환경변수 (Vercel → Settings → Environment Variables)

`EXPO_PUBLIC_*`는 **빌드 시점에 번들로 들어간다.** 값이 없으면 조용히 기능만 빠진다.

| 변수 | 웹에 필요? | 설명 |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | **필수** | `https://api.themuselab.kr/api/v1` |
| `EXPO_PUBLIC_NAVER_MAP_WEB_CLIENT_ID` | **필수** | 네이버 Web Dynamic Map 키. 없으면 기본 공개 키로 떨어진다 |
| `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID` | 불필요 | 네이티브 지도 SDK 전용 |
| `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` | 불필요 | 네이티브 SDK 전용(웹에선 가드로 통과) |
| `EXPO_PUBLIC_NAVER_CONSUMER_KEY` / `_SECRET` / `_APP_NAME` / `_URL_SCHEME` | 불필요 | 네이티브 로그인 SDK 전용 |

> 소셜 로그인은 네이티브 셸이 SDK로 처리하고 세션만 웹뷰로 넘긴다(브리지 미구현 — 다음 단계).
> 그래서 위 네이티브 키들은 웹 빌드에 넣지 않는다.

---

## 3. 도메인 — `*.themuselab.kr` 서브도메인으로

**`vercel.app` 기본 도메인을 쓰면 안 된다.** API(`api.themuselab.kr`)와 크로스사이트가 돼서
쿠키가 막히고, `SameSite=none; Secure`로 백엔드까지 바꿔야 한다.

`app.themuselab.kr` 같은 서브도메인을 붙이면 **동일 사이트**라 지금 쿠키 설정 그대로 동작한다.

1. Vercel → Settings → Domains → `app.themuselab.kr` 추가
2. DNS에 Vercel이 안내하는 CNAME 등록

---

## 4. 네이버 지도 콘솔 등록 (안 하면 지도가 안 뜬다)

네이버 클라우드 콘솔 → **Web Dynamic Map** → 서비스 환경에 **호출 도메인**을 등록한다.
미등록 도메인에서는 SDK가 인증 실패로 타일·마커를 전부 그리지 않는다(지도 자리가 통째로 비어 보인다).

등록할 것:
- `app.themuselab.kr` (운영)
- `localhost` (로컬 확인용)

---

## 5. 확인 순서

1. 배포 후 `/home` — 샵 목록이 뜨면 API·CORS·쿠키 경로 정상
2. 지도 타일 — 안 뜨면 4번(도메인 등록) 또는 `EXPO_PUBLIC_NAVER_MAP_WEB_CLIENT_ID`
3. `/shop/<실제 id>` — 404면 `vercel.json`의 rewrite 확인
4. 로그인 — 현재는 웹 단독으로 동작하지 않는다(네이티브 브리지 필요). 비회원 둘러보기로 확인

---

## 6. 아직 안 된 것

- **소셜 로그인 브리지** — 네이티브 SDK 세션을 웹뷰 쿠키로 넘기는 핸드오프 미구현
- **푸시 브리지** — 토큰 등록·알림 탭 딥링크
- **지도 클러스터링** — 네이버 공식 MarkerClustering 미적용(목록 60개 제한이라 당장은 읽힘)
