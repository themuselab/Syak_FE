---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

## 7. 코드 컨벤션

- 컴포넌트는 PascalCase, 훅은 `useXxx`, 그 외 폴더는 kebab-case로 일관되게 쓴다.
- import alias `@/`(= `src/`)를 쓴다. 깊은 상대경로(`../../../`)를 지양한다.
- TypeScript strict. `any`를 지양한다. 타입은 도메인 내부 `types.ts` 또는 `src/shared/types`에 둔다.
