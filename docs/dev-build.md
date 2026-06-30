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
   ```
   → `docker compose up -d`. 로그에 `SlotListener connected`면 OK.
3. **누락 마이그레이션 적용** — 도커는 `db/init.sql`만 실행하므로 후속 마이그레이션을 직접:
   `docker compose exec -T db psql -U syak -d syak_dev < db/migration_v2.sql`
4. 확인: `curl http://localhost:3000/api/v1/notifications` → 401 JSON이면 서버 정상.
> 2·3은 **로컬 테스트용 우회**다. 근본 해결(도커 초기화가 마이그레이션까지 실행)은 백엔드(syakBE) 몫.

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
