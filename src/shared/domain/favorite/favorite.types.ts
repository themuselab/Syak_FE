// 즐겨찾기 도메인 타입 (../syakBE/docs/04-favorite.md 기준).

export type Favorite = {
  id: string;
  userId: string;
  shopId: string;
  shopName: string; // 추가 시점 스냅샷 — 샵 이름이 바뀌어도 갱신 안 됨
  shopRegion: string | null;
  createdAt: string;
};

export type FavoriteListResponse = { favorites: Favorite[] };
