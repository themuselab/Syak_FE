// 알림 목 데이터 (프론트 UI 전용).
// 추후 GET /api/v1/notifications 응답으로 대체된다. (../syakBE/docs/05-notification.md)
// 현재 문구는 designs/알림/알림.png 캡처를 그대로 옮긴 임시값.

export type NotificationItemData = {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  thumbnailUrl?: string;
};

export const MOCK_NOTIFICATIONS: NotificationItemData[] = [
  {
    id: 'n1',
    title: '모아래쉬 22:30 빈자리 알림!',
    body: '빠르게 예약하지 않으면 빈자리가 금방 사라져요!',
    timeAgo: '1분전',
  },
  {
    id: 'n2',
    title: '모아래쉬 22:30 빈자리 알림!',
    body: '빠르게 예약하지 않으면 빈자리가 금방 사라져요!',
    timeAgo: '3분전',
  },
  {
    id: 'n3',
    title: '모아래쉬 22:30 빈자리 알림!',
    body: '빠르게 예약하지 않으면 빈자리가 금방 사라져요!',
    timeAgo: '1시간전',
  },
];
