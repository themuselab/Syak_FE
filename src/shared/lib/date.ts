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
