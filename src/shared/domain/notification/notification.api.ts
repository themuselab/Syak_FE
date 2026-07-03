import { apiFetch } from '@/shared/api/client';
import type {
  NotificationListResponse,
  NotificationSettings,
  NotificationSettingsPatch,
} from './notification.types';

// GET /notifications — 오늘 생성된 알림 목록 (인증 필요).
export function getNotifications() {
  return apiFetch<NotificationListResponse>('/notifications');
}

// GET /notifications/settings — 알림 설정 (없으면 서버가 기본값 자동 생성).
export function getNotificationSettings() {
  return apiFetch<NotificationSettings>('/notifications/settings');
}

// PATCH /notifications/settings — 부분 업데이트, 변경된 전체 설정 반환.
export function updateNotificationSettings(patch: NotificationSettingsPatch) {
  return apiFetch<NotificationSettings>('/notifications/settings', {
    method: 'PATCH',
    body: patch,
  });
}
