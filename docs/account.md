# 계정 관리 (account)

> 상태: **계정 관리 화면·회원 탈퇴 구현 완료(2026-07-10, 피드백 반영)** / **닉네임 저장은 백엔드 `PATCH /users/me` 배포 대기**(FE는 UI+호출 코드까지 완성 — 배포 즉시 동작, 사용자 확정).
> 디자인: `designs/피드백반영 디자인/마이페이지.png`·`계정 관리.png`·`계정 관리-2.png`(탈퇴 모달)·`계정 관리-1.png`(닉네임), `design.pen` 프레임 `ZEDJC`(계정 관리)·`o8fLU1`(탈퇴 모달)·`k0yZdi`(닉네임).

## 1. 범위 / 화면 흐름
- 마이페이지 이름 행(space-between) 우측 **"계정 관리" 버튼**(회원만 노출 — 사용자 확정) → `/account`.
- **계정 관리**: 닉네임 행(값 없으면 "설정하기") 탭 → `/nickname` / 연결된 계정 행(표시 전용, `linkedProviders` → "카카오 계정" 등, 복수 콤마 join, 빈 배열 "-") / 하단 **계정 탈퇴** 버튼 → 확인 모달.
- **탈퇴 모달**: "계속 이용하기"(우선 버튼)·X = 닫기 / "계정 탈퇴" 텍스트 = `DELETE /users/me` → 204 시 세션·캐시 전부 초기화 후 **로그인 화면 replace**(BE 체크리스트 + 사용자 확정). 실패 시 Alert 후 모달 유지.
- **닉네임 설정**: 입력(기본값 = 현재 닉네임) + 저장하기 → `PATCH /users/me {nickname}` → 성공 시 캐시 교체 + back / 실패 시 입력창 아래 에러 문구. 빈 값은 버튼 비활성.
- 비회원: 마이에서 버튼 자체가 숨겨지지만, 딥링크 직접 진입 대비 두 화면 모두 `LoginPromptModal` 게이팅(알림 화면과 동일 정책).

## 2. 라우팅 / 파일 구조
```
app/account.tsx · app/nickname.tsx        # 얇은 라우트 래퍼
src/screens/account/
  AccountScreen.tsx                       # 행 2개 + 탈퇴 버튼/모달 배선
  NicknameScreen.tsx                      # React Hook Form 폼 (프로젝트 첫 RHF 사용처)
  components/WithdrawConfirmModal.tsx     # 탈퇴 확인 모달 (o8fLU1)
src/shared/domain/user/
  user.api.ts                             # updateMe(PATCH — BE 미배포)·deleteMe(DELETE) 추가
  user.queries.ts                         # useUpdateMe(캐시 교체)·useWithdraw(세션 정리) 추가
```

## 3. 데이터 흐름
- `useMe(isLoggedIn)`(기존) — 닉네임·`linkedProviders`. 마이페이지와 동일하게 서버 파생 우선 + store 폴백.
- `useUpdateMe` — 성공 시 `['user','me']`를 응답으로 `setQueryData`(마이·계정관리 즉시 반영).
- `useWithdraw` — `unregisterPushToken()`(best-effort, 로그아웃과 동일) → `deleteMe()`. **성공 시에만** `setUser(null)` + `['favorites']/['notifications']/['user']` 캐시 제거(실패 시 세션 유지 — 재시도 가능). 서버는 204 + 쿠키 만료, 즐겨찾기·알림·토큰은 DB CASCADE 삭제.

## 4. ⚠️ 백엔드 전달사항
| # | 항목 | 내용 |
|---|---|---|
| 1 | **`PATCH /users/me` 신설 요청** | FE가 이미 이 계약으로 구현·배포 대기: 요청 body `{ "nickname": string }` → 응답 `200 UserProfile`(GET /users/me와 동일 형태). 인증 쿠키. 배포 전까지 저장 시 404 → FE가 실패 문구 표시 |
| 2 | 닉네임 제약 확정 | FE 임시 검증 = trim 1~20자(`maxLength` 20). 서버측 길이·문자 제약 확정되면 맞춰 갱신 |

## 5. 주요 디자인 값
- 계정관리 행: 라벨 15 semibold `#555` / 값 15 semibold `#adb5bd`, padding 세로 12. 계정 탈퇴 버튼 = 로그아웃과 동일(r8, 흰 bg, `colors.error[500]` 테두리·텍스트).
- 탈퇴 모달: 딤 `#00000099`, 카드 r20 padding[28,28,20,28] gap40, 제목 20 Medium, 설명 16 `#495057`, "계속 이용하기" 48 r8 `bg-primary-500`, "계정 탈퇴" 텍스트 16 semibold `#868e96`.
- 닉네임: 부제 16 medium `#868e96`, 입력창 r8 stroke `#dee2e6` padding[10,12,10,16] placeholder `#c3c3c3`, 저장 버튼 48 r8 `bg-primary-500`.
- **마이 "계정 관리" pill: pen 미반영(PNG만)** — 칩 패턴 준용(r999, stroke `#e6e6e6`, 13 medium `#555`, padding[8,12]). **디자이너 확인 항목.**

## 6. 임시 동작
- 닉네임 저장: BE `PATCH /users/me` 미배포 → 저장 시 404 → "닉네임 저장에 실패했어요" 문구(§4-1 배포 시 자동 해소, FE 무수정).
- 닉네임 검증 1~20자는 임시(§4-2).
- 탈퇴 실패 Alert는 토스트 인프라 부재로 시스템 Alert 사용(마이페이지 위치 권한 안내와 동일 전례).

## 7. 검증
- `npm run typecheck` / `npm run lint` 통과.
- 웹 비회원(운영): 마이에서 pill 미노출, `/account` 직접 진입 시 LoginPromptModal.
- 웹 로그인 세션(로컬 도커 BE + 토큰 주입): pill → 계정관리(닉네임/연결된 계정 값) → 닉네임 화면 → 저장 → PATCH 요청 발생+404 에러 문구(로컬 BE에도 미구현 — 계약상 정상) / 일회용 SQL 유저로 탈퇴 E2E: 모달 → 계정 탈퇴 → DELETE 204 → 로그인 화면 + DB CASCADE 삭제 확인.
- 실기기: 마이 → 계정 관리 → 모달 열기까지(⚠️ 실계정 탈퇴 주의). 닉네임 저장 E2E는 BE 배포 후.
