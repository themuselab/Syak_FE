import { Text, View } from 'react-native';

import { useHomeFilterStore, type DateKey } from '../../useHomeFilterStore';
import { SelectChip } from './SelectChip';

const PINK = '#c24a6b'; // 예약시간 칩 선택 (디자인 원값)

const DATES: { key: DateKey; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'tomorrow', label: '내일' },
  { key: 'day_after', label: '모레' },
];

const TIMES = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

export function TimeFilterContent() {
  const { date, setDate, times, setTimes } = useHomeFilterStore();
  const toggleTime = (t: string) =>
    setTimes(times.includes(t) ? times.filter((x) => x !== t) : [...times, t]);

  return (
    <View className="px-5">
      <Text className="mb-2 text-[13px] font-pretendard-medium" style={{ color: '#1a1a1a' }}>
        날짜
      </Text>
      <View className="flex-row gap-[5px]">
        {DATES.map((d) => (
          <SelectChip
            key={d.key}
            label={d.label}
            selected={date === d.key}
            color={PINK}
            onPress={() => setDate(date === d.key ? null : d.key)}
          />
        ))}
      </View>

      <Text className="mb-2 mt-5 text-[13px] font-pretendard-medium" style={{ color: '#1a1a1a' }}>
        시간
      </Text>
      <View className="flex-row flex-wrap gap-[5px]">
        {TIMES.map((t) => (
          <SelectChip
            key={t}
            label={t}
            selected={times.includes(t)}
            color={PINK}
            width={63}
            onPress={() => toggleTime(t)}
          />
        ))}
      </View>
    </View>
  );
}
