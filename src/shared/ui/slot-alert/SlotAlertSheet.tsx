import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateSlotAlerts, useSlotAlerts } from '@/shared/domain/notification/slotAlert.queries';
import { useShopSlots } from '@/shared/domain/reservation/reservation.queries';
import { useShop } from '@/shared/domain/shops/shops.queries';
import {
  businessHalfHours,
  halfSlotOf,
  normalizeHM,
  nowHM,
  threeDays,
} from '@/shared/lib/slotTimes';
import { colors } from '@/shared/theme/colors';

type Props = {
  visible: boolean;
  shopId: string | null;
  initialDayIndex?: number; // 0 오늘 / 1 내일 / 2 모레 — 상세 "예약 가능 시간" 탭에서 열면 그 날짜
  onClose: () => void;
  onCreated: () => void; // 신청 성공 → 호출부가 완료 토스트
};

type ChipState = 'free' | 'open' | 'requested';

// 빈자리 알림 설정 시트 (디자이너 시안 2026-10-29 "빈자리 알림").
//   빈자리 알림 설정
//   원하는 날짜와 시간에 빈자리가 생기면 알려드려요
//   날짜 선택   [오늘 (화) 10.01][내일 (수) 10.02][모레 (목) 10.03]
//   시간 선택                                  복수 선택 가능
//   (10:00)(10:30)(11:00) …                       ← 그날 영업시간 30분 단위
//   [빈자리 알림 받기]
//   나중에 할게요
// 시간 칩 규칙(사장님 결정): 지금 비어 있는 시간(이미 예약 가능)은 고를 수 없다 — 비지 않은 시간만 신청.
// 오늘의 지난 시간은 아예 안 보인다. 이미 신청해 둔 시간도 고를 수 없다(중복 신청 방지).
export function SlotAlertSheet({ visible, shopId, initialDayIndex = 0, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const id = shopId ?? '';
  const shopQuery = useShop(id, visible && !!shopId);
  const slotsQuery = useShopSlots(id, visible && !!shopId);
  const alertsQuery = useSlotAlerts(visible && !!shopId);
  const create = useCreateSlotAlerts();

  // 시트를 열 때마다 "지금" 기준으로 날짜·지난 시간을 다시 계산한다.
  const now = useMemo(() => new Date(), [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const days = useMemo(() => threeDays(now), [now]);

  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
    setDayIndex(Math.min(2, Math.max(0, initialDayIndex)));
    setSelected(new Set());
    create.reset();
  }, [visible, shopId, initialDayIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const day = days[dayIndex];

  const chips = useMemo(() => {
    const base = businessHalfHours(shopQuery.data?.businessHours, day.date);
    if (base === 'closed') return 'closed' as const;
    const isToday = dayIndex === 0;
    const cut = nowHM(now);
    const openHalves = new Set(
      (slotsQuery.data?.slots ?? [])
        .filter((s) => s.date === day.key)
        .map((s) => halfSlotOf(normalizeHM(s.startTime))),
    );
    const requested = new Set(
      (alertsQuery.data ?? [])
        .filter((a) => a.shopId === shopId && a.date === day.key && a.status === 'active')
        .map((a) => normalizeHM(a.time)),
    );
    return base
      .filter((t) => !isToday || t > cut)
      .map((t) => ({
        time: t,
        state: (openHalves.has(halfSlotOf(t))
          ? 'open'
          : requested.has(t)
            ? 'requested'
            : 'free') as ChipState,
      }));
  }, [shopQuery.data, slotsQuery.data, alertsQuery.data, day, dayIndex, now, shopId]);

  const loading = shopQuery.isPending || slotsQuery.isPending;

  const toggle = (t: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const changeDay = (i: number) => {
    if (i === dayIndex) return;
    setDayIndex(i);
    setSelected(new Set()); // 신청은 날짜 하나 단위(POST body의 date 1개)
  };

  const canSubmit = selected.size > 0 && !create.isPending && !!shopId;

  const submit = () => {
    if (!canSubmit || !shopId) return;
    create.mutate(
      { shopId, date: day.key, times: [...selected].sort() },
      {
        onSuccess: () => {
          onClose();
          onCreated();
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay.dim }} onPress={onClose} />
      <View
        className="bg-white"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '88%',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View className="items-center pt-2.5">
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line.handle }} />
        </View>

        <View className="px-5 pt-6">
          <Text className="text-heading-l font-pretendard-semibold" style={{ color: colors.text.strong }}>
            빈자리 알림 설정
          </Text>
          <Text className="mt-1 text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
            원하는 날짜와 시간에 빈자리가 생기면 알려드려요
          </Text>
        </View>

        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-label-l font-pretendard-semibold" style={{ color: colors.text.strong }}>
            날짜 선택
          </Text>
          <View className="mt-3 flex-row gap-2">
            {days.map((d, i) => {
              const on = i === dayIndex;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => changeDay(i)}
                  className="flex-1 items-center justify-center rounded-sm py-2.5"
                  style={{
                    borderWidth: 1,
                    borderColor: on ? colors.primary[500] : colors.line.base,
                    backgroundColor: on ? colors.brand.tint : colors.white,
                  }}
                >
                  <Text
                    className="text-body-m font-pretendard-semibold"
                    style={{ color: on ? colors.primary[500] : colors.text.strong }}
                  >
                    {d.label}
                  </Text>
                  <Text
                    className="text-caption-m font-pretendard"
                    style={{ color: on ? colors.primary[500] : colors.text.subtle }}
                  >
                    {d.md}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-7 flex-row items-center justify-between">
            <Text className="text-label-l font-pretendard-semibold" style={{ color: colors.text.strong }}>
              시간 선택
            </Text>
            <Text className="text-caption-m font-pretendard" style={{ color: colors.text.faint }}>
              복수 선택 가능
            </Text>
          </View>

          <View className="mt-3" style={{ minHeight: 88 }}>
            {loading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator color={colors.primary[500]} />
              </View>
            ) : chips === 'closed' || chips.length === 0 ? (
              <View
                className="items-center justify-center rounded-md py-8"
                style={{ backgroundColor: colors.surface.muted }}
              >
                <Text className="text-caption-m font-pretendard" style={{ color: colors.text.subtle }}>
                  {chips === 'closed' ? '이 날은 휴무일이에요' : '알림을 받을 수 있는 시간이 없어요'}
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {chips.map((c) => {
                  const on = selected.has(c.time);
                  const disabled = c.state !== 'free';
                  return (
                    <Pressable
                      key={c.time}
                      disabled={disabled}
                      onPress={() => toggle(c.time)}
                      accessibilityState={{ selected: on, disabled }}
                      className="items-center justify-center rounded-full"
                      style={{
                        minWidth: 68,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: on ? colors.primary[500] : disabled ? colors.gray[100] : colors.line.base,
                        backgroundColor: on ? colors.brand.tint : disabled ? colors.gray[100] : colors.white,
                      }}
                    >
                      <Text
                        className="text-label-m font-pretendard-medium"
                        style={{
                          color: on ? colors.primary[500] : disabled ? colors.text.disabled : colors.text.base,
                        }}
                      >
                        {c.time}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        <View className="px-5 pt-4">
          {create.isError && (
            <Text
              className="mb-2 text-center text-caption-m font-pretendard"
              style={{ color: colors.status.error }}
            >
              알림을 신청하지 못했어요. 잠시 후 다시 시도해 주세요
            </Text>
          )}
          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            className="h-12 items-center justify-center rounded-sm"
            style={{ backgroundColor: canSubmit ? colors.primary[500] : colors.line.base }}
          >
            {create.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text
                className="font-pretendard-semibold"
                style={{ fontSize: 16, color: canSubmit ? colors.white : colors.text.disabled }}
              >
                빈자리 알림 받기
              </Text>
            )}
          </Pressable>
          <Pressable onPress={onClose} hitSlop={6} className="mt-3 items-center py-1">
            <Text className="text-body-m font-pretendard" style={{ color: colors.text.muted }}>
              나중에 할게요
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
