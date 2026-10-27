# 관심 동네 (2026-10-27)

사용자가 동네를 **직접 골라** 홈 시작 위치와 빈자리·할인 알림 기준으로 쓴다. 디자인: 디자이너 시안 2026-10-27
(안내 시트 → 관심 동네 설정 시트 → 완료 토스트, 마이 "관심동네" 행).

## 동작
| 상태 | 홈 시작 위치 | 알림 |
|---|---|---|
| 비회원 | 강남 | — |
| 로그인 · 미설정 | 강남 + 안내 시트(앱 실행 중 1회, "나중에" 7일 숨김) | — |
| 로그인 · 설정 | 관심 동네 중심 | 그 동네 중심·반경(동네 크기 1~5km)으로 near 알림 |

- 홈은 진입 시 **GPS로 지도를 옮기지 않는다**. 위치 권한이 있으면 내 위치 점·거리 표시용 좌표만 기기 안에서 받는다.
  지도는 현재위치 버튼을 눌러야 옮긴다.
- 마이: "위치 권한"·"내 주변 알림(GPS)"·"알림 반경" 행 삭제 → "관심동네" 행으로 대체.

## 왜 (법)
위치기반서비스사업 신고 검토(2026-10-24): 기기 GPS 좌표를 서버로 보내거나 저장하면 신고 대상이 될 수 있다.
사용자가 고른 지역은 측위한 위치가 아니라 개인위치정보가 아니다 → 서버에는 **고른 동네(코드·이름·중심)만** 저장.
(남은 회색지대: 현재위치 버튼으로 지도를 옮긴 뒤의 목록 조회는 그 화면 영역 좌표가 서버로 간다.)

## 데이터
- `src/shared/data/dongs.json` — 전국 행정동 3,559 → 번호 동 합침(역삼1·2동 → 역삼동) 2,880곳.
  `[코드, 시도, 시군구, 동, 위도, 경도, 반경km]`.
- 출처: 통계청 SGIS 행정구역 경계(공공누리 제1유형) · vuski/admdongkor ver20261001(CC BY 4.0).
  출처 표시는 검색 시트 하단(라이선스 조건).
- 검색: 숫자·가·제·끝의 동/읍/면을 빼고 비교("성수동" → 성수1가동·성수2가동).

## 파일
- `src/shared/lib/dongs.ts` 목록·검색 / `src/shared/domain/notification/interestRegion.ts` 훅(설정 = PATCH settings)
- `src/shared/ui/RegionSearchSheet.tsx` 설정 시트 / `src/screens/home/components/RegionPromptSheet.tsx` 안내 시트 /
  `RegionToast.tsx` 완료 토스트
- 백엔드: `notification_settings.region_code/region_name`(기동 시 ADD COLUMN IF NOT EXISTS), PATCH/GET settings

## 검증
헤드리스 크롬에서 로그인 응답을 가짜로 주고 안내 → 검색("논현", 없는 말) → 역삼동 선택 → PATCH 본문
(`regionCode·regionName·nearEnabled·nearLat/Lng·radiusKm`) → 지도 이동·토스트 → 마이 "역삼동" 확인.
