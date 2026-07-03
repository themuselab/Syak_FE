// 날짜 유틸 (로컬 타임존 기준 — 백엔드 슬롯 date 'YYYY-MM-DD'와 맞춤).

// Date → 'YYYY-MM-DD'.
export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// 오늘 기준 offset일 뒤의 'YYYY-MM-DD'.
export function dateKeyFromToday(offset: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(now.getDate() + offset);
  return toDateKey(d);
}

// ISO 시각 → '방금 전'/'N분전'/'N시간전'/'N일전'.
// 알림 목록이 오늘 생성분만이라 분/시간이 주 사용, 일 단위는 방어.
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간전`;
  return `${Math.floor(diffHour / 24)}일전`;
}
