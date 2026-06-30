# 트러블슈팅 기록

겪은 오류·문제와 해결을 누적한다. **최신 항목을 맨 위(역순)** 로 추가한다.
같은 증상이 다시 나오면 여기부터 검색(Ctrl+F)한다.

> 항목 양식
> ```
> ## YYYY-MM-DD · 한 줄 증상
> - 증상:
> - 원인:
> - 해결:
> - 관련: 파일/커밋/링크
> - 교훈(선택):
> ```

---

## 2026-06-30 · 홈 헤더 알림·프로필 아이콘 탭해도 이동 안 함
- 증상: 홈 화면 헤더의 벨(알림)·유저(프로필) 아이콘을 눌러도 아무 반응 없음.
- 원인: `HomeHeader`의 두 `Pressable`에 `onPress`가 없었음(아이콘만 렌더, 핸들러 누락).
- 해결: 벨 → `router.push('/notifications')`, 유저 → `router.push('/my')` 연결.
- 관련: 커밋 `5f6ee37`, `src/screens/home/components/HomeHeader.tsx`
- 교훈: 디자인엔 보여도 `Pressable`은 `onPress` 없으면 죽은 버튼. 화면 추가 시 진입점(헤더 아이콘 등) 연결도 함께 점검.

## 2026-06-29 · 아이폰 Expo Go에서 파란 스플래시에서 안 넘어감
- 증상: Expo Go 연결은 되는데(앱 스플래시 표시) 화면이 안 바뀜. 흔들면 dev 메뉴는 뜸(JS는 살아있음), 터미널 에러 로그 없음, `iOS Bundled` 정상.
- 원인: `app/index.tsx`(`/` 진입 라우트)가 없었음. 네이티브 앱은 시작 시 `/`를 여는데 매칭 라우트가 없어 멈춤. (`unstable_settings.initialRouteName`만으로는 해결 안 됨 — 웹은 `/login`을 직접 열어 안 걸렸던 것)
- 해결: `app/index.tsx`에 `<Redirect href="/splash" />` 추가.
- 관련: 커밋 `1ab2329`, `app/index.tsx`
- 교훈: 네이티브 진입은 항상 `/`부터. `app/index.tsx`는 사실상 필수.

## 2026-06-29 · 스플래시에서 멈출 수 있는 폰트 로딩 게이트
- 증상: 위 문제 추적 중, `_layout`이 `useFonts` 완료까지 `return null` 하면 폰트 로딩이 지연/실패 시 스플래시에서 영영 멈출 수 있음.
- 원인: 렌더를 폰트 로딩 완료에 묶어둠.
- 해결: 폰트를 백그라운드로 로드하고, 마운트 시 `SplashScreen.hideAsync()`로 즉시 해제(폰트는 준비되는 대로 적용).
- 관련: 커밋 `1ab2329`, `app/_layout.tsx`

## 2026-06-29 · `npx expo start --tunnel` 실패 (ngrok)
- 증상: `CommandError: failed to start tunnel`, `remote gone away`.
- 원인: ngrok 서버 연결 실패(일시적/네트워크). 터널은 불안정할 수 있음.
- 해결: LAN 방식으로 복귀 — `npx expo start -c` 후 같은 WiFi에서 QR 스캔. (터널이 꼭 필요하면 재시도하면 되기도 함)
- 관련: 없음(환경 이슈)

## 2026-06-29 · Expo Go에서 "Project is incompatible / requires newer Expo Go"
- 증상: QR 스캔 시 SDK 버전 불일치 오류. Expo Go 최신 설치해도 동일.
- 원인: 프로젝트가 SDK 56인데 스토어 Expo Go는 SDK 54까지만 지원(`expoGoSdkVersion: 54.0.0`).
- 해결: 프로젝트를 SDK 54로 다운그레이드 — `npm install expo@~54.0.0 --legacy-peer-deps` → `npx expo install --fix`. `.npmrc`에 `legacy-peer-deps=true` 추가로 peer 충돌 회피.
- 관련: 커밋 `b740f10`, [decisions.md](./decisions.md)
- 교훈: `create-expo-app@latest`가 주는 최신 SDK가 스토어 Expo Go보다 앞설 수 있음. Expo Go로 테스트하려면 `expoGoSdkVersion` 확인(`https://api.expo.dev/v2/versions/latest`).

## 2026-06-29 · design.pen 배경(blur) export 실패
- 증상: `pencil` MCP `export_nodes`로 온보딩 배경 mask group/프레임 export 시 실패.
- 원인: 배경에 blur 효과가 있어 렌더 export가 안 됨.
- 해결: 배경은 사용자가 Figma에서 PNG로 export해 `assets/images/onboarding-bg.png`로 제공. (아이콘 등 blur 없는 벡터는 export 정상)
- 관련: `src/screens/onboarding/components/OnboardingBackground.tsx`
