// RN Pressable 대신 gorhom이 재수출하는 터치 컴포넌트를 쓴다(안드=RNGH / iOS=RN 자동 분기).
// 시트 안에서는 부모 BottomSheetScrollView가 GestureDetector로 감싸여 있어 JS responder를 쓰는
// Pressable과 경합이 나고, 탭이 드래그로 판정되면 press가 취소된다 — "터치가 중간중간 씹힘"(QA 3차).
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { Text, View } from 'react-native';

export type TabKey = 'home' | 'availability' | 'menu' | 'info' | 'review';

// 탭 5개가 각각 flex-1이라 360dp 화면에선 탭 하나가 약 64px. '메뉴·가격'(16px 폰트, 약 80px)은
// 여기서 두 줄로 꺾였다 → '가격'으로 축약(QA 3차, 디자이너 확인 항목).
export const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'availability', label: '빈자리' },
  { key: 'menu', label: '가격' },
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
          <TouchableOpacity
            key={tab.key}
            onPress={() => onPressTab(tab.key)}
            hitSlop={{ top: 6, bottom: 6 }}
            className="flex-1 items-center justify-center p-2"
            style={{ borderBottomWidth: 1, borderBottomColor: isActive ? '#d23e6a' : 'transparent' }}
          >
            <Text
              className="font-pretendard-medium text-[16px]"
              numberOfLines={1}
              style={{ color: isActive ? '#b32f58' : '#7d7d7d', letterSpacing: -0.32 }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
