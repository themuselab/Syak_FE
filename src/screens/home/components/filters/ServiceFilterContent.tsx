import { Text, View } from 'react-native';

import { useHomeFilterStore } from '../../useHomeFilterStore';
import { SelectChip } from './SelectChip';

const FIELDS = ['네일', '헤어', '속눈썹', '왁싱', '반영구', '피부', '마사지', '태닝'];
const SERVICES = ['젤네일', '패디큐어', '네일아트', '손연장', '케어', '속눈썹', '왁싱', '반영구', '펌', '염색', '커트', '피부관리', '마사지', '태닝'];

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function ServiceFilterContent() {
  const { serviceFields, setServiceFields, services, setServices } = useHomeFilterStore();
  return (
    <View className="px-5">
      <Text className="mb-2 text-[13px] font-pretendard-medium" style={{ color: '#1a1a1a' }}>
        시술분야
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {FIELDS.map((f) => (
          <SelectChip
            key={f}
            label={f}
            selected={serviceFields.includes(f)}
            onPress={() => setServiceFields(toggle(serviceFields, f))}
          />
        ))}
      </View>

      <Text className="mb-2 mt-5 text-[13px] font-pretendard-medium" style={{ color: '#1a1a1a' }}>
        시술
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {SERVICES.map((s) => (
          <SelectChip
            key={s}
            label={s}
            selected={services.includes(s)}
            onPress={() => setServices(toggle(services, s))}
          />
        ))}
      </View>
    </View>
  );
}
