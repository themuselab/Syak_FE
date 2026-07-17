import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { AvailabilityPeriod, DayAvailability } from '../shopDetailToView';

type Props = {
  availability: DayAvailability[];
};

function DayChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center rounded-[4px] p-2"
      style={{ backgroundColor: selected ? '#d23e6a' : '#f3f1f2' }}
    >
      <Text
        className="font-pretendard-medium text-[15px]"
        style={{ color: selected ? '#ffffff' : '#333333', letterSpacing: -0.3 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// 정보성 표시 전용(탭 불가). 테두리 버튼형이면 선택 가능해 보여(QA #56) 플랫 배경으로 톤 다운
// — 배경은 날짜 칩 비선택(#f3f1f2)과 동일 계열. 확정 스타일은 디자이너 확인 항목.
function TimeChip({ time }: { time: string }) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f3f1f2' }}
    >
      <Text className="font-pretendard-medium text-[14px]" style={{ color: '#555555' }}>
        {time}
      </Text>
    </View>
  );
}

function Period({ period }: { period: AvailabilityPeriod }) {
  return (
    <View className="gap-2">
      <Text
        className="font-pretendard-medium text-[15px]"
        style={{ color: '#222222', letterSpacing: -0.3 }}
      >
        {period.label}
      </Text>
      {period.slots.length === 0 ? (
        <View
          className="items-center justify-center rounded-[4px]"
          style={{ paddingVertical: 12, backgroundColor: '#f3f1f2' }}
        >
          <Text className="font-pretendard-medium text-[12px]" style={{ color: '#999999' }}>
            {period.closedMessage}
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap items-center gap-1">
          {period.slots.map((slot) => (
            <View key={slot.time} className="flex-row items-center">
              <TimeChip time={slot.time} />
              {slot.note ? (
                <Text className="ml-2 font-pretendard-medium text-[12px]" style={{ color: '#d23e6a' }}>
                  {slot.note}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// 빈자리 섹션: 날짜칩 선택 + 시간대(오전/오후/저녁) 슬롯.
export function AvailabilitySection({ availability }: Props) {
  const [selectedKey, setSelectedKey] = useState(availability[0]?.key);
  const selected = availability.find((d) => d.key === selectedKey) ?? availability[0];

  return (
    <View className="gap-4">
      <Text
        className="font-pretendard-medium text-[18px]"
        style={{ color: '#1a1a1a', letterSpacing: -0.36 }}
      >
        샥- 예약 가능한 빈자리 (앞으로 3일간)
      </Text>

      <View className="gap-5">
        <View className="flex-row gap-2">
          {availability.map((day) => (
            <DayChip
              key={day.key}
              label={day.label}
              selected={day.key === selected.key}
              onPress={() => setSelectedKey(day.key)}
            />
          ))}
        </View>

        <View className="gap-4">
          {selected.periods.map((period) => (
            <Period key={period.label} period={period} />
          ))}
        </View>
      </View>
    </View>
  );
}
