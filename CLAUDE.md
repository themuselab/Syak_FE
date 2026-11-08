# Syak 소비자 앱

독립 레포 `themuselab/Syak_FE`. 현재 폴더명은 `app`이며 예전 `syakFE`와 같은 레포다. 전체 제품과 작업 범위는 `../CLAUDE.md`를 참고한다.

- 스택: Expo 54 / React Native / TypeScript / Expo Router / NativeWind / TanStack Query / Zustand / React Hook Form. 기존 fetch 래퍼를 사용한다.
- 개발: `npm start`, `npm run android`, `npm run ios`, `npm run web`.
- 검증: `npm run typecheck`, `npm run lint`. 네이티브 변경은 iOS·Android 양쪽에서 확인한다.
- API 계약: `../backend/docs/`, `../backend/API_DOCS.md`. 백엔드 수정 여부는 현재 사용자의 요청 범위로 판단한다.
- `app/`은 라우팅, `src/screens/`는 화면, `src/shared/domain/`은 API·도메인 훅과 타입이다.
- 세부 지침은 `.claude/rules/`의 architecture, api-state, design, code-style, platform으로 분리했다. UI 작업 시 관련 `designs/` 자료를 확인한다.
- 기능 명세·문제 해결·결정 기록은 기존 `docs/` 체계를 유지하고 인덱스를 함께 갱신한다.
- 변경 전 git status를 확인한다. 기존 변경과 브랜치를 보존하고 기본 브랜치는 origin에서 확인한다. 세션 시작만으로 checkout·pull·push하지 않는다.
- 서명 키와 credentials.json을 커밋하거나 출력하지 않는다.

공통 MCP·훅·명령·에이전트는 상위 `syak/`에서 Claude Code를 실행해 사용한다.
