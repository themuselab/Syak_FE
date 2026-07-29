import { Text, View } from 'react-native';

import type { MenuItem } from '../shopDetailToView';

type Props = {
  menus: MenuItem[];
};

// 가격 섹션: 메뉴명 … 리더선 … 가격. 데이터 없으면 빈 상태 문구(백엔드 노출 대기).
// 제목은 원래 '메뉴·가격'이었으나 섹션 탭 라벨과 함께 '가격'으로 통일(QA 3차, 디자이너 확인 항목).
export function MenuSection({ menus }: Props) {
  return (
    <View className="gap-4">
      <Text
        className="font-pretendard-medium text-[18px]"
        style={{ color: '#1a1a1a', letterSpacing: -0.36 }}
      >
        가격
      </Text>
      {menus.length === 0 && (
        <Text className="font-pretendard text-[14px]" style={{ color: '#adb5bd' }}>
          메뉴 정보를 준비 중이에요
        </Text>
      )}
      <View className="gap-4">
        {menus.map((m, i) => (
          // 폭이 모자랄 때 줄어드는 쪽은 메뉴명(말줄임), 가격은 flexShrink 0으로 고정.
          // 가격을 안 막으면 '75,000원'의 '원'이 줄바꿈 기회로 잡혀 두 줄로 꺾인다(QA #57).
          <View key={i} className="flex-row items-center gap-1">
            <Text
              className="font-pretendard-medium text-[15px]"
              numberOfLines={1}
              style={{ color: '#7e7e7e', letterSpacing: -0.3, flexShrink: 1 }}
            >
              {m.name}
            </Text>
            <View className="h-px flex-1" style={{ backgroundColor: '#e6e6e6' }} />
            <Text
              className="font-pretendard-medium text-[15px]"
              numberOfLines={1}
              style={{ color: '#1a1a1a', letterSpacing: -0.3, flexShrink: 0 }}
            >
              {m.price}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
