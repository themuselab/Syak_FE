import { Search } from 'lucide-react-native';
import { Keyboard, TextInput, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { useHomeFilterStore } from '../useHomeFilterStore';

// 검색바: 흰 배경 pill, 핑크 테두리(red-300), placeholder "샵 이름으로 찾기".
export function SearchBar() {
  const search = useHomeFilterStore((s) => s.search);
  const setSearch = useHomeFilterStore((s) => s.setSearch);

  return (
    <View
      // h-10(40px) — 헤더 영역 세로 축소(QA #61)
      className="h-10 flex-row items-center rounded-full border bg-white"
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
        // 검색은 입력마다 디바운스로 나가므로 엔터는 키보드만 닫는다(QA #60).
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
        className="flex-1 text-body-l font-pretendard"
        style={{ color: colors.gray[900], paddingVertical: 0 }}
      />
      <Search size={20} color="#c3c3c3" />
    </View>
  );
}
