import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useLoginGate } from '@/shared/ui/loginGate';

import { SlotAlertSheet } from './SlotAlertSheet';
import { SlotAlertToast } from './SlotAlertToast';

const TOAST_MS = 3000;

/**
 * "빈자리 알림" 진입점(홈 카드 버튼·샵 상세 카드) 공용.
 * 비회원 → 로그인 유도 모달, 회원 → 알림 설정 시트 → 성공 시 완료 토스트([내역보기] → 알림함 신청 현황).
 *
 *   const slotAlert = useSlotAlertSheet({ toastBottom: insets.bottom + 16 });
 *   <Button onPress={() => slotAlert.open(shopId)} />
 *   ...
 *   {slotAlert.element}   // 화면 루트(flex-1 View)의 마지막 자식 — 토스트가 absolute로 뜬다
 */
export function useSlotAlertSheet({ toastBottom }: { toastBottom: number }) {
  const { requireLogin, loginModal } = useLoginGate();
  const [target, setTarget] = useState<{ shopId: string; dayIndex: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const open = useCallback(
    (shopId: string, dayIndex = 0) =>
      requireLogin(() => {
        setTarget({ shopId, dayIndex });
        setVisible(true);
      }),
    [requireLogin],
  );

  const showToast = () => {
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), TOAST_MS);
  };

  const element = (
    <>
      <SlotAlertSheet
        visible={visible}
        shopId={target?.shopId ?? null}
        initialDayIndex={target?.dayIndex ?? 0}
        onClose={() => setVisible(false)}
        onCreated={showToast}
      />
      {toast && (
        <SlotAlertToast
          bottom={toastBottom}
          onPressHistory={() => {
            setToast(false);
            router.push('/notifications?tab=requests');
          }}
        />
      )}
      {loginModal}
    </>
  );

  return { open, element };
}
