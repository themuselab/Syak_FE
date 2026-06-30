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

> 아래 9건(2026-06-30)은 **카카오 로그인 dev build 실기기 연동** 과정에서 차례로 만난 문제다.
> 전체 셋업 절차는 [dev-build.md](./dev-build.md), 인증 흐름은 [auth.md](./auth.md) 참고.

## 2026-06-30 · 카카오 로그인 500 `column u.status does not exist`
- 증상: 키해시·DB 통과 후 `POST /api/v1/auth/kakao`가 500. 로그에 `DatabaseError: column u.status does not exist`.
- 원인: 백엔드 도커가 `db/init.sql`만 실행하고(`docker-entrypoint-initdb.d`에 init.sql만 마운트) `db/migration_v2.sql`(`ALTER TABLE users ADD COLUMN status ...`)은 적용 안 함 → 코드가 기대하는 컬럼이 DB에 없음.
- 해결: 누락 마이그레이션을 로컬 DB에 적용 — `docker compose exec -T db psql -U syak -d syak_dev < db/migration_v2.sql`(멱등). 근본 해결은 백엔드 도커 초기화가 마이그레이션까지 돌리는 것(syakBE 영역).
- 관련: 백엔드 로컬(`syakBE/db/migration_v2.sql`)
- 교훈: 도커 DB가 `init.sql`만 실행하면 후속 마이그레이션이 누락된다. 스키마 에러는 "어느 마이그레이션이 그 컬럼을 추가하는지" 먼저 확인.

## 2026-06-30 · 백엔드 도커 app이 DB에 `ECONNREFUSED 5432`
- 증상: `docker compose up` 후 컨테이너는 뜨는데 app 로그에 `connect ECONNREFUSED 127.0.0.1:5432 / ::1:5432` 반복. 카카오 로그인도 이 때문에 500.
- 원인: `.env`의 `DATABASE_URL`·`SUPABASE_DATABASE_URL` host가 `localhost`(비도커 npm 실행 기준). 도커 안에선 localhost가 컨테이너 자기 자신이라 postgres(`db` 서비스)에 못 붙음.
- 해결: `docker-compose.override.yml`(신규)에서 app의 두 URL host를 서비스명 `db`로 오버라이드(원본 `.env`/compose는 보존). → `SlotListener connected` 로 정상화.
- 관련: 백엔드 로컬(`syakBE/docker-compose.override.yml`)
- 교훈: 도커 컴포즈에서 컨테이너 간 연결은 `localhost`가 아니라 서비스명. `.env`가 localhost 기준이면 override로 분리.

## 2026-06-30 · 카카오 로그인 `keyHash validation failed` (Misconfigured)
- 증상: 카카오 동의까지 떴는데 `Error: Android keyHash validation failed. code: Misconfigured` → "로그인 실패".
- 원인: EAS가 만든 빌드 keystore의 키해시가 카카오 콘솔에 등록돼 있지 않음.
- 해결: EAS 대시보드(또는 `eas credentials`)의 **SHA-1**을 카카오용 base64 키해시로 변환 — `python -c "import base64;print(base64.b64encode(bytes.fromhex('AB:CD..'.replace(':',''))).decode())"` → 카카오 콘솔 앱 설정 → 플랫폼 Android → 키 해시에 등록(여러 개 가능).
- 관련: [dev-build.md](./dev-build.md) C단계
- 교훈: 키해시는 빌드 keystore마다 다름. 로컬/EAS/릴리즈 각각 등록 필요. 미등록 시 백엔드에 닿기도 전에 SDK에서 막힘.

## 2026-06-30 · dev build 실행 시 `NoClassDefFoundError` (`@expo/ui`)
- 증상: dev build 앱 실행 즉시 크래시 — `NoClassDefFoundError ... ComposeViewFunctionDefinitionBuilder` (ExpoUIModule).
- 원인: create-expo-app 템플릿 잔재인 `@expo/ui`(beta/canary)가 SDK54 `expo-modules-core`와 비호환. web/Expo Go에선 네이티브 모듈을 안 써서 안 드러나다 네이티브 빌드에서 표면화.
- 해결: 코드에서 미사용 → `npm uninstall @expo/ui`.
- 관련: `package.json`
- 교훈: 네이티브 빌드 전엔 안 보이던 호환성 문제가 dev build에서 처음 터진다. 안 쓰는 네이티브 패키지는 제거.

## 2026-06-30 · 카카오 Gradle 빌드 실패 — `com.kakao.sdk:*` 못 찾음
- 증상: EAS Android 빌드의 `Run gradlew`에서 `Could not find com.kakao.sdk:v2-common/v2-user`.
- 원인: 카카오 SDK는 카카오 전용 Maven 저장소(`devrepo.kakao.com`)에만 있는데, Expo가 저장소를 `settings.gradle`에서 중앙 관리하면서 그 저장소가 빠짐("project declares repositories, effectively ignoring...").
- 해결: `expo-build-properties` 설치 후 `app.config.ts` plugin에 `android.extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/']`.
- 관련: `app.config.ts`, 커밋 `08a0882`
- 교훈: 네이티브 SDK가 전용 Maven repo를 쓰면 Expo에선 `expo-build-properties`로 repo를 추가해야 한다.

## 2026-06-30 · `eas build` 실패 — `expo-dev-client` 누락
- 증상: `eas build --profile development`가 "you don't have expo-dev-client installed"로 즉시 실패.
- 원인: development(dev client) 빌드는 `expo-dev-client` 필수인데 미설치.
- 해결: `npx expo install expo-dev-client`.
- 관련: `package.json`, 커밋 `f8f595d`

## 2026-06-30 · `eas init`/`build`가 "expo config exited code 1"
- 증상: `eas init`이 내부 `expo config --json`에서 종료코드 1로 실패(직접 실행하면 정상).
- 원인: `eas`는 `.env`를 읽지 않아 `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`가 빈 값 → 카카오 plugin의 필수 `nativeAppKey`가 없어 config 평가가 throw.
- 해결: `app.config.ts`에서 **키가 있을 때만** 카카오 plugin을 추가(조건부)해 로컬 평가가 깨지지 않게 하고, 빌드용 키는 `eas env:create`로 EAS 환경에 주입. (즉석 우회로는 `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=... eas init`도 가능)
- 관련: `app.config.ts`, 커밋 `2fc6ed8`
- 교훈: EAS는 `.env`를 자동 로드하지 않는다. `EXPO_PUBLIC_*`라도 빌드/CLI에는 `eas env` 또는 명시 주입이 필요.

## 2026-06-30 · 카카오 config plugin 파싱 실패 — `@expo/config-plugins/.../codeMod` 못 찾음
- 증상: `npx expo config`에서 `Unable to resolve a valid config plugin for @react-native-kakao/core` + `Cannot find module '@expo/config-plugins/build/ios/codeMod'`.
- 원인: `react-native-kakao` plugin이 `@expo/config-plugins`를 직접 import하는데, SDK54에선 그게 각 expo 패키지 안에 중첩 설치돼 루트에 hoist 안 됨 → 라이브러리가 자기 위치에서 못 찾음.
- 해결: 루트에 `npx expo install @expo/config-plugins`(54.0.4) 설치. (expo-doctor의 "직접 설치 금지" 경고는 peer 충족용이라 무시 가능 — doctor 메시지에도 명시.)
- 관련: `package.json`
- 교훈: 서드파티 config plugin이 구식 `@expo/config-plugins` import를 쓰면 루트에 해당 버전을 직접 설치해 해결.

## 2026-06-30 · metro `@emnapi/core/dist` ENOENT 워처 크래시
- 증상: `expo start` 시 `ENOENT: watch '...node_modules\@emnapi\core\dist'` (metro FallbackWatcher)로 metro가 죽음. dev client가 metro에 연결 못 함.
- 원인: dev/optional 의존성 `@emnapi/core`가 `dist` 없이 설치돼, Windows의 metro 파일 워처가 없는 폴더를 감시하다 크래시.
- 해결: `metro.config.js` `resolver.blockList`에 `@emnapi` 경로 제외(앱 번들 미사용이라 무해).
- 관련: `metro.config.js`, 커밋 `4818bb9`
- 교훈: Windows + metro에서 불완전 설치된 패키지가 워처를 죽일 수 있다. `blockList`로 제외.

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
