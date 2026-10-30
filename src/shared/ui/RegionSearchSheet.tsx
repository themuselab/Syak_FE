import { ChevronLeft, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHardwareBack } from '@/shared/lib/backStack';
import { type Dong, searchDongs } from '@/shared/lib/dongs';
import { colors } from '@/shared/theme/colors';
import { InfoBadge } from '@/shared/ui/InfoBadge';

type Props = {
  visible: boolean;
  current: Dong | null;
  onSelect: (d: Dong) => void;
  onClose: () => void;
};

// 관심 동네 설정 시트(디자이너 시안 2026-10-27). 홈 안내 시트·마이 "관심동네"에서 연다.
//  - 검색 전: "동 이름으로 검색해 주세요" (+ 설정돼 있으면 "현재 관심 동네" 줄)
//  - 결과: "서울 강남구 논현동" — 동 이름만 분홍
//  - 결과 없음: (i) "검색 결과가 없어요"
export function RegionSearchSheet({ visible, current, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => searchDongs(query), [query]);
  const hasQuery = query.trim().length > 0;

  const close = () => {
    setQuery('');
    onClose();
  };
  // 안드 물리 뒤로가기(웹뷰 셸) = 닫기. 웹에선 Modal onRequestClose가 안 불려 따로 건다(backStack).
  useHardwareBack(visible, close);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay.dim }} onPress={close} />
      <View
        className="bg-white"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: insets.top + 24,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: insets.bottom,
        }}
      >
        <View className="items-center pt-2.5">
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.line.handle,
            }}
          />
        </View>

        <View className="flex-row items-center gap-1 px-4 pt-4 pb-3">
          <Pressable onPress={close} hitSlop={10} accessibilityLabel="닫기">
            <ChevronLeft size={24} color={colors.gray[800]} />
          </Pressable>
          <Text className="font-pretendard-semibold" style={{ fontSize: 18, color: colors.text.strong }}>
            관심 동네 설정
          </Text>
        </View>

        <View className="px-5">
          <View
            className="h-11 flex-row items-center gap-2 rounded-full border bg-white px-4"
            style={{
              borderColor: focused ? colors.primary[300] : colors.line.base,
            }}
          >
            <Search size={18} color={colors.text.strong} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="동네 검색 (예: 역삼동)"
              placeholderTextColor={colors.text.placeholder}
              autoCorrect={false}
              returnKeyType="search"
              className="flex-1 text-body-l font-pretendard"
              style={{
                color: colors.gray[900],
                paddingVertical: 0,
              }}
            />
          </View>

          {current && !hasQuery && (
            <View
              className="mt-3 flex-row items-center justify-between rounded-sm px-3"
              style={{ height: 40, backgroundColor: colors.surface.muted }}
            >
              <View className="flex-row items-center gap-2">
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    borderWidth: 1.5,
                    borderColor: colors.primary[500],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.primary[500],
                    }}
                  />
                </View>
                <Text className="text-body-m font-pretendard" style={{ color: colors.text.muted }}>
                  현재 관심 동네
                </Text>
              </View>
              <Text className="text-body-m font-pretendard-semibold" style={{ color: colors.text.strong }}>
                {current.name}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          {!hasQuery ? (
            <View className="items-center gap-1.5 pt-10">
              <Text className="font-pretendard-semibold" style={{ fontSize: 15, color: colors.text.strong }}>
                동 이름으로 검색해 주세요
              </Text>
              <Text className="font-pretendard" style={{ fontSize: 13, color: colors.text.subtle }}>
                예: 역삼동, 성수동, 망원동
              </Text>
            </View>
          ) : results.length === 0 ? (
            <View className="items-center gap-1.5 pt-10">
              <InfoBadge />
              <Text
                className="mt-3 font-pretendard-semibold"
                style={{ fontSize: 15, color: colors.text.strong }}
              >
                검색 결과가 없어요
              </Text>
              <Text className="font-pretendard" style={{ fontSize: 13, color: colors.text.subtle }}>
                동네 이름을 다시 입력해 주세요
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(d) => d.code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 24,
              }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setQuery('');
                    onSelect(item);
                  }}
                  style={{ paddingVertical: 8 }}
                >
                  <Text className="text-body-m font-pretendard" style={{ color: colors.text.strong }}>
                    {`${item.sido} ${item.sgg} `}
                    <Text style={{ color: colors.primary[500] }}>{item.name}</Text>
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>

        {/* 행정구역 경계 데이터 출처 표시(공공누리 1유형·CC BY 4.0 조건) */}
        <Text
          className="px-5 pb-3 text-center font-pretendard"
          style={{ fontSize: 10, color: colors.text.faint }}
        >
          동네 정보: 통계청 SGIS 행정구역 경계(공공누리 제1유형)
        </Text>
      </View>
    </Modal>
  );
}
