import { ChevronRight, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { sizedImage } from '@/shared/lib/image';
import { colors } from '@/shared/theme/colors';
import { ShopPhoto } from '@/shared/ui/ShopPhoto';

import type { SlotAlertShopGroup } from '../groupSlotAlerts';

type Props = {
  group: SlotAlertShopGroup;
  ended?: boolean; // "종료된 알림" — 회색 카드
  editing: boolean; // 편집 모드: 칩에 × (탭하면 목록에서만 빠짐, "완료" 때 서버 삭제)
  onPressShop: () => void;
  onRemove: (id: string) => void;
};

// 신청 현황 카드 (디자이너 시안 2026-10-29 "알림함 - 신청 현황").
//   [사진] 내일 · 전농동                  >
//          샵 이름
//   오늘 화   (15:00) (15:30)
//   모레 목   (16:00)
export function SlotAlertCard({ group, ended, editing, onPressShop, onRemove }: Props) {
  const strong = ended ? colors.text.faint : colors.text.strong;
  return (
    <View
      className="mx-5 rounded-md bg-white p-4"
      style={{ borderWidth: 1, borderColor: colors.line.base }}
    >
      <Pressable onPress={onPressShop} className="flex-row items-center gap-3">
        {group.shopPhoto ? (
          <ShopPhoto
            source={{ uri: sizedImage(group.shopPhoto, 'thumb') }}
            recyclingKey={group.shopPhoto}
            cachePolicy="memory-disk"
            style={{ width: 40, height: 40, borderRadius: 8, opacity: ended ? 0.5 : 1 }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.line.base }} />
        )}
        <View className="flex-1 gap-0.5">
          {group.meta ? (
            <Text className="text-caption-m font-pretendard" style={{ color: ended ? colors.text.faint : colors.text.subtle }}>
              {group.meta}
            </Text>
          ) : null}
          <Text className="text-label-l font-pretendard-semibold" numberOfLines={1} style={{ color: strong }}>
            {group.shopName}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.text.faint} />
      </Pressable>

      <View className="mt-3 gap-2.5 border-t pt-3" style={{ borderColor: colors.line.divider }}>
        {group.rows.map((row) => (
          <View key={row.date} className="flex-row items-start gap-3">
            <Text
              className="text-label-m font-pretendard-medium"
              style={{ width: 52, paddingTop: 6, color: ended ? colors.text.faint : colors.text.muted }}
            >
              {row.label}
            </Text>
            <View className="flex-1 flex-row flex-wrap gap-1.5">
              {row.chips.map((c) => (
                <Pressable
                  key={c.id}
                  disabled={!editing}
                  onPress={() => onRemove(c.id)}
                  accessibilityLabel={editing ? `${row.label} ${c.time} 삭제` : undefined}
                  className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
                  style={{
                    borderWidth: 1,
                    borderColor: ended ? colors.gray[100] : colors.primary[300],
                    backgroundColor: ended ? colors.gray[100] : colors.brand.tint,
                  }}
                >
                  <Text
                    className="text-label-m font-pretendard-medium"
                    style={{ color: ended ? colors.text.disabled : colors.primary[500] }}
                  >
                    {c.time}
                  </Text>
                  {editing && (
                    <X size={12} color={ended ? colors.text.disabled : colors.primary[500]} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
