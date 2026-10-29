import type { SlotAlert } from '@/shared/domain/notification/slotAlert.types';
import { normalizeHM, WEEKDAYS } from '@/shared/lib/slotTimes';

// 신청 현황: 서버의 flat 행(샵·날짜·시간)을 카드(샵) → 날짜 줄 → 시간 칩으로 묶는다.

export type SlotAlertChip = { id: string; time: string };
export type SlotAlertDateRow = { date: string; label: string; chips: SlotAlertChip[] };
export type SlotAlertShopGroup = {
  key: string; // 진행 중/종료가 같은 샵이어도 카드가 따로라 섹션 접두어를 붙인다
  shopId: string;
  shopName: string;
  shopRegion: string | null;
  shopPhoto: string | null;
  meta: string; // "내일 · 전농동"
  rows: SlotAlertDateRow[];
};

const RELATIVE = ['오늘', '내일', '모레'];

// 'YYYY-MM-DD' → 오늘/내일/모레/어제, 그 밖은 "10.27". 요일은 따로.
function relativeDay(dateKey: string, now: Date): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff >= 0 && diff < RELATIVE.length) return RELATIVE[diff];
  if (diff === -1) return '어제';
  return `${m}.${String(d).padStart(2, '0')}`;
}

function weekdayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

// 카드 묶기. 진행 중은 가까운 날짜·시간 순, 종료는 최근 날짜가 위.
export function groupSlotAlerts(
  alerts: SlotAlert[],
  section: 'active' | 'ended',
  now: Date = new Date(),
): SlotAlertShopGroup[] {
  const rows = alerts
    .filter((a) => (section === 'active' ? a.status === 'active' : a.status === 'ended'))
    .map((a) => ({ ...a, time: normalizeHM(a.time) }))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  if (section === 'ended') rows.reverse();

  const shops = new Map<string, SlotAlertShopGroup>();
  for (const a of rows) {
    let g = shops.get(a.shopId);
    if (!g) {
      g = {
        key: `${section}-${a.shopId}`,
        shopId: a.shopId,
        shopName: a.shopName,
        shopRegion: a.shopRegion,
        shopPhoto: a.shopPhoto,
        meta: '',
        rows: [],
      };
      shops.set(a.shopId, g);
    }
    let row = g.rows.find((r) => r.date === a.date);
    if (!row) {
      row = { date: a.date, label: `${relativeDay(a.date, now)} ${weekdayOf(a.date)}`, chips: [] };
      g.rows.push(row);
    }
    row.chips.push({ id: a.id, time: a.time });
  }

  const groups = [...shops.values()];
  for (const g of groups) {
    // 칩은 날짜 안에서 항상 시간 오름차순
    for (const r of g.rows) r.chips.sort((x, y) => x.time.localeCompare(y.time));
    // 메타 = 맨 위 날짜(진행 중이면 가장 가까운 날) + 동네
    const first = g.rows[0] ? relativeDay(g.rows[0].date, now) : '';
    g.meta = [first, g.shopRegion].filter(Boolean).join(' · ');
  }
  return groups;
}

