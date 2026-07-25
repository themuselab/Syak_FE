import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { RotateCcw } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { postReservationClick } from '@/shared/domain/reservation/reservation.api';
import { useShopSlots } from '@/shared/domain/reservation/reservation.queries';
import { useShop } from '@/shared/domain/shops/shops.queries';
import { colors } from '@/shared/theme/colors';

import { DetailHeader } from './components/DetailHeader';
import { ReservationBar } from './components/ReservationBar';
import { ShopDetailBody } from './ShopDetailBody';
import { toShopDetailView } from './shopDetailToView';

type Props = {
  shopId: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  expanded: boolean; // 시트 풀스크린 여부 — true일 때만 헤더·예약바 표시(접힘 35%는 본문 상단만)
  onCollapse: () => void; // 헤더 뒤로가기 → 시트 접기
};

// 홈 포커스 시트용 인라인 상세(특정샵 포커스 디자인 euK3A). 라우트 화면(ShopDetailScreen)과
// 같은 쿼리키(['shops',id]/['slots',id])·본문(ShopDetailBody)을 공유 — 시트에서 본 데이터가
// 라우트 진입 시 캐시로 재사용된다. 로그인 게이팅(LoginPromptModal)은 홈이 담당(onToggleFavorite).
export function ShopDetailSheet({ shopId, favorite, onToggleFavorite, expanded, onCollapse }: Props) {
  const shopQuery = useShop(shopId);
  const slotsQuery = useShopSlots(shopId);

  const shop = useMemo(
    () =>
      shopQuery.data ? toShopDetailView(shopQuery.data, slotsQuery.data?.slots ?? []) : null,
    [shopQuery.data, slotsQuery.data],
  );

  // 로딩/에러: 접힘(35%) 상태에서도 보이도록 상단 배치(중앙 정렬이면 시트 아래 잘림).
  if (!shop) {
    return (
      <View className="flex-1 bg-white">
        {expanded && (
          <DetailHeader favorite={favorite} onToggleFavorite={onToggleFavorite} onBack={onCollapse} />
        )}
        {shopQuery.isError ? (
          <View className="items-center gap-3 pt-12">
            <Text className="text-body-m font-pretendard text-gray-600">
              샵 정보를 불러오지 못했어요
            </Text>
            <Pressable
              onPress={() => shopQuery.refetch()}
              className="items-center gap-1"
              hitSlop={8}
            >
              <RotateCcw size={20} color={colors.gray[700]} />
              <Text className="text-body-m font-pretendard text-gray-700">다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <View className="items-center pt-12">
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {expanded && (
        <DetailHeader favorite={favorite} onToggleFavorite={onToggleFavorite} onBack={onCollapse} />
      )}

      {/* 별은 항상 1개만. 풀스크린은 위 DetailHeader의 별을 쓰므로 타이틀 별을 끄고,
          헤더가 없는 접힘(35%)에서만 타이틀 별을 노출한다(QA #58 — 중복 노출 수정). */}
      <ShopDetailBody
        shop={shop}
        favorite={favorite}
        onToggleFavorite={expanded ? undefined : onToggleFavorite}
        renderScroll={(scrollProps, ref) => <BottomSheetScrollView {...scrollProps} ref={ref} />}
      />

      {expanded && (
        <ReservationBar
          phone={shop.phone}
          route={shop.bookingRoute}
          onReserveClick={() => {
            // 클릭 애널리틱스 — 실패해도 무시(fire-and-forget)
            postReservationClick(shop.id).catch(() => {});
          }}
        />
      )}
    </View>
  );
}
