import { Image } from 'expo-image';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { useRef } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';

import { colors } from '@/shared/theme/colors';
import { useHomeFilterStore } from '../useHomeFilterStore';

// 브랜드 심볼 마크(배경 없음) — 검색창 왼쪽에 아이콘만 노출.
const logo = require('../../../../assets/images/logo-mark.png');

type Props = {
  focused: boolean;
  onFocusChange: (v: boolean) => void;
};

// 검색바: 흰 배경 pill, 핑크 테두리(red-300). 지역 검색 전용 — 상호가 아니라 지역명("천호")으로
// 그 동네 샵을 찾는다(BE q → gu / detail.roadAddress 부분일치).
// 포커스되면 네이버 지도처럼 왼쪽이 뒤로가기로 바뀌고, 부모가 알림·프로필 아이콘과 카테고리 칩을
// 숨겨 검색창이 가로로 넓어진다.
export function SearchBar({ focused, onFocusChange }: Props) {
  const search = useHomeFilterStore((s) => s.search);
  const setSearch = useHomeFilterStore((s) => s.setSearch);
  const inputRef = useRef<TextInput>(null);

  // 뒤로가기: 입력은 남기고 포커스만 푼다(네이버 지도 동작 — 검색 결과를 계속 보게).
  const exitFocus = () => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    onFocusChange(false);
  };

  return (
    <View
      // h-10(40px) — 헤더 영역 세로 축소(QA #61)
      className="h-10 flex-row items-center rounded-full border bg-white"
      style={{
        borderColor: colors.primary[300],
        paddingLeft: focused ? 8 : 14,
        paddingRight: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3.5,
        elevation: 2,
      }}
    >
      {focused ? (
        <Pressable onPress={exitFocus} hitSlop={8} style={{ marginRight: 4 }}>
          <ChevronLeft size={22} color={colors.gray[800]} />
        </Pressable>
      ) : (
        /* 브랜드 심볼 마크. 배경 없이 아이콘만(디자인 요청) — 검색창 왼쪽 고정. */
        <Image source={logo} style={{ width: 22, height: 23, marginRight: 8 }} contentFit="contain" />
      )}

      <TextInput
        ref={inputRef}
        value={search}
        onChangeText={setSearch}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        placeholder="샥- 지도검색"
        placeholderTextColor="#c3c3c3"
        // 검색은 입력마다 디바운스로 나가므로 엔터는 키보드만 닫는다(QA #60).
        returnKeyType="search"
        onSubmitEditing={exitFocus}
        className="flex-1 text-body-l font-pretendard"
        style={{ color: colors.gray[900], paddingVertical: 0 }}
      />

      {focused && search.length > 0 ? (
        <Pressable onPress={() => setSearch('')} hitSlop={8}>
          <X size={18} color="#c3c3c3" />
        </Pressable>
      ) : (
        <Search size={20} color="#c3c3c3" />
      )}
    </View>
  );
}
