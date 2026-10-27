import { Image } from 'expo-image';

const INFO = require('../../../assets/icons/info-empty.png');

// 빈 상태의 회색 (i) 아이콘(디자이너 제공 에셋 2026-10-27 — 검색·조건 결과 없음, 관심 동네 검색 결과 없음 공용).
export function InfoBadge({ size = 48 }: { size?: number }) {
  return <Image source={INFO} style={{ width: size, height: size }} contentFit="contain" />;
}
