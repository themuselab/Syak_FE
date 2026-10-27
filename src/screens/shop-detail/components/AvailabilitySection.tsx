import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/shared/theme/colors';

import type { DayTimeline, HalfState } from '../shopDetailToView';

const CELL_W = 30;
const CELL_H = 36;
const CELL_GAP = 4;

const FILL: Record<HalfState, string> = {
  past: colors.gray[100],
  open: colors.primary[500],
  closed: colors.line.base,
};

type Props = { timeline: DayTimeline[] };

// 빈자리 섹션 (디자이너 시안 2026-10-15).
//   샥- 예약 가능한 빈자리 (앞으로 3일간)
//   [오늘 (화) 10.01][내일 (수) 10.02][모레 (목) 10.03]
//   ▨▨▨▨▮█▮░░ ← 한 칸 = 1시간, 반 칸 = 30분
//   ▨ 지난 시간  ■ 빈자리  ■ 예약 마감
// 그날 빈자리가 하나도 없으면 막대 대신 "예약이 모두 마감되었어요"(시안 "빈자리 마감").
export function AvailabilitySection({ timeline }: Props) {
  const [selected, setSelected] = useState(0);
  const day = timeline[selected] ?? timeline[0];
  const barRef = useRef<ScrollView>(null);

  // 오늘을 보고 있으면 지난 시간을 넘겨 "지금"부터 보이게 한다. 다른 날은 맨 앞부터.
  useEffect(() => {
    if (!day) return;
    const firstLive = selected === 0 ? day.cells.findIndex((c) => c.halves[1] !== 'past') : 0;
    const x = Math.max(0, firstLive - 1) * (CELL_W + CELL_GAP);
    barRef.current?.scrollTo({ x, animated: false });
  }, [selected, day]);

  if (!day) return null;

  return (
    <View className="gap-4">
      <Text className="text-heading-m font-pretendard-semibold" style={{ color: colors.text.strong }}>
        <Text style={{ color: colors.primary[500] }}>샥-</Text> 예약 가능한 빈자리 (앞으로 3일간)
      </Text>

      {/* 날짜 선택 — 선택된 날은 진한 칸, 나머지는 회색 바탕 위 글씨만 */}
      <View className="flex-row rounded-md p-[3px]" style={{ backgroundColor: colors.surface.muted }}>
        {timeline.map((d, i) => {
          const on = i === selected;
          return (
            <Pressable
              key={d.key}
              onPress={() => setSelected(i)}
              className="flex-1 items-center justify-center rounded-sm py-2"
              style={{ backgroundColor: on ? colors.text.strong : 'transparent' }}
            >
              <Text
                className="text-body-m font-pretendard-semibold"
                style={{ color: on ? colors.white : colors.text.muted }}
              >
                {d.label}
              </Text>
              <Text
                className="text-caption-m font-pretendard"
                style={{ color: on ? colors.white : colors.text.subtle, opacity: on ? 0.85 : 1 }}
              >
                {d.date}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {day.hasOpen ? (
        <View className="gap-3">
          <ScrollView
            ref={barRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: CELL_GAP }}
          >
            {day.cells.map((c) => (
              <View key={c.hour} style={{ width: CELL_W, gap: 6 }}>
                <View
                  style={{
                    width: CELL_W,
                    height: CELL_H,
                    borderRadius: 4,
                    overflow: 'hidden',
                    flexDirection: 'row',
                  }}
                >
                  {c.halves.map((h, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: FILL[h], overflow: 'hidden' }}>
                      {h === 'past' && <Hatch />}
                    </View>
                  ))}
                </View>
                <Text
                  className="text-caption-m font-pretendard"
                  style={{ color: colors.text.subtle, textAlign: 'left' }}
                >
                  {c.hour}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View className="flex-row items-center gap-3">
            <Legend color={FILL.past} label="지난 시간" hatched />
            <Legend color={FILL.open} label="빈자리" />
            <Legend color={FILL.closed} label="예약 마감" />
          </View>
        </View>
      ) : (
        <View
          className="h-20 items-center justify-center rounded-md"
          style={{ backgroundColor: colors.surface.muted }}
        >
          <Text className="text-caption-m font-pretendard" style={{ color: colors.text.subtle }}>
            예약이 모두 마감되었어요
          </Text>
        </View>
      )}
    </View>
  );
}

// "지난 시간" 빗금. 이미지·SVG 없이 기울인 얇은 선을 칸 안에 깔고 칸의 overflow로 자른다
// (네이티브·웹뷰 공통으로 같은 모양).
// 범례 칸(8px)에는 촘촘한 간격으로 같은 무늬를 작게 깐다(시안: 범례도 빗금).
function Hatch({
  offsets = [-12, -4, 4, 12, 20],
  height = CELL_H,
  lineWidth = 1.5,
}: {
  offsets?: number[];
  height?: number;
  lineWidth?: number;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {offsets.map((x) => (
        <View
          key={x}
          style={{
            position: 'absolute',
            left: x,
            top: -8,
            width: lineWidth,
            height: height + 16,
            backgroundColor: colors.gray[300],
            transform: [{ rotate: '35deg' }],
          }}
        />
      ))}
    </View>
  );
}

function Legend({ color, label, hatched }: { color: string; label: string; hatched?: boolean }) {
  return (
    <View className="flex-row items-center gap-1">
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, overflow: 'hidden' }}>
        {hatched && <Hatch offsets={[0, 4, 8]} height={8} lineWidth={1} />}
      </View>
      <Text className="text-caption-m font-pretendard" style={{ color: colors.text.subtle }}>
        {label}
      </Text>
    </View>
  );
}
