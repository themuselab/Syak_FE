# 마이페이지 (프로필 · 알림 설정)

> 상태: **프론트 UI/UX 구현 완료**, 백엔드(유저/알림 설정) 연동 대기.
> 디자인 원본: `designs/마이페이지/마이페이지.png`(회원·OFF), `마이페이지-1.png`(회원·ON+반경), `마이페이지-로그인전.png`(비회원),
> `designs/design.pen` 프레임 `M6Lry`·`y1ARc`(회원), `nnRIy`(비회원).

## 1. 범위
마이페이지(`/my`): 회원/비회원 분기, 즐겨찾기 진입, 알림 설정 토글(위치 권한·내 주변·즐겨찾기·앱 소식) + 내 주변 ON 시 반경 슬라이더, 로그인/로그아웃. UI/UX만 — 설정은 로컬 상태.

## 2. 화면 & 흐름
```
/my (마이페이지)                              [src/screens/my/MyScreen.tsx]
  ├ 헤더: 뒤로가기(←) + "마이"  (공용 BackHeader)
  ├ 부제: 회원=닉네임 / 비회원="로그인하고 편리하게 샥-"
  ├ ⭐ 즐겨찾기 (메뉴, 현재 no-op — 즐겨찾기 화면 확보 후 연결)
  ├ 설정: 위치 권한 / 내 주변 알림 [→ ON 시 알림 반경 슬라이더(1~10km)] / 즐겨찾기 알림 / 앱 소식
  └ 하단: 회원="로그아웃"(아웃라인) / 비회원="로그인"(채움)
       ├ 로그인 → /login
       └ 로그아웃 → setUser(null) + /login   [추후 useSignOut로 교체]
```
- 회원/비회원은 `useAuthStore.user`로 자동 분기. 현재 로그인 스텁이라 user=null → 실행 시 비회원이 기본.
- 비회원 상태에서는 설정 토글 비활성(disabled).

## 3. 라우팅
| 라우트 | 파일 | 화면 |
|---|---|---|
| `/my` | `app/my.tsx` | `MyScreen` |

## 4. 파일 구조
```
src/screens/my/
  MyScreen.tsx                    # 헤더 + 스크롤 본문 + 하단 버튼, 회원/비회원 분기
  components/
    SettingToggleRow.tsx          # (아이콘)+라벨+Toggle 한 행
    RadiusSlider.tsx              # 커스텀 반경 슬라이더(1~10, PanResponder)
src/shared/ui/
    BackHeader.tsx                # 공용 헤더(뒤로가기+타이틀) — 알림/마이 공용
    Toggle.tsx                    # 공용 커스텀 토글(39×18)
assets/icons/
    my-location-permission.png    # 위치 권한 (design.pen mage:location-fill export)
    my-near-alarm.png             # 내 주변 알림 (carbon:location-filled)
    my-app-news.png               # 앱 소식 (mdi:message-badge)
```
> `BackHeader`/`Toggle`은 재사용 primitive라 `src/shared/ui`. 알림 페이지의 기존 NotificationHeader는 `BackHeader`로 대체(삭제).

## 5. 컴포넌트 명세
- **BackHeader** `{ title, onBack? }` — SafeArea + 뒤로가기(`ArrowLeft` 24/`#bfbfbf`/`router.back()`) + 타이틀(20 SemiBold, -0.4).
- **Toggle** `{ value, onValueChange, disabled? }` — 트랙 39×18 rounded-full, 노브 흰색 20×12. ON `#ef6491` / OFF `#ebebeb`, 노브 좌↔우(Animated 150ms).
- **SettingToggleRow** `{ icon?, label, value, onValueChange, disabled? }` — 패딩 [12,0], 좌측 아이콘16+라벨(15 SemiBold `#555`), 우측 Toggle.
- **RadiusSlider** `{ value, onChange }` — 상·하 보더 1px `#f3f3f3`, 패딩 [20,0]. 라벨행("알림 반경" 14 Medium `#555` / "{n}km" 14 SemiBold `#1a1a1a`) + 트랙(8px `#ebebeb`/채움 `#ffdfea`/노브 20 `#ef6491`). 1~10 정수.
- **MyScreen** — 본문 세로 gap 20(부제/리스트), 리스트 gap 16. 하단 버튼: 로그인 `bg-primary-500`(채움, h-12), 로그아웃 아웃라인(border/글자 `error.500`).

## 6. 디자인 토큰 / 정확값
- 폰트 Pretendard. 로그인 버튼 = `primary.500(#d23e6a)` 토큰, 로그아웃 = `error.500(#E03131)` 토큰, 골드 별 `#FFC107`.
- 디자인 전용 hex 하드코딩(토큰 외, 기존 선례 동일): `#ef6491`(토글/슬라이더 핑크), `#ffdfea`·`#ebebeb`(슬라이더), `#555555`(라벨), `#e6e6e6`(아이콘, png에 baked), `#f3f3f3`(보더/구분선), `#1a1a1a`.

## 7. 에셋
| 파일 | 출처 |
|---|---|
| `assets/icons/my-location-permission.png` · `my-near-alarm.png` · `my-app-news.png` | `design.pen` 아이콘 노드 export(64px, fill `#e6e6e6`) |

## 8. 임시 동작 (UI 우선)
- 설정 토글/반경은 로컬 `useState`(영속 X). 위치 권한도 실제 디바이스 권한 요청 없이 UI 토글만.
- 즐겨찾기 메뉴 탭 비활성(no-op).
- 로그아웃은 API 없이 `setUser(null)`.

## 9. 남은 작업 (백엔드 연동)
- `GET /users/me` 닉네임/프로필 표시(닉네임 null → "닉네임 미설정", 프로필 null → 기본 아바타), 소셜 연동 현황(`linkedProviders`).
- `GET/PATCH /api/v1/notifications/settings`로 토글·반경 조회/저장(nearEnabled/favoriteEnabled/shopNewsEnabled/radiusKm 1~10). 참고 `../syakBE/docs/05-notification.md`.
- `useSignOut`(`/auth/logout`) 로그아웃, `DELETE /users/me` 회원탈퇴(재확인 모달).
- 위치 권한: expo-location 실제 권한 연동.
- 즐겨찾기 메뉴 → 즐겨찾기 목록 화면(디자인 확보 후).

## 10. 검증
- `npm run typecheck`, `npm run lint`.
- 웹 실행 → `/my` 진입. 비회원 화면을 `마이페이지-로그인전.png`와 대조. 임시 `setUser(목 유저)`로 회원 화면을 `마이페이지.png`(OFF)·`마이페이지-1.png`(ON+슬라이더)와 대조 후 임시 제거.
- 인터랙션: 토글 ON/OFF, 내 주변 알림 ON 시 슬라이더 노출/드래그(km 갱신), 로그인/로그아웃 이동. 알림 페이지(`/notifications`) 헤더 회귀 확인.
