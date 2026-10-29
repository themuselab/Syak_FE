import type { BusinessHourDay } from '@/shared/domain/shops/shops.types';
import { toDateKey } from '@/shared/lib/date';

// 예약 가능 시간(빈자리)·영업시간을 "HH:MM" 시간 목록으로 다루는 공용 유틸.
// 홈 카드("오늘 15:00 15:30 외 +3"), 샵 상세 "예약 가능 시간", 빈자리 알림 시트가 함께 쓴다.

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_PREFIX = ['오늘', '내일', '모레'] as const;

// 영업시간 데이터가 없는 샵의 알림 시간 범위(사장님 결정 2026-10-29).
const FALLBACK_OPEN = '09:00';
const FALLBACK_CLOSE = '21:00';

const pad2 = (n: number) => String(n).padStart(2, '0');

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

const fromMin = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;

// "9:00" / "09:00:00" → "09:00"
export function normalizeHM(t: string): string {
  const [h, m = '00'] = t.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0').slice(0, 2)}`;
}

export function nowHM(now: Date = new Date()): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

// 요일 영업시간 항목. "매일" 한 줄로만 온 샵도 있다.
export function entryForDay(hours: BusinessHourDay[], day: string): BusinessHourDay | undefined {
  return hours.find((h) => h.day === day) ?? hours.find((h) => h.day === '매일');
}

// 오늘·내일·모레 3일. 빈자리 API(GET /slots/shop/:id)가 주는 범위와 같다.
export type DayOption = {
  key: string; // 'YYYY-MM-DD'
  prefix: (typeof DAY_PREFIX)[number]; // "오늘"
  weekday: string; // "화"
  label: string; // "오늘 (화)"
  md: string; // "10.01"
  date: Date;
};

export function threeDays(now: Date = new Date()): DayOption[] {
  return DAY_PREFIX.map((prefix, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const weekday = WEEKDAYS[d.getDay()];
    return {
      key: toDateKey(d),
      prefix,
      weekday,
      label: `${prefix} (${weekday})`,
      md: `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`,
      date: d,
    };
  });
}

// 30분 칸 번호. 10:20처럼 칸 중간에 있는 빈자리는 10:00 칸으로 본다(기존 시간 막대와 같은 규칙).
export const halfSlotOf = (hm: string) => Math.floor(toMin(hm) / 30);

// 그날 영업시간을 30분 단위 시각으로 편다. 마감 시각 자체는 시작 시각이 아니므로 뺀다(10:00-21:00 → 10:00…20:30).
// 브레이크타임 안의 시각도 뺀다. 자정을 넘기는 영업은 23:30까지만(빈자리 날짜가 하루 단위라서).
// 쉬는 날이면 'closed'. 영업시간 데이터가 아예 없으면 09:00–21:00.
export function businessHalfHours(
  hours: BusinessHourDay[] | null | undefined,
  date: Date,
): string[] | 'closed' {
  let start = FALLBACK_OPEN;
  let end = FALLBACK_CLOSE;
  let breaks: { start: string; end: string }[] = [];
  if (hours?.length) {
    const e = entryForDay(hours, WEEKDAYS[date.getDay()]);
    if (e) {
      if (!e.start || !e.end) return 'closed';
      start = e.start;
      end = e.end;
      breaks = e.breaks ?? [];
    }
  }
  const from = Math.ceil(toMin(start) / 30) * 30;
  let to = toMin(end);
  if (to <= toMin(start)) to = 24 * 60; // 자정 넘김
  const out: string[] = [];
  for (let m = from; m < to; m += 30) {
    const inBreak = breaks.some((b) => b.start && b.end && m >= toMin(b.start) && m < toMin(b.end));
    if (!inBreak) out.push(fromMin(m));
  }
  return out;
}

// 그날의 빈자리 시각(정렬·중복 제거). 오늘이면 지금 이전 시각은 뺀다.
export function openTimesOn(
  slots: { date: string; startTime: string }[],
  dateKey: string,
  now: Date = new Date(),
): string[] {
  const isToday = dateKey === toDateKey(now);
  const cut = nowHM(now);
  const set = new Set(
    slots
      .filter((s) => s.date === dateKey)
      .map((s) => normalizeHM(s.startTime))
      .filter((t) => !isToday || t >= cut),
  );
  return [...set].sort();
}
