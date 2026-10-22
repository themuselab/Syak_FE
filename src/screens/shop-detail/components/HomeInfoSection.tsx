import { Image } from 'expo-image';
import { Navigation, Phone } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { openExternal } from '@/shared/lib/openExternal';
import { colors } from '@/shared/theme/colors';
import { InstagramIcon } from '@/shared/ui/InstagramIcon';

import type { ShopDetailView } from '../shopDetailToView';

const ICON_DISCOUNT = require('../../../../assets/icons/chip-discount.png');
const ICON_SIZE = 16;
const ICON_COLOR = colors.text.subtle;

type Props = {
  shop: Pick<
    ShopDetailView,
    'eventDesc' | 'address' | 'todayOpen' | 'phone' | 'instagram' | 'introduction'
  >;
};

// 탭 바로 아래 "홈" 영역 (디자이너 시안 2026-10-15): 이벤트 박스 → 주소·영업·전화·인스타 → 소개.
// 예전엔 "정보" 탭이 따로 있었는데 시안에서 홈으로 합쳐졌다.
export function HomeInfoSection({ shop }: Props) {
  return (
    <View className="gap-5 px-5 pt-5">
      {shop.eventDesc && (
        <View
          className="flex-row items-center gap-3 rounded-md border p-3"
          style={{ borderColor: colors.line.base }}
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-sm"
            style={{ backgroundColor: colors.warning[100] }}
          >
            <Image source={ICON_DISCOUNT} style={{ width: 18, height: 18 }} contentFit="contain" />
          </View>
          <Text className="flex-1 text-body-m font-pretendard" style={{ color: colors.text.strong }}>
            {shop.eventDesc}
          </Text>
        </View>
      )}

      <View className="gap-2.5">
        {shop.address && (
          <Row icon={<Navigation size={ICON_SIZE} color={ICON_COLOR} />}>
            <Text className="text-body-m font-pretendard" style={{ color: colors.text.strong }}>
              {shop.address}
            </Text>
          </Row>
        )}

        {/* 영업 상태 줄은 영업시간이 수집될 때까지 뺀다. 예전엔 todayOpen으로 "오늘 영업/휴무"를 띄웠는데,
            todayOpen은 "오늘 예약 빈자리가 있는지"라서 빈자리 없는 샵이 전부 "오늘 휴무"로 보였다
            (사용자 제보 2026-10-22). 시안의 "23:00에 영업 종료 ∨"는 영업시간 데이터가 생기면 붙인다. */}

        {shop.phone && (
          <Pressable onPress={() => openExternal(`tel:${shop.phone}`)}>
            <Row icon={<Phone size={ICON_SIZE} color={ICON_COLOR} />}>
              <Text className="text-body-m font-pretendard" style={{ color: colors.text.strong }}>
                {shop.phone}
              </Text>
            </Row>
          </Pressable>
        )}

        {shop.instagram && (
          <Pressable onPress={() => openExternal(shop.instagram!.url)}>
            <Row icon={<InstagramIcon size={ICON_SIZE - 2} color={ICON_COLOR} />}>
              <Text className="text-body-m font-pretendard" style={{ color: colors.primary[500] }}>
                {shop.instagram.handle}
              </Text>
            </Row>
          </Pressable>
        )}
      </View>

      {shop.introduction && (
        <View className="gap-2">
          <Text className="text-heading-m font-pretendard-semibold" style={{ color: colors.text.strong }}>
            소개
          </Text>
          <View className="rounded-md p-3.5" style={{ backgroundColor: colors.surface.muted }}>
            <Text
              className="text-body-m font-pretendard"
              style={{ color: colors.text.muted, lineHeight: 21 }}
            >
              {shop.introduction}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <View className="flex-row items-center gap-2">
      <View style={{ width: ICON_SIZE, alignItems: 'center' }}>{icon}</View>
      <View className="flex-1">{children}</View>
    </View>
  );
}
