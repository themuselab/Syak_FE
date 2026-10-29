// RN Pressable 대신 gorhom이 재수출하는 터치 컴포넌트를 쓴다(안드=RNGH / iOS=RN 자동 분기).
// 시트 안에서는 부모 BottomSheetScrollView가 GestureDetector로 감싸여 있어 JS responder를 쓰는
// Pressable과 경합이 나고, 탭이 드래그로 판정되면 press가 취소된다 — "터치가 중간중간 씹힘"(QA 3차).
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { Text, View } from 'react-native';
import { colors } from '@/shared/theme/colors';

export type TabKey = 'home' | 'menu' | 'availability' | 'review';

// 디자이너 시안 2026-10-15: 홈 · 가격 · 빈자리 · 리뷰 (정보 탭은 홈 아래로 합쳐졌다).
export const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: '홈' },
  { key: 'menu', label: '가격' },
  { key: 'availability', label: '예약' }, // 시안(빈자리 알림받기 2026-10-29): 홈·가격·예약·리뷰
  { key: 'review', label: '리뷰' },
];

type Props = {
  active: TabKey;
  onPressTab: (key: TabKey) => void;
};

// 섹션 탭 바. 스크롤스파이용 — 활성 탭 밑줄 + 핑크 텍스트. 상단 sticky.
export function SectionTabs({ active, onPressTab }: Props) {
  return (
    <View className="flex-row border-b bg-white px-5" style={{ borderColor: colors.line.divider }}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          // 웹(react-native-web)에선 gorhom TouchableOpacity의 style flex:1이 적용되지 않아 탭이
          // 글자 폭으로 왼쪽에 몰렸다. 바깥 View가 4등분 폭을 잡고, 터치 영역은 그 안을 꽉 채운다.
          <View key={tab.key} style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => onPressTab(tab.key)}
              hitSlop={{ top: 6, bottom: 6 }}
              style={{
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                borderBottomWidth: 2,
                marginBottom: -1,
                borderBottomColor: isActive ? colors.primary[500] : 'transparent',
              }}
            >
              <Text
                className="font-pretendard-medium text-[16px]"
                numberOfLines={1}
                style={{ color: isActive ? colors.primary[500] : colors.text.subtle, letterSpacing: -0.32 }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
