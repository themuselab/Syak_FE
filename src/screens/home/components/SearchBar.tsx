import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import { useRef } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import { colors, shadow } from '@/shared/theme/colors';

import { useHomeFilterStore } from '../useHomeFilterStore';

const SYMBOL = require('../../../../assets/images/syak-symbol-pink.png');
const PROFILE = require('../../../../assets/icons/profile.png');

type Props = {
  focused: boolean;
  onFocusChange: (v: boolean) => void;
};

// 홈 검색바 (디자이너 시안 2026-10-15). 세 가지 모양이 있다.
//  기본     : [심볼] 샵, 시술, 동네 검색 ............ [프로필 → 마이]
//  입력 중  : [<] 입력 ...................................... [✕]
//  칩 선택  : [<] 네일 ...................................... [✕]   ← 상단 칩을 고르면
// 알림 벨은 시안에서 빠졌다. 프로필 아이콘이 검색바 안으로 들어왔다.
export function SearchBar({ focused, onFocusChange }: Props) {
  const search = useHomeFilterStore((s) => s.search);
  const setSearch = useHomeFilterStore((s) => s.setSearch);
  const picked = useHomeFilterStore((s) => s.picked);
  const setPicked = useHomeFilterStore((s) => s.setPicked);
  const inputRef = useRef<TextInput>(null);

  const pickedLabel = picked?.kind === 'partner' ? '샥 파트너샵' : picked?.label;

  // 뒤로가기: 입력은 남기고 포커스만 푼다(네이버 지도 동작 — 검색 결과를 계속 보게).
  const exitFocus = () => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    onFocusChange(false);
  };

  const shell = (children: React.ReactNode, leftPad = 14) => (
    <View
      className="h-11 flex-row items-center rounded-full border bg-white"
      style={{ borderColor: colors.primary[300], paddingLeft: leftPad, paddingRight: 8, ...shadow.sm }}
    >
      {children}
    </View>
  );

  // 칩 선택 상태 — 선택한 이름을 헤더처럼 보여준다. < 와 ✕ 모두 선택 해제.
  if (pickedLabel) {
    return shell(
      <>
        <Pressable onPress={() => setPicked(null)} hitSlop={8} style={{ marginRight: 6 }}>
          <ChevronLeft size={22} color={colors.gray[800]} />
        </Pressable>
        <Text
          className="flex-1 text-body-l font-pretendard-medium"
          numberOfLines={1}
          style={{ color: colors.text.strong }}
        >
          {pickedLabel}
        </Text>
        <Pressable onPress={() => setPicked(null)} hitSlop={8} className="p-1.5">
          <X size={18} color={colors.text.strong} />
        </Pressable>
      </>,
      8,
    );
  }

  return shell(
    <>
      {focused ? (
        <Pressable onPress={exitFocus} hitSlop={8} style={{ marginRight: 6 }}>
          <ChevronLeft size={22} color={colors.gray[800]} />
        </Pressable>
      ) : (
        // 시안 40×40 프레임(디자이너 확인 2026-10-22). 이미지 자체에 여백이 있어 그대로 40을 쓰고,
        // 그만큼 바 왼쪽 여백을 줄인다(아래 shell 두 번째 인자).
        <Image source={SYMBOL} style={{ width: 40, height: 40, marginRight: 2 }} contentFit="contain" />
      )}

      <TextInput
        ref={inputRef}
        value={search}
        onChangeText={setSearch}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        placeholder="샵, 시술, 동네 검색"
        placeholderTextColor={colors.text.placeholder}
        // 검색은 입력마다 디바운스로 나가므로 엔터는 키보드만 닫는다(QA #60).
        returnKeyType="search"
        onSubmitEditing={exitFocus}
        className="flex-1 text-body-l font-pretendard"
        style={{ color: colors.gray[900], paddingVertical: 0 }}
      />

      {focused ? (
        search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8} className="p-1.5">
            <X size={18} color={colors.text.placeholder} />
          </Pressable>
        )
      ) : (
        <Pressable onPress={() => router.push('/my')} hitSlop={6} accessibilityLabel="마이페이지">
          <Image source={PROFILE} style={{ width: 30, height: 30 }} contentFit="contain" />
        </Pressable>
      )}
    </>,
    focused ? 8 : 4,
  );
}
