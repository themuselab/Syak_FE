import type { ShopListItem, ShopPinRow } from '@/shared/domain/shops/shops.types';
import { distanceMeters, formatDistance } from '@/shared/lib/geo';
import { normalizeHM, nowHM } from '@/shared/lib/slotTimes';

// 지도 마커 종류(=핀 PNG). assets/icons/pin-{kind}.png와 직결.
//  default(분홍 상점) = 일반 샵 / discount(노랑 %) = 이벤트 / reservable(파랑 알람시계) = 예약 가능
export type MarkerKind = 'default' | 'discount' | 'reservable';

// 홈 상단 토글 필터 상태(상호 배타). 지도는 "모드 하나 = 핀 색 하나"로 읽힌다.
export type MarkerToggles = { sameDay: boolean; discount: boolean };

// 핀 종류 = 지금 켜진 지도 모드. 토글을 켜면 목록 자체가 그 조건으로 걸러진 결과라
// 핀도 한 색으로 통일된다. 아무것도 안 켜면 전체 샵을 기본(분홍) 핀으로 본다.
export function markerKindOf(toggles?: MarkerToggles): MarkerKind {
  if (toggles?.discount) return 'discount';
  if (toggles?.sameDay) return 'reservable';
  return 'default';
}

// 화면(카드·마커)이 쓰는 뷰모델. 백엔드 ShopListItem을 어댑터로 변환한다.
export type ShopCardView = {
  id: string;
  name: string;
  dealLabel: string | null; // 이벤트 설명("첫방문 특가") — 메타 줄 맨 앞 핑크
  priceTier: string | null; // "2만원대" ("미정"은 숨김)
  locationLabel: string; // "320m 전농동" / 위치 미동의면 "전농동"
  todayTimes: string[]; // 오늘 남은 빈자리 시각(정렬) — 비면 카드에 "당일 예약이 마감되었어요"
  previewReview: string | null;
  markerKind: MarkerKind;
  favorite: boolean;
  lat: number | null;
  lng: number | null;
  photos: string[];
};

// 동네 표기. 도로명 주소에는 동이 거의 없어서(표본 188건 중 확실한 건 5건) 다음 순서로 고른다:
//  1) 주소 끝 괄호 안 법정동 — "…로 123 (전농동)"
//  2) 읍·면 토큰 — "포천시 소흘읍 …"
//  3) 구·시 (district의 마지막 토큰) — "서울 구로구" → "구로구"
// "상가동"처럼 건물 이름이 동으로 끝나는 경우가 있어 일반 "…동" 토큰은 쓰지 않는다.
// 동까지 정확히 보이려면 좌표 역지오코딩으로 동을 저장해야 한다(백엔드 데이터 작업).
export function areaLabel(item: { roadAddress: string | null; district: string | null }): string {
  const addr = item.roadAddress ?? '';
  const paren = addr.match(/\((\S+?[동가])(?:[,)]|\s)/);
  if (paren) return paren[1];
  const eupmyeon = addr.match(/(?:^|\s)(\S+?[읍면])(?:\s|$)/);
  if (eupmyeon) return eupmyeon[1];
  const parts = (item.district ?? '').trim().split(/\s+/);
  return parts[parts.length - 1] ?? '';
}

// 오늘 남은 빈자리 시각 목록(정렬·중복 제거). slotSummary는 "오늘" 디자이너별 가능 시각 목록이다.
// 지금 시각 이전 슬롯은 이미 지났으므로 뺀다. 형식은 "HH:MM"으로 맞춰 문자열 비교한다.
export function todayOpenTimes(
  item: { todayOpen: boolean; slotSummary: { times: string[] }[] },
  now: Date = new Date(),
): string[] {
  if (!item.todayOpen) return [];
  const cut = nowHM(now);
  const set = new Set<string>();
  for (const d of item.slotSummary) {
    for (const t of d.times) {
      const hm = normalizeHM(t);
      if (hm >= cut) set.add(hm);
    }
  }
  return [...set].sort();
}

// 위치 동의 여부에 따라 동네 표기를 다르게 한다(디자이너 코멘트):
//  동의 O → "320m 전농동"(내 위치 기준 거리 + 동) / 동의 X → "전농동"
export function locationLabelOf(
  item: { lat: number | null; lng: number | null; roadAddress: string | null; district: string | null },
  myLocation?: { lat: number; lng: number } | null,
): string {
  const area = areaLabel(item);
  if (!myLocation || item.lat == null || item.lng == null) return area;
  const dist = formatDistance(distanceMeters(myLocation, { lat: item.lat, lng: item.lng }));
  return area ? `${dist} ${area}` : dist;
}

export function toShopCardView(
  item: ShopListItem,
  favoriteIds: Set<string>,
  toggles?: MarkerToggles,
  myLocation?: { lat: number; lng: number } | null,
): ShopCardView {
  return {
    id: item.id,
    name: item.name,
    dealLabel: item.eventDesc,
    priceTier: item.priceTier && item.priceTier !== '미정' ? item.priceTier : null,
    locationLabel: locationLabelOf(item, myLocation),
    todayTimes: todayOpenTimes(item),
    previewReview: item.previewReview,
    markerKind: markerKindOf(toggles),
    favorite: favoriteIds.has(item.id),
    lat: item.lat,
    lng: item.lng,
    photos: item.photos,
  };
}

// 지도 마커 뷰모델(핀 전용, 경량). /web/shops/pins 행 → 좌표 + 핀 종류.
export type MapPinView = { id: string; lat: number; lng: number; markerKind: MarkerKind };

// 핀 종류 규칙은 카드와 동일(markerKindOf).
export function toPinView(row: ShopPinRow, toggles?: MarkerToggles): MapPinView | null {
  if (row.lat == null || row.lng == null) return null;
  return { id: row.id, lat: row.lat, lng: row.lng, markerKind: markerKindOf(toggles) };
}
