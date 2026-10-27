import { useAuthStore } from '@/shared/domain/auth/auth.store';
import { type Dong, dongByCode } from '@/shared/lib/dongs';

import { useNotificationSettings, useUpdateNotificationSettings } from './notification.queries';

// 관심 동네 = 사용자가 직접 고른 동네(디자이너 시안 2026-10-27 "관심 동네 설정").
// - 비회원·미설정: 홈은 강남 기준(지금과 같음)
// - 설정하면: 홈 시작 위치 + 그 동네 빈자리·할인 알림 기준점(nearLat/nearLng)
// 기기 GPS가 아니라 사용자가 고른 지역이라 서버에 저장해도 개인위치정보가 아니다
// (위치기반서비스사업 신고 검토 2026-10-24 — GPS 좌표는 서버로 보내지 않는다).
export function useInterestRegion() {
  const isLoggedIn = useAuthStore((s) => s.user !== null);
  const { data: settings, isFetched } = useNotificationSettings(isLoggedIn);
  const update = useUpdateNotificationSettings();

  const region: Dong | null = isLoggedIn ? dongByCode(settings?.regionCode) : null;

  const setRegion = (d: Dong) =>
    update.mutateAsync({
      regionCode: d.code,
      regionName: d.name,
      nearEnabled: true,
      nearLat: d.lat,
      nearLng: d.lng,
      radiusKm: Math.min(10, Math.max(1, Math.ceil(d.radiusKm))),
    });

  return {
    isLoggedIn,
    /** 로그인했고 설정 응답을 받았는지 — 미설정 안내 시트는 이게 true일 때만 판단한다 */
    ready: isLoggedIn && isFetched,
    region,
    setRegion,
    saving: update.isPending,
  };
}
