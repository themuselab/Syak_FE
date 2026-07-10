# 마이페이지 (프로필 · 알림 설정)

> 상태: **알림 설정 + 유저 프로필 백엔드 연동 완료** — 알림 설정(GET/PATCH /notifications/settings)은 2026-07-03, **닉네임은 2026-07-07부터 서버 파생**(`useMe` → GET /users/me, 진입 시 최신 값·조회 중 auth store 스냅샷 폴백).
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
  ├ 설정: 위치 권한(로컬 UI만) / 내 주변 알림 [→ ON 시 알림 반경 슬라이더(1~10km)] / 즐겨찾기 알림 / 앱 소식
  │    └ 서버 연동(GET/PATCH /notifications/settings): 값은 서버 파생, 토글 탭 → PATCH → 응답으로 캐시 교체
  └ 하단: 회원="로그아웃"(useSignOut) / 비회원="로그인"(채움) → /login
```
- 회원/비회원은 `useAuthStore.user`로 자동 분기. 비회원·설정 로딩 중엔 토글 비활성(disabled).
- **내 주변 알림 ON**: `getCurrentCoords()`(위치 권한 요청) → 허용 시 `{ nearEnabled:true, nearLat, nearLng }` PATCH / 거부 시 `Alert` 안내 후 미전송(값이 서버 파생이라 토글은 OFF에 머묾 — 롤백 불필요). OFF는 `{ nearEnabled:false }`만.
- **반경 슬라이더**: 드래그 중엔 로컬 draft 표시만, **손 뗄 때 1회 PATCH**(`RadiusSlider onRelease`) — 드래그 중 요청 폭주 방지.
- "앱 소식" 라벨 ↔ BE `shopNewsEnabled` 필드 매핑.
- ⚠️ 서버 기본값이 `nearEnabled: true` + 좌표 null이라, 회원 최초 진입 시 "내 주변 알림"이 좌표 없이 ON으로 보이는 엣지 있음(토글을 한 번 껐다 켜면 좌표 저장됨 — 자동 보정은 범위 외).

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
- **RadiusSlider** `{ value, onChange, onRelease? }` — 상·하 보더 1px `#f3f3f3`, 패딩 [20,0]. 라벨행("알림 반경" 14 Medium `#555` / "{n}km" 14 SemiBold `#1a1a1a`) + 트랙(8px `#ebebeb`/채움 `#ffdfea`/노브 20 `#ef6491`). 1~10 정수. `onRelease`는 드래그 종료 시 마지막 값 1회 호출(서버 저장용).
- **MyScreen** — 본문 세로 gap 20(부제/리스트), 리스트 gap 16. 하단 버튼: 로그인 `bg-primary-500`(채움, h-12), 로그아웃 아웃라인(border/글자 `error.500`).

## 6. 디자인 토큰 / 정확값
- 폰트 Pretendard. 로그인 버튼 = `primary.500(#d23e6a)` 토큰, 로그아웃 = `error.500(#E03131)` 토큰, 골드 별 `#FFC107`.
- 디자인 전용 hex 하드코딩(토큰 외, 기존 선례 동일): `#ef6491`(토글/슬라이더 핑크), `#ffdfea`·`#ebebeb`(슬라이더), `#555555`(라벨), `#e6e6e6`(아이콘, png에 baked), `#f3f3f3`(보더/구분선), `#1a1a1a`.

## 7. 에셋
| 파일 | 출처 |
|---|---|
| `assets/icons/my-location-permission.png` · `my-near-alarm.png` · `my-app-news.png` | `design.pen` 아이콘 노드 export(64px, fill `#e6e6e6`) |

## 8. 임시 동작 (남은 것만)
- **위치 권한 토글**: BE 대응 필드가 없어 로컬 UI 토글 유지(실권한 상태 연동은 남은 작업). 실제 권한 요청은 "내 주변 알림" ON 시점에 발생.
- 즐겨찾기 메뉴 탭 비활성(no-op).
- ~~설정 토글/반경 로컬 useState, 로그아웃 setUser(null)~~ → **연동 완료(2026-07-03)**: 설정은 GET/PATCH, 로그아웃은 useSignOut.

## 9. 남은 작업 (백엔드 연동)
- ~~`GET /users/me` 닉네임 표시~~ → **2026-07-07 완료**: 닉네임은 `useMe(isLoggedIn)` 서버 파생(`me?.nickname ?? store.nickname ?? '닉네임 미설정'`), 로그아웃 시 `['user']` 캐시 제거(계정 교체 잔상 방지). **프로필 사진·소셜 연동 현황(`linkedProviders`) 표시는 디자인에 없어 미구현** — 디자인 확보 후(사용자 확정).
- ~~FCM 토큰 등록~~ → **2026-07-05 완료**([notification.md](./notification.md) §9 — 마이페이지가 아닌 로그인 전환 시 자동 등록).
- **`DELETE /users/me` 회원탈퇴 — 디자인 대기(사용자 확정 "나중에"). ⚠️ 구글플레이·앱스토어 정책상 계정 삭제 기능은 출시 전 필수** — 디자이너에게 탈퇴 버튼·확인 모달 디자인 요청 필요.
- 위치 권한 토글: 실제 디바이스 권한 상태 연동(권한 훅 + 설정 딥링크).
- 즐겨찾기 메뉴 → 즐겨찾기 목록 화면(디자인 확보 후).

## 10. 검증
- `npm run typecheck`, `npm run lint`.
- 웹 실행 → `/my` 진입. 비회원 화면을 `마이페이지-로그인전.png`와 대조. 임시 `setUser(목 유저)`로 회원 화면을 `마이페이지.png`(OFF)·`마이페이지-1.png`(ON+슬라이더)와 대조 후 임시 제거.
- 인터랙션: 토글 ON/OFF, 내 주변 알림 ON 시 슬라이더 노출/드래그(km 갱신), 로그인/로그아웃 이동. 알림 페이지(`/notifications`) 헤더 회귀 확인.
- **닉네임 서버 파생(2026-07-07, 웹 + 로컬 BE(3001) + 쿠키 주입)**: `/my` 진입 → `GET /users/me` + 닉네임 표시 → DB에서 닉네임 변경 → 재진입 시 새 값 반영(스냅샷이면 불가능한 동작) → 로그아웃 → 비회원 문구·`users/me` 요청 없음·이전 닉네임 잔상 없음 확인.
  - 참고: 로컬 3000 포트를 다른 프로세스가 쓸 때가 있어 syakBE 로컬 전용 override로 **3001 포트** 노출 중(`docker-compose.override.yml`, 미커밋).
