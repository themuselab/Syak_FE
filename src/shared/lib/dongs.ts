import rows from '@/shared/data/dongs.json';

// 관심 동네 목록(전국 행정동 2,880곳 — 번호 동은 합침: 역삼1동·역삼2동 → 역삼동).
// 원자료: 통계청 SGIS 행정구역 경계(공공누리 제1유형) · vuski/admdongkor ver20261001(CC BY 4.0).
// 출처 표시는 동네 검색 시트 하단에 둔다(RegionSearchSheet). 갱신: scripts 없이 scratch 스크립트로
// geojson → [코드, 시도, 시군구, 동, 위도, 경도, 알림반경km] 배열을 다시 만들어 덮어쓴다.

export type Dong = {
  code: string;
  sido: string; // "서울"
  sgg: string; // "강남구" / "고양시 덕양구"
  name: string; // "역삼동"
  lat: number;
  lng: number;
  radiusKm: number; // 이 동네 빈자리 알림 반경(동네 크기 기준 1~5km)
};

type Row = [string, string, string, string, number, number, number];

// 원자료는 "고양시덕양구"처럼 붙어 있다 → "고양시 덕양구"
const spaced = (sgg: string) => sgg.replace(/^(.+?시)(.+구)$/, '$1 $2');

export const DONGS: Dong[] = (rows as unknown as Row[]).map(
  ([code, sido, sgg, name, lat, lng, radiusKm]) => ({
    code,
    sido,
    sgg: spaced(sgg),
    name,
    lat,
    lng,
    radiusKm,
  }),
);

const byCode = new Map(DONGS.map((d) => [d.code, d]));
export const dongByCode = (code: string | null | undefined) => (code ? (byCode.get(code) ?? null) : null);

// 검색용 정규화: 공백·숫자·"제"·"가"·가운뎃점·끝의 동/읍/면을 뺀다.
// "역삼동" → "역삼", "성수동" → "성수"(성수1가동·성수2가동이 모두 걸린다), "신림" → "신림".
const norm = (s: string) =>
  s
    .replace(/\s+/g, '')
    .replace(/[0-9·.,]/g, '')
    .replace(/제(?=\D)/g, '')
    .replace(/가(?=동$)/, '')
    .replace(/[동읍면]$/, '');

const keys = DONGS.map((d) => norm(d.name));

/** 동 이름으로 검색. 앞부분 일치를 먼저, 그다음 중간 일치. 최대 50개. */
export function searchDongs(query: string, limit = 50): Dong[] {
  const q = norm(query.trim());
  if (!q) return [];
  const head: Dong[] = [];
  const mid: Dong[] = [];
  for (let i = 0; i < DONGS.length; i++) {
    const k = keys[i];
    if (k.startsWith(q)) head.push(DONGS[i]);
    else if (k.includes(q)) mid.push(DONGS[i]);
  }
  return [...head, ...mid].slice(0, limit);
}
