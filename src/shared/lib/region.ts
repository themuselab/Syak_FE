// 지역(행정구역) 데이터 + 주소 표기 유틸.
// 실데이터(Supabase shops.gu) 고유값 89개 전수 스냅샷 (2026-07-03 추출) — 백엔드에 지역 목록 API가 없어 하드코딩.
// 저장 형식이 지역마다 달라서(서울=구만, 광역시=`시 구`, 경기·지방=시/군만) value는 반드시 원값 그대로 서버에 보낸다.
// (라벨 "부평구"로 보내면 0건 — 실값은 "인천 부평구". docs/troubleshooting.md 참고)

export type RegionItem = {
  label: string; // 칩 표시용 (구/시 부분)
  value: string; // 서버 전송값 (shops.gu 원값)
};

const gu = (label: string): RegionItem => ({ label, value: label });
const prefixed = (sido: string, label: string): RegionItem => ({
  label,
  value: `${sido} ${label}`,
});

// 시도 탭 순서는 디자인(지역필터.png) 순서 + '경상' 탭 추가(실데이터에 진주·창원·포항 존재, 사용자 확정).
export const REGION_GROUPS: { sido: string; items: RegionItem[] }[] = [
  {
    sido: '서울',
    items: [
      '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
      '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
      '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구',
    ].map(gu),
  },
  {
    sido: '경기',
    items: [
      '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시',
      '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시',
      '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시',
      '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시',
    ].map(gu),
  },
  {
    sido: '인천',
    items: ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '중구'].map(
      (l) => prefixed('인천', l),
    ),
  },
  {
    sido: '부산',
    items: [
      '강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구',
      '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구',
    ].map((l) => prefixed('부산', l)),
  },
  { sido: '대구', items: [prefixed('대구', '중구')] },
  { sido: '광주', items: [prefixed('광주', '동구'), prefixed('광주', '서구')] },
  { sido: '전라', items: ['전주시', '여수시'].map(gu) },
  { sido: '경상', items: ['진주시', '창원시', '포항시'].map(gu) },
];

const SEOUL_GUS = new Set(
  REGION_GROUPS.find((g) => g.sido === '서울')!.items.map((i) => i.value),
);

// 카드·상세 주소 표기. 백엔드 region은 항상 "서울" 고정(부정확)이라 쓰지 않고 district 기반으로:
// 서울 구 → "서울 강남구" / 접두 있는 값("인천 부평구") → 그대로 / 그 외(수원시 등) → 그대로.
export function formatDistrict(district: string | null): string {
  if (!district) return '';
  return SEOUL_GUS.has(district) ? `서울 ${district}` : district;
}
