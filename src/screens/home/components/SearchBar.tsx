import { Search } from 'lucide-react-native';
import { TextInput, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { useHomeFilterStore } from '../useHomeFilterStore';

// 검색바: 흰 배경 pill, 핑크 테두리(red-300), placeholder "샵 이름으로 찾기".
export function SearchBar() {
  const search = useHomeFilterStore((s) => s.search);
  const setSearch = useHomeFilterStore((s) => s.setSearch);

  return (
    <View
      className="h-11 flex-row items-center rounded-full border bg-white"
      style={{
        borderColor: colors.primary[300],
        paddingLeft: 16,
        paddingRight: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3.5,
        elevation: 2,
      }}
    >
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="샵 이름으로 찾기"
        placeholderTextColor="#c3c3c3"
        className="flex-1 text-body-l font-pretendard"
        style={{ color: colors.gray[900], paddingVertical: 0 }}
      />
      <Search size={20} color="#c3c3c3" />
    </View>
  );
}
