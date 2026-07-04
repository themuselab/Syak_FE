// 알림 도메인 타입 (../syakBE/docs/05-notification.md 기준).

export type NotificationType = 'favorite' | 'near';

// GET /notifications 아이템. 서버는 오늘(created_at) 생성분만 반환한다.
export type NotificationItem = {
  id: string;
  userId: string;
  shopId: string;
  shopName: string;
  type: NotificationType;
  slotTime: string; // 'HH:mm'
  slotDate: string; // 'YYYY-MM-DD'
  readAt: string | null; // null = 미읽음 (PATCH /notifications/:id/read로 읽음 처리 — 2026-07-04 백엔드 추가)
  createdAt: string;
};

export type NotificationListResponse = { notifications: NotificationItem[] };

// GET/PATCH /notifications/settings 응답.
// BE 문서엔 미초기화 시 404(NOTIFICATION_SETTINGS_NOT_FOUND)라고 돼 있으나,
// 실제 코드는 없으면 기본값을 자동 생성해 200을 반환한다(404 처리 불필요).
export type NotificationSettings = {
  userId: string;
  nearEnabled: boolean;
  nearLat: number | null;
  nearLng: number | null;
  radiusKm: number; // 1~10 (서버 검증)
  favoriteEnabled: boolean;
  shopNewsEnabled: boolean;
  fcmToken: string | null;
  updatedAt: string;
};

// PATCH는 부분 업데이트 — 보낸 필드만 갱신된다.
export type NotificationSettingsPatch = Partial<
  Pick<
    NotificationSettings,
    'nearEnabled' | 'nearLat' | 'nearLng' | 'radiusKm' | 'favoriteEnabled' | 'shopNewsEnabled' | 'fcmToken'
  >
>;
