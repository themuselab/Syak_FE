// 네이버 사진을 화면 크기에 맞게 줄여 받는다.
//
// 샵 사진은 네이버 원본(ldb-phinf / naverbooking-phinf / searchad-phinf.pstatic.net) 그대로라
// 한 장이 300KB~1.1MB였다. 홈 목록은 60곳 × 3장 = 180장이라 최대 100MB를 받으며 로딩이 매우
// 느렸고, 앱(웹뷰)에선 이미지 메모리 때문에 크래시가 날 수 있었다.
// 네이버 플레이스가 쓰는 축소 프록시(search.pstatic.net/common)를 거치면 같은 사진이 15~36KB다.
//
// 주의:
//  - type 값은 네이버가 허용한 크기만 된다(f300_400, f200_200 등 — w300 같은 임의 값은 404).
//  - src는 인코딩하지 않고 그대로 붙여야 한다(인코딩하면 404). 파일명의 %XX는 그대로 둬도 된다.
//  - pstatic 사진만 프록시를 탄다. 다른 호스트는 원본 그대로 둔다(프록시가 받지 않을 수 있음).

export type ImageSize =
  | 'card' // 홈 카드 사진 112×150 → 300×400(3:4)
  | 'carousel' // 상세 사진 126×152 → 300×400
  | 'thumb'; // 즐겨찾기 썸네일 64×64 → 200×200

const TYPE: Record<ImageSize, string> = {
  card: 'f300_400',
  carousel: 'f300_400',
  thumb: 'f200_200',
};

const PROXY = 'https://search.pstatic.net/common/?autoRotate=true';

export function sizedImage(url: string, size: ImageSize): string {
  if (!/^https?:\/\/[a-z-]+\.pstatic\.net\//.test(url)) return url;
  // 이미 프록시 주소면 그대로(이중 프록시 방지)
  if (url.startsWith('https://search.pstatic.net/')) return url;
  return `${PROXY}&type=${TYPE[size]}&src=${url}`;
}
