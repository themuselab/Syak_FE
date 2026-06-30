# Dev Build 셋업 가이드 (실기기 네이티브 테스트)

> 카카오 로그인 등 **네이티브 모듈**을 실기기에서 테스트하기 위한 전체 절차. 2026-06-30 카카오 로그인을
> 갤럭시탭에서 end-to-end로 검증한 경로를 그대로 정리했다. 막힌 지점들은 [troubleshooting.md](./troubleshooting.md) 참고.

## 왜 dev build인가
- **네이티브 SDK(카카오/네이버/애플·지도 등)는 Expo Go에서 못 돌린다.** 그 모듈을 포함한 **나만의 앱(dev client)**을 빌드해 기기에 깔아야 한다.
- 한 번 깔면 **JS/화면 변경은 재빌드 없이** `expo start --dev-client`로 즉시 반영. **네이티브가 바뀔 때만**(SDK 추가/plugin 변경) 재빌드.
- EAS 무료: **Android·iOS 각 15빌드/월**(실패도 차감), 큐 우선순위 낮음. 사용량: https://expo.dev/accounts/<account>/settings/billing

---

## A. EAS 빌드 (클라우드)
1. `npm i -g eas-cli`
2. `eas login` — Expo 계정(없으면 expo.dev 가입). **인터랙티브라 본인이 직접.**
3. `eas init` — 프로젝트 생성(`app.json`에 `extra.eas.projectId`, `owner` 기록).
   - ⚠️ `app.config.ts`가 카카오 키를 요구하면 init 시 `expo config` 실패 → 키를 함께 주거나(아래) 조건부 plugin 처리. 즉석 우회: `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=<키> eas init --non-interactive --force`
4. **키를 EAS 환경에 등록**(EAS는 `.env`를 안 읽음):
   `eas env:create --name EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY --value <네이티브앱키> --environment development --visibility plaintext --non-interactive`
   - 네이버까지 쓰면 동일 방식으로 4종 추가: `EXPO_PUBLIC_NAVER_CONSUMER_KEY`, `EXPO_PUBLIC_NAVER_CONSUMER_SECRET`, `EXPO_PUBLIC_NAVER_APP_NAME`, `EXPO_PUBLIC_NAVER_URL_SCHEME`. (consumerSecret도 앱에 박히는 값이라 plaintext로 둠 — 네이버 SDK 한계, [decisions.md](./decisions.md) 참고.)
5. `eas build --profile development --platform android --non-interactive`
   - 첫 빌드는 keystore 자동 생성. 완료되면 apk 링크/QR 출력.
6. apk를 기기에 설치(링크/QR). 같은 앱 식별자라 기존 위에 덮어쓰기됨.

`eas.json`(이미 있음): `development`={ developmentClient, distribution: internal, android.buildType: apk }.

---

## B. 카카오 콘솔 (developers.kakao.com)
> 백엔드 `KAKAO_REST_API_KEY`와 **같은 카카오 앱**이어야 함(앱용 네이티브 앱 키 ≠ 서버용 REST 키, 단 같은 앱 소속).
1. 앱 → **앱 키 → 네이티브 앱 키** 복사 → 프론트 `.env` `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`(공개키, git 제외) + EAS env(A-4).
2. **플랫폼 등록**: Android 패키지명 `com.themuselab.syak`(+키해시는 C에서) / iOS 번들 ID `com.themuselab.syak`.
3. **카카오 로그인 활성화 ON** + **동의항목**(닉네임·프로필 사진).

## C. 키해시 등록 (가장 흔한 함정)
1. SHA-1 확인: EAS 대시보드 `.../credentials` → Android keystore → **SHA-1 Fingerprint** (또는 `eas credentials`).
2. base64 변환:
   ```bash
   python -c "import base64;sha1='EC:DF:..'.replace(':','');print(base64.b64encode(bytes.fromhex(sha1)).decode())"
   ```
3. 그 값을 카카오 콘솔 **플랫폼 → Android → 키 해시**에 추가(여러 개 등록 가능) → 저장. 1~2분 후 반영.
- 미등록 시: `keyHash validation failed (Misconfigured)` → 백엔드에 닿기도 전에 SDK에서 실패.

---

## C-2. 네이버 콘솔 (developers.naver.com) — 네이버 추가 시
> 카카오의 B·C에 해당. **네이버 로그인은 Android에 키해시가 필요 없고 패키지명만** 등록한다(카카오와 차이).
> 백엔드 `NaverAuthProvider`는 토큰만 검증(`openapi.naver.com/v1/nid/me`)하므로 **콘솔의 같은 네이버 앱**이면 된다.
1. **애플리케이션 등록**: 네이버 개발자센터 → Application → 애플리케이션 등록.
2. **사용 API = "네이버 로그인"** 추가. 제공 정보(필수: 회원이름 또는 닉네임, 프로필 사진) 선택.
3. **Client ID / Client Secret 발급** → 프론트 `.env`(`EXPO_PUBLIC_NAVER_CONSUMER_KEY`/`_CONSUMER_SECRET`, git 제외) + EAS env(A-4). `EXPO_PUBLIC_NAVER_APP_NAME`은 앱 표시명(예: `syak`).
4. **로그인 오픈 API 서비스 환경 등록**:
   - **Android**: 패키지명 `com.themuselab.syak` + 다운로드 URL(아무 값). **키해시 불필요.**
   - **iOS**: URL Scheme(예: `naverLogin`) + 번들 ID `com.themuselab.syak`. 이 scheme을 `.env` `EXPO_PUBLIC_NAVER_URL_SCHEME`과 `app.config.ts` naver plugin(`urlScheme`)에 **동일하게** 넣는다.
5. **재빌드 필요** — 네이티브 모듈(`@react-native-seoul/naver-login`) 추가라 A의 EAS 빌드를 다시 돌려야 기기에 반영된다(JS만 바뀐 게 아님).
- Android 릴리스(minify/R8) 빌드 시 Proguard 규칙 `-keep public class com.navercorp.nid.** { *; }` 필요(현재 development apk는 minify 안 해서 불필요, 추후 릴리스 시 챙길 것).

---

## C-3. 네이버 지도 (NCP) — 홈 지도용
> ⚠️ **로그인용 developers.naver.com과 별개**인 **`console.ncloud.com`(네이버 클라우드 플랫폼)**에서 발급한다.
> 모바일 앱 지도라 **Mobile Dynamic Map = 월 1억 호출 무료**(우리 규모 사실상 무비용, 카드 등록만 필요).
1. **가입 + 결제수단(카드) 등록** — `console.ncloud.com`. (무료 한도 내라 실 과금 거의 없음. 콘솔에서 사용 한도 제한 가능.)
2. **Services → Maps → 이용 신청** (모바일 **Dynamic Map**).
3. **Application 등록**: 이름 `syak`, **Android 패키지명** `com.themuselab.syak`, **iOS Bundle ID** `com.themuselab.syak`.
4. 발급된 **Client ID** → 프론트 `.env`(`EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`, git 제외) + EAS env(A-4).
5. **재빌드 필요** — 네이티브 모듈(`@mj-studio/react-native-naver-map`) 추가라 EAS 빌드 재실행. (키 없으면 코드가 placeholder로 폴백 → 앱은 안 깨지지만 지도는 회색.)
- `app.config.ts`에 지도 plugin(`client_id` 조건부) + `expo-build-properties` `extraMavenRepos`에 `https://repository.map.naver.com/archive/maven` 추가돼 있음(카카오 repo 옆).

---

## D. 백엔드 로컬 (syakBE, 도커)
카카오 로그인 검증/유저 저장에 백엔드+DB 필요. **Docker Desktop 실행** 후 `syakBE`에서:
1. `docker compose up -d --build` (app:3000 / postgres:5432 / redis:6379).
2. **DB host 오버라이드** — `.env`의 `DATABASE_URL`·`SUPABASE_DATABASE_URL`이 `localhost`면 도커에서 못 붙음. `syakBE/docker-compose.override.yml`로 host를 `db`로:
   ```yaml
   services:
     app:
       environment:
         DATABASE_URL: postgresql://syak:syak_dev_password@db:5432/syak_dev
         SUPABASE_DATABASE_URL: postgresql://syak:syak_dev_password@db:5432/syak_dev
         REDIS_URL: redis://redis:6379   # 캐시도 localhost면 컨테이너 자기자신 → has_slot 등 필터가 HTTP 000
   ```
   → `docker compose up -d`. 로그에 `SlotListener connected`면 OK.
3. **누락 마이그레이션 적용** — 도커는 `db/init.sql`만 실행하므로 후속 마이그레이션을 직접:
   `docker compose exec -T db psql -U syak -d syak_dev < db/migration_v2.sql`
4. 확인: `curl http://localhost:3000/api/v1/notifications` → 401 JSON이면 서버 정상. `curl "http://localhost:3000/api/v1/shops?limit=1"` → items 1건이면 샵 API OK.
> 2·3은 **로컬 테스트용 우회**다. 근본 해결(도커 초기화가 마이그레이션·REDIS_URL까지)은 백엔드(syakBE) 몫.

---

## E. 실기기 실행
1. 프론트 `.env` `EXPO_PUBLIC_API_URL`을 **PC LAN IP**로: `http://<PC-IP>:3000/api/v1` (IP는 `ipconfig`/`Get-NetIPAddress`). 안드 에뮬은 `10.0.2.2`.
2. `npx expo start --dev-client` (metro, 8081).
3. 기기 dev client 앱 → **Enter URL manually** `http://<PC-IP>:8081` → Connect → 번들 로드 → 스플래시→로그인.
4. 카카오 버튼 → 로그인 → `/home` → 마이페이지에 닉네임.

### 네트워크 체크리스트
- 기기와 PC **같은 WiFi/공유기**.
- 기기 브라우저로 `http://<PC-IP>:3000/api/v1/notifications` → 401 JSON 떠야 백엔드 접속 OK.
- 안 되면 **Windows 방화벽** 인바운드 허용(관리자 PowerShell):
  `New-NetFirewallRule -DisplayName "syak-dev" -Direction Inbound -LocalPort 3000,8081 -Protocol TCP -Action Allow -Profile Any`
- 앱(네이티브)은 평문 HTTP라 cleartext 차단 가능성 — 안 되면 확인.

---

## 디버깅 팁
- 앱 에러는 **metro 콘솔**에 찍힌다. 원인 불명 시 `LoginScreen` catch에 임시 `console.log(e)` 추가 → fast refresh → 재시도 → 로그 확인(키해시/네트워크/ApiError code 구분). 확인 후 제거.
- 백엔드 에러는 `docker compose logs app`. `SlotListener` ECONNREFUSED 노이즈는 `grep -v`로 거르고 `statusCode 500`/`url` 중심으로.
