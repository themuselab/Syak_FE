import { apiFetch } from '@/shared/api/client';
import type { Favorite, FavoriteListResponse } from './favorite.types';

// GET /favorites — 내 즐겨찾기 전체 (인증 필요, 페이지네이션 없음, created_at DESC).
export function getFavorites() {
  return apiFetch<FavoriteListResponse>('/favorites');
}

// POST /favorites/:shopId — 추가 (201, Favorite 반환). 중복이면 409 FAVORITE_ALREADY_EXISTS.
export function addFavorite(shopId: string) {
  return apiFetch<Favorite>(`/favorites/${shopId}`, { method: 'POST' });
}

// DELETE /favorites/:shopId — 삭제 (204). 없으면 404 FAVORITE_NOT_FOUND.
export function removeFavorite(shopId: string) {
  return apiFetch<void>(`/favorites/${shopId}`, { method: 'DELETE' });
}
