// className 밖에서 색이 필요한 곳(아이콘 색, 네비게이션 테마 등)을 위한 TS 접근용.
// 단일 출처는 tokens.js. 값 변경은 거기서만.
import tokens from '@/shared/theme/tokens';

export const colors = tokens.colors;

// 그림자 프리셋 (iOS shadow* + Android elevation). 화면마다 복붙하지 말고 이걸 펼쳐 쓴다:
//   style={{ ...shadow.sm, borderColor: ... }}
export const shadow = tokens.shadow;
