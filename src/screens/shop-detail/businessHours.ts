import type { BusinessHourDay } from '@/shared/domain/shops/shops.types';
import { entryForDay as entryFor, toMin, WEEKDAYS as WEEK } from '@/shared/lib/slotTimes';

// 영업시간(네이버 newBusinessHours를 스크래퍼가 정규화한 값) → 상세 "영업 중 · 21:00에 영업 종료 ∨" 줄.
// 시안(2026-10-15 "샵 상세"): 상태(초록 영업 중) + 오늘 안내, 펼치면 월~일 시간, 쉬는 날은 빨간 "휴무".

const ORDER = ['월', '화', '수', '목', '금', '토', '일'];

export type HoursTone = 'open' | 'closed' | 'muted';
export type HoursView = {
  status: string; // "영업 중" / "영업 전" / "브레이크타임" / "영업 종료" / "휴무"
  tone: HoursTone;
  note: string | null; // "21:00에 영업 종료"
  days: { day: string; text: string; closed: boolean; today: boolean }[];
};

export function toHoursView(hours: BusinessHourDay[] | null | undefined, now: Date): HoursView | null {
  if (!hours?.length) return null;
  const todayDay = WEEK[now.getDay()];

  const days = ORDER.map((d) => {
    const e = entryFor(hours, d);
    const open = !!(e?.start && e?.end);
    return {
      day: d,
      text: open ? `${e!.start}-${e!.end}` : '휴무',
      closed: !open,
      today: d === todayDay,
    };
  });

  const today = entryFor(hours, todayDay);
  if (!today) return { status: '영업시간', tone: 'muted', note: null, days };
  if (!today.start || !today.end) return { status: '휴무', tone: 'closed', note: '오늘 휴무', days };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = toMin(today.start);
  let end = toMin(today.end);
  if (end <= start) end += 24 * 60; // 자정 넘김(예: 18:00-02:00)

  if (nowMin < start) return { status: '영업 전', tone: 'muted', note: `${today.start}에 영업 시작`, days };
  if (nowMin >= end) return { status: '영업 종료', tone: 'muted', note: null, days };
  const inBreak = today.breaks.find((b) => b.start && b.end && nowMin >= toMin(b.start) && nowMin < toMin(b.end));
  if (inBreak) return { status: '브레이크타임', tone: 'muted', note: `${inBreak.end}에 영업 재개`, days };
  return { status: '영업 중', tone: 'open', note: `${today.end}에 영업 종료`, days };
}
