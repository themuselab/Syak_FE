import { Pressable, Text, View } from 'react-native';

export type TabKey = 'home' | 'availability' | 'menu' | 'info' | 'review';

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'availability', label: '빈자리' },
  { key: 'menu', label: '메뉴·가격' },
  { key: 'info', label: '정보' },
  { key: 'review', label: '리뷰' },
];

type Props = {
  active: TabKey;
  onPressTab: (key: TabKey) => void;
};

// 섹션 탭 바. 스크롤스파이용 — 활성 탭 밑줄 + 핑크 텍스트. 상단 sticky.
export function SectionTabs({ active, onPressTab }: Props) {
  return (
    <View className="flex-row bg-white px-5">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onPressTab(tab.key)}
            className="flex-1 items-center justify-center p-2"
            style={{ borderBottomWidth: 1, borderBottomColor: isActive ? '#d23e6a' : 'transparent' }}
          >
            <Text
              className="font-pretendard-medium text-[16px]"
              style={{ color: isActive ? '#b32f58' : '#7d7d7d', letterSpacing: -0.32 }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
