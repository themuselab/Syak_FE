import { apiFetch } from '@/shared/api/client';
import type {
  AppNewsListResponse,
  NotificationListResponse,
  NotificationSettings,
  NotificationSettingsPatch,
  RegisterDeviceInput,
} from './notification.types';

// GET /notifications — 오늘 생성된 알림 목록 (인증 필요).
export function getNotifications() {
  return apiFetch<NotificationListResponse>('/notifications');
}

// GET /notifications/app-news — 전역 앱 소식 (로그인 불필요, 최신순, 기본 30건).
export function getAppNews() {
  return apiFetch<AppNewsListResponse>('/notifications/app-news');
}

// POST /notifications/devices — 익명 디바이스 등록/갱신 (로그인 불필요, 204).
// 앱 실행·FCM 토큰 갱신·앱 소식 토글 변경 시 호출(업서트).
export function registerDevice(input: RegisterDeviceInput) {
  return apiFetch<void>('/notifications/devices', { method: 'POST', body: input });
}

// PATCH /notifications/:id/read — 읽음 처리 (인증 필요). 항상 204 —
// 서버가 read_at IS NULL 조건으로만 갱신하는 멱등 API라 404/409 분기 없음.
export function markNotificationRead(id: string) {
  return apiFetch<void>(`/notifications/${id}/read`, { method: 'PATCH' });
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
