import { Bell, ChevronRight, Info } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import type { AvailabilityDay } from '../shopDetailToView';

const TOOLTIP_MS = 3000;

type Props = {
  days: AvailabilityDay[];
  onOpenSlotAlert: (dayIndex: number) => void;
};

// 예약 가능 시간 섹션 (디자이너 시안 2026-10-29 — 기존 빗금 시간 막대를 대체).
//   예약 가능 시간 (i)            ← (i) 탭 → 검은 말풍선 "오늘부터 3일간의 예약 가능한 시간을 확인할 수 있어요."
//   [오늘 (화)][내일 (수)][모레 (목)]   선택 = 진한 채움, 나머지 = 흰 바탕 테두리
//   15:00 · 15:30 · 16:00 · …        (없으면 가운데 회색 "예약이 모두 마감되었어요")
//   [🔔 빈자리 알림 설정하기  원하는 시간에 자리가 나면 알려드려요  >]  → 알림 설정 시트(이 탭 날짜)
export function AvailabilitySection({ days, onOpenSlotAlert }: Props) {
  const [selected, setSelected] = useState(0);
  const [tooltip, setTooltip] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const day = days[selected] ?? days[0];

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toggleTooltip = () => {
    if (timer.current) clearTimeout(timer.current);
    if (!tooltip) timer.current = setTimeout(() => setTooltip(false), TOOLTIP_MS);
    setTooltip(!tooltip);
  };

  if (!day) return null;

  return (
    <View className="gap-4">
      <View style={{ zIndex: 2 }}>
        <View className="flex-row items-center gap-1">
          <Text className="text-heading-m font-pretendard-semibold" style={{ color: colors.text.strong }}>
            예약 가능 시간
          </Text>
          <Pressable onPress={toggleTooltip} hitSlop={8} accessibilityLabel="예약 가능 시간 안내">
            <Info size={16} color={colors.text.faint} />
          </Pressable>
        </View>
        {tooltip && (
          <Pressable
            onPress={toggleTooltip}
            className="absolute rounded-sm px-3 py-2"
            style={{ top: 28, left: 0, backgroundColor: colors.text.strong }}
          >
            <Text className="text-caption-m font-pretendard" style={{ color: colors.white }}>
              오늘부터 3일간의 예약 가능한 시간을 확인할 수 있어요.
            </Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-2">
        {days.map((d, i) => {
          const on = i === selected;
          return (
            <Pressable
              key={d.key}
              onPress={() => setSelected(i)}
              className="flex-1 items-center justify-center rounded-sm py-2.5"
              style={{
                borderWidth: 1,
                borderColor: on ? colors.text.strong : colors.line.base,
                backgroundColor: on ? colors.text.strong : colors.white,
              }}
            >
              <Text
                className="text-body-m font-pretendard-semibold"
                style={{ color: on ? colors.white : colors.text.muted }}
              >
                {d.prefix} ({d.weekday})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {day.times.length > 0 ? (
        <Text className="text-body-l font-pretendard-medium" style={{ color: colors.text.base }}>
          {day.times.join(' · ')}
        </Text>
      ) : (
        <View className="items-center justify-center py-5">
          <Text className="text-body-m font-pretendard" style={{ color: colors.text.subtle }}>
            예약이 모두 마감되었어요
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => onOpenSlotAlert(selected)}
        className="flex-row items-center gap-3 rounded-md px-4 py-3.5"
        style={{ backgroundColor: colors.brand.tint }}
      >
        <Bell size={20} color={colors.primary[500]} fill={colors.primary[500]} />
        <View className="flex-1 gap-0.5">
          <Text className="text-label-m font-pretendard-semibold" style={{ color: colors.text.strong }}>
            빈자리 알림 설정하기
          </Text>
          <Text className="text-caption-m font-pretendard" style={{ color: colors.text.subtle }}>
            원하는 시간에 자리가 나면 알려드려요
          </Text>
        </View>
        <ChevronRight size={18} color={colors.text.faint} />
      </Pressable>
    </View>
  );
}
