# 맥에서 iOS 로컬 빌드 · 제출 런북

윈도우 PC에서 하던 작업을 **맥으로 이어받아** 빌드/제출하기 위한 절차.
EAS 클라우드 빌드 대신 **`--local`** 로 맥에서 직접 빌드한다(= EAS 빌드 할당량 미소모).

---

## 1. 왜 로컬 빌드인가

- EAS **무료 플랜 iOS 빌드 할당량 소진** (2026-10-01 리셋).
- `eas build --local` 은 맥에서 직접 컴파일하므로 **할당량과 무관**하다.
- `eas submit` 은 할당량과 관계없으니 그대로 쓰면 된다.

## 2. 현재 상태 (2026-09-12 기준)

| 항목 | 값 |
|---|---|
| 앱 레포 | `git@github.com:themuselab/Syak_FE.git` (`main`) |
| 버전 | **1.0.1** (`app.json`) — 1.0.0은 App Store 심사 **승인 완료** |
| 빌드번호 | `autoIncrement: true` → EAS 원격 카운터가 자동 증가(직전 29) |
| 서명 | `eas.json` → `credentialsSource: "local"` (로컬 인증서 파일 사용) |

**1.0.1에 들어갈 미출시 변경분**
- 리메이크 로고: 스플래시·로그인 락업 + 검색바 심볼 마크(배경 제거·축소)
- 네이버 로그인: 앱 설치 시 **네이버 앱으로 전환**(app-to-app), 미설치 시 웹뷰 폴백
- 샵 상세: 이벤트/가격 배지 **좌우 슬라이드 캐러셀**
- 홈: 검색바 아래 **"현 지도에서 검색"** 버튼

> 1.0.0이 승인되어 그 버전 트레인이 닫혔다(ITMS 90186/90062). 이후 빌드는 반드시 **1.0.1 이상**이어야 업로드된다.

## 3. 맥 사전 준비

```bash
# Xcode: App Store에서 설치 후
xcode-select --install
sudo xcodebuild -license accept

# Node LTS 설치되어 있다고 가정
npm i -g eas-cli
eas login            # 계정: v1ctoryjun
eas whoami           # 확인
```

## 4. 레포 클론

```bash
git clone git@github.com:themuselab/Syak_FE.git
cd Syak_FE
npm install
```

관련 레포(앱 빌드에는 불필요, 참고용)
- 백엔드 `git@github.com:themuselab/syak_BE.git` (`master`, push 시 ECS 자동배포)
- 소비자 웹 `git@github.com:themuselab/syak.git` (`main`)
- 관리자 `git@github.com:themuselab/syak_admin.git` (`master`, 수동 배포)

## 5. ⚠️ 인증 파일 4개 복사 (가장 중요)

아래 파일들은 **gitignore 되어 있어 클론에 포함되지 않는다.** 윈도우 PC의
`Desktop/창업/syak/app/` 에서 맥의 **레포 루트(`Syak_FE/`)** 로 그대로 복사한다.

| 파일 | 용도 |
|---|---|
| `credentials.json` | 서명 설정(인증서·프로파일 경로/비밀번호) |
| `dist.p12` | 배포 인증서 |
| `muse_profile.mobileprovision` | 프로비저닝 프로파일(푸시 capability 포함) |
| `.env` | `EXPO_PUBLIC_*` 키(지도·카카오·네이버 등) |

> 배포 인증서·키가 들어 있으므로 **메신저/깃에 평문으로 올리지 말 것.** USB 또는 암호 걸린 압축으로 옮긴다.

## 6. 빌드

```bash
eas build --platform ios --profile production --local
```

- 첫 실행은 `pod install` 때문에 **10~25분** 소요.
- 성공하면 프로젝트 루트에 **`.ipa`** 파일이 생성된다.

## 7. 제출

```bash
eas submit --platform ios --profile production --path ./<생성된>.ipa
```

- Apple **앱 전용 암호**를 물으면 입력(계정 보관처에서 확인).
  비대화형으로 하려면 `EXPO_APPLE_APP_SPECIFIC_PASSWORD` 환경변수로 주입.
- 업로드 후 Apple 처리에 5~10분.

## 8. App Store Connect 마무리

1. TestFlight에 새 빌드가 뜨는지 확인
2. **App Store → `+ 버전 추가` → `1.0.1`** 생성
3. 해당 버전에 **새 빌드 선택**(빌드는 자동 연결되지 않는다 — 수동 선택 필수)
4. **이 버전의 새로운 기능**(변경사항) 작성 → 위 §2 목록 참고
5. **심사를 위해 제출**

> App Review Information 메모(로그인 접근 안내)는 이전 버전 값이 유지된다.
> 리뷰어용 안내: 게스트("비회원으로 둘러보기") + "Apple로 계속하기" 사용.

## 9. 트러블슈팅

| 증상 | 원인 / 조치 |
|---|---|
| `Invalid Pre-Release Train` / `90062` | 버전이 이미 승인된 값과 동일 → `app.json`의 `version` 상향 |
| 서명 실패 / 프로파일 못 찾음 | §5 인증 파일 4개가 레포 루트에 있는지 확인 |
| 지도·소셜 로그인이 빈 화면 | `.env` 누락 → `EXPO_PUBLIC_*` 확인 |
| 업로드 인증 실패 | 앱 전용 암호 만료 → account.apple.com에서 재발급 |
| 빌드 할당량 오류 | `--local` 플래그 누락(클라우드 빌드로 나감) |
