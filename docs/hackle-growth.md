# Hackle 운영 설정 (2026-11-08)

워크스페이스 Muse Lab(118110)의 현재 표시 플랜은 **그로스 해킹**이다. 실제 콘솔에서 사용 가능한 A/B 테스트·기능 플래그·원격 구성을 연결했다. 요금제 변경이나 CRM 메시지 발송은 하지 않았다. 이벤트 사용량과 프로모션 조건은 Billing에서 확인한다.

## 식별자

- CTA 실험·기능 플래그·원격 구성은 `device Id`를 사용한다. 비회원도 참여하며 로그인해도 같은 기기의 분배는 유지된다.
- 기존 영속 익명 ID를 재사용하고, 로그인 시 내부 UUID를 `userId`로 함께 전달한다. 회원 기능 분석에는 회원 ID를 사용한다.
- 앱 웹뷰·웹·다른 브라우저의 저장소는 별개다. 기기/브라우저를 바꾸거나 저장소를 초기화하면 분배가 달라질 수 있다. 기기 수를 전 서비스의 중복 제거된 사람 수로 해석하지 않는다.

## 실험과 제어

| 항목 | 콘솔 | SDK 키 / 값 |
|---|---|---|
| 네이버 예약 CTA 문구 | [실험](https://dashboard.hackle.io/workspaces/118110/experiments/517927/detail) | 실험 `5`, A=기존 문구 / B=네이버에서 확인하기 |
| 실험 활성화 스위치 | [기능 플래그](https://dashboard.hackle.io/workspaces/118110/feature-flags/517928/detail) | 플래그 `4`, On·True 100% |
| B 그룹 문구 | [원격 구성](https://dashboard.hackle.io/workspaces/118110/remote-configs/102373) | `syak_naver_cta_label` = `네이버에서 확인하기` |

사용자 승인으로 2026-11-08 12:22 KST에 전체 대상 기기를 A/B 50:50으로 시작했다. 네이버 URL이 있는 상세 하단 CTA가 대상이며, 다른 예약 수단과 슬롯 버튼의 문구는 그대로다. 문구 외에 예약 URL·로그인 요구·예약 로직을 바꾸지 않는다.

SDK는 기존 인스턴스를 공유하고 설정을 60초 주기로 갱신한다. 플래그 Off, SDK 실패, 준비/종료 상태, 잘못된 문구(공백 또는 24자 초과)는 기존 문구로 동작한다. 이미 열린 화면의 문구는 재진입 시 갱신된다. 테스트 중 원격 문구를 임의 변경하지 않고 새 실험 버전으로 평가한다.

## KPI

- **성공 지표**: [파트너샵 네이버 이동 사용자 전환율](https://dashboard.hackle.io/workspaces/118110/metrics/event/191944/detail).
- 보조 지표: [전체](https://dashboard.hackle.io/workspaces/118110/metrics/event/191936/detail), [일반샵](https://dashboard.hackle.io/workspaces/118110/metrics/event/191945/detail).
- 분자: `reserve_click`, `reservation_method=naver`, 파트너/일반은 추가로 `shop_type=partner/general`. 고유 기기 기준.
- 분모: 해당 그룹의 전체 실험 노출 기기. 실험 후 행동으로 분모를 제한하지 않는다.
- `booking_cta_view`는 실제 표시된 CTA의 `shop_id`, `shop_type`, `experiment_key=5`, `variation`을 기록한다. 노출 이벤트를 클릭으로 취급하지 않는다.
- 측정 범위는 네이버 **이동 버튼 클릭**까지다. 네이버 도착·예약 완료·오프라인 방문은 측정하지 않는다.
- 파트너샵 등록 자체는 별도 사업 KPI다. 이 실험은 파트너샵에 보내는 소비자 유입을 늘리는지 검증한다.

실험 시작 직후의 소수 표본으로 승자를 선정하지 않는다. 최소 주간 주기와 충분한 전환 수, 신뢰구간을 함께 보고 판단한다. QA 노출은 실사용 성과로 해석하지 않는다. 검증 전용 SDK 호출은 `syak-qa-device-20261108` / `internal_qa=true`로 구별한다.

## 배포와 검증

[파트너샵 성장 · 네이버 이동 리포트](https://dashboard.hackle.io/workspaces/118110/reports/64215)에 전체·파트너샵·일반샵 퍼널 3개를 저장했다. 모두 `service_enter → shop_view → reserve_click` 순서, 기기 기준 고유 사용자, 전환 완료 1일, 최근 3일 조회다. 파트너/일반 퍼널은 상세와 이동 단계 양쪽에 같은 `shop_type` 필터를 걸고, 마지막 단계에 `reservation_method=naver`를 적용한다. 샵 유형별 퍼널이며 같은 `shop_id`의 연속 행동만으로 제한한 퍼널은 아니다.

앱은 기존 웹뷰 구조이므로 앱 웹 배포로 반영된다. 네이티브 바이너리는 변경하지 않았다.

- 앱 웹: `dpl_D2TTHSv4WhxLyGwppwuUPMrSJ9bt`, `app.themuselab.kr`.
- 소비자 웹: `dpl_HUqe9hy5TbZqbZq5p5KtsvR7gGFK`, `www.themuselab.kr`.
- TypeScript 양쪽 통과, analytics 테스트 앱 6개·웹 8개 통과. Expo export, Vercel 웹·Toss 빌드 통과. 린트 오류 없음(기존 경고 각 1개).
- 운영 SDK에서 `device Id`, 실험 RUNNING, 50:50 버킷, 플래그 On, 원격 문구를 확인했다. 비회원 앱 화면에서 B 문구와 `booking_cta_view`의 `variation=B`, `shop_type=general`을 확인했다. 검증용 `reserve_click`은 만들지 않았다.

전체 이벤트·기본 퍼널 정의는 [analytics-v2.md](analytics-v2.md)를 참고한다.
