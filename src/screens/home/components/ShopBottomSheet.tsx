import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, View } from 'react-native';

import { useBottomInset } from '@/shared/lib/safeArea';
import { ShopDetailSheet } from '@/screens/shop-detail/ShopDetailSheet';
import { colors } from '@/shared/theme/colors';
import { ShopListCard } from '@/shared/ui/ShopListCard';

import { SHEET_DEFAULT_SNAP, SHEET_MIN_HEIGHT } from '../homeLayout';
import type { ShopCardView } from '../shopToView';
import { useHomeFilterStore } from '../useHomeFilterStore';
import { FilterChipBar } from './FilterChipBar';
import { FilterView } from './filters/FilterView';
import { ShopListEmpty } from './ShopListEmpty';
import { ShopListError } from './ShopListError';

type Props = {
  shops: ShopCardView[];
  selectedShop: ShopCardView | null; // 핀/카드 탭으로 포커스된 매장 (인라인 상세)
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onToggleFavorite: (id: string) => void;
  onReset: () => void;
  onEndReached: () => void; // 리스트 끝 도달 → 다음 페이지 로드 (가드는 HomeScreen 담당)
  isFetchingNextPage: boolean;
  onSelectShop: (id: string) => void; // 목록 카드 탭 → 핀과 동일한 포커스 플로우
  onDeselect: () => void; // 물리 뒤로가기 등에서 포커스 해제
  topOffset: number; // 헤더+검색바 오버레이 높이 — 목록 모드 최대 확장이 검색바를 가리지 않게 (QA #50)
  containerHeight: number; // 루트 컨테이너 실측 높이 — gorhom의 스냅포인트 정규화 기준과 동일해야 함
};

// 단일 바텀시트: activeFilter → 필터 화면 / selectedShop → 인라인 상세(특정샵 포커스) / 그 외 → 칩바+목록.
// 시트 위치는 사용자가 둔 그대로 유지 — 단, 최소 높이(핸들+칩바)에서 필터를 열면 필터 화면이
// 안 보이므로 그때만 최대로 올리고 닫을 때 되돌린다(QA #54로 최소 높이가 40%→96px이 되며 필요해짐).
// 포커스 모드는 지도가 보이는 35%로 내리고, 위로 올리면(100%) 라우트 이동 없이 시트 안에서
// 상세 전체(헤더·sticky 탭·예약바)가 화면을 덮는다 — 사용자 확정(2026-07-10 피드백).
export function ShopBottomSheet({
  shops,
  selectedShop,
  isLoading,
  isError,
  onRetry,
  onToggleFavorite,
  onReset,
  onEndReached,
  isFetchingNextPage,
  onSelectShop,
  onDeselect,
  topOffset,
  containerHeight,
}: Props) {
  const bottomInset = useBottomInset();
  const sheetRef = useRef<BottomSheet>(null);
  const activeFilter = useHomeFilterStore((s) => s.activeFilter);
  const setActiveFilter = useHomeFilterStore((s) => s.setActiveFilter);

  const focused = selectedShop != null;
  // 포커스 접힘 높이는 디자인 285/812 ≈ 35%(euK3A), 확장은 100% 풀스크린(의도된 동작).
  // 목록 모드 3단: 최소(핸들+칩바만, QA #54) / 기본 40%(디자인) / 최대 = 검색바 바로 아래(QA #50).
  // 기본값은 40% 그대로 두고 "더 내릴 수 있는" 단만 추가한 것 — 첫 진입 화면은 변하지 않는다.
  // 최대 높이는 반드시 containerHeight(루트 실측) 기준 — gorhom이 같은 값으로 정규화하므로
  // windowHeight를 쓰면 안드 상태바 처리에 따라 검색바를 덮거나 틈이 생긴다.
  // 측정 전(containerHeight 0)엔 기존 90% 폴백.
  const snapPoints = useMemo(() => {
    if (focused) return ['35%', '100%'];
    const max = containerHeight > 0 && topOffset > 0 ? containerHeight - topOffset - 8 : '90%';
    return [SHEET_MIN_HEIGHT, SHEET_DEFAULT_SNAP, max];
  }, [focused, topOffset, containerHeight]);

  // 목록 모드의 기본 스냅(40%). 포커스 모드는 0 = 35%.
  const defaultIndex = focused ? 0 : 1;

  // 풀스크린 여부. onChange(settle 시점) 기준 — 확장 중 애니메이션 동안은 접힘 취급.
  const [expanded, setExpanded] = useState(false);

  // 핀/카드 탭(선택 변경) 시 지도가 보이게 시트를 35%로 + 확장 상태 초기화.
  // 선택 해제로 목록 모드에 돌아올 땐 스냅 개수가 2→3으로 바뀌므로 기본 40%로 명시 복귀시킨다
  // (안 하면 인덱스 0 = 96px 최소 높이로 떨어진다).
  useEffect(() => {
    setExpanded(false);
    sheetRef.current?.snapToIndex(selectedShop ? 0 : 1);
  }, [selectedShop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 현재 스냅 인덱스(렌더에 쓰지 않아 ref) — 필터 열 때 올릴지 판단용.
  const indexRef = useRef(defaultIndex);
  const raisedForFilter = useRef(false);

  const handleChange = (index: number) => {
    indexRef.current = index;
    if (focused) setExpanded(index === 1);
  };

  // 최소 높이(96px)에서 필터를 열면 제목·버튼까지 다 가려지므로 그때만 기본 40%로 올린다.
  // 그보다 위에 둔 상태라면 사용자가 둔 위치를 존중해 건드리지 않는다(기존 정책).
  useEffect(() => {
    if (activeFilter) {
      if (indexRef.current === 0) {
        raisedForFilter.current = true;
        sheetRef.current?.snapToIndex(1);
      }
    } else if (raisedForFilter.current) {
      raisedForFilter.current = false;
      sheetRef.current?.snapToIndex(0);
    }
  }, [activeFilter]);

  // 시트를 실제로 다른 스냅으로 옮길 때만 키보드 해제(QA #60). from===to면 snapPoints 재계산에
  // 따른 재정렬이므로, 검색 입력 중 키보드가 튕기지 않게 무시한다.
  const handleAnimate = (fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) Keyboard.dismiss();
  };

  // 안드 물리 뒤로가기: 풀스크린 → 접힘(35%), 접힘 포커스 → 선택 해제. 그 외 기본 동작.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!focused) return false;
      if (expanded) {
        sheetRef.current?.snapToIndex(0);
        return true;
      }
      onDeselect();
      return true;
    });
    return () => sub.remove();
  }, [focused, expanded, onDeselect]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={defaultIndex}
      snapPoints={snapPoints}
      // 포커스(상세) 모드에서 아래로 스와이프 → 시트 닫힘 → 선택 해제(목록 복귀). 이전엔 min 스냅
      // 35%에서 더 못 내려가 "상세에서 스와이프 다운해도 안 내려감"이었다(사용자 제보). 목록 모드
      // (focused=false)에선 비활성 → 목록 시트가 실수로 닫히지 않는다.
      enablePanDownToClose={focused}
      onClose={onDeselect}
      // v5 기본값(true)이면 콘텐츠 높이 스냅포인트가 추가돼, 칩 토글로 목록이 로딩 스피너로
      // 교체되는 순간 시트가 최소 높이로 줄어든다(QA #53) — 지정 스냅포인트만 사용.
      enableDynamicSizing={false}
      // 시트 pan을 "세로 10px 이상"일 때만 활성화하고 가로 우세 제스처에선 실패시킨다.
      // 미지정이면 gorhom이 activeOffset/failOffset을 아예 안 걸어(BottomSheetDraggableView)
      // 가로 드래그 첫 픽셀에도 시트 pan이 잡아채는데, 시트 로직은 translationY만 쓰므로
      // 시트도 안 움직이고 자식 가로 스크롤도 죽는다 — 필터 칩바·이미지 캐러셀이 이 상태였다(QA 3차).
      activeOffsetY={[-10, 10]}
      failOffsetX={[-5, 5]}
      onChange={handleChange}
      onAnimate={handleAnimate}
      // 키보드가 내려가면 시트를 원래 스냅으로 되돌린다(검색 → 지도 보기 전환 시 잔상 방지).
      keyboardBlurBehavior="restore"
      // 풀스크린에선 핸들을 숨기고 라운드를 없애 라우트 상세 화면과 동일하게 보이게.
      handleComponent={expanded ? null : undefined}
      handleIndicatorStyle={{ backgroundColor: '#d9d9d9', width: 40, height: 5 }}
      backgroundStyle={{
        borderTopLeftRadius: expanded ? 0 : activeFilter ? 20 : 28,
        borderTopRightRadius: expanded ? 0 : activeFilter ? 20 : 28,
      }}
    >
      {activeFilter ? (
        <FilterView filterKey={activeFilter} onClose={() => setActiveFilter(null)} />
      ) : selectedShop ? (
        <ShopDetailSheet
          shopId={selectedShop.id}
          favorite={selectedShop.favorite}
          onToggleFavorite={() => onToggleFavorite(selectedShop.id)}
          expanded={expanded}
          onCollapse={() => sheetRef.current?.snapToIndex(0)}
        />
      ) : (
        <>
          <FilterChipBar />
          {isLoading ? (
            <View className="items-center justify-center pt-16">
              <ActivityIndicator color={colors.primary[500]} />
            </View>
          ) : isError ? (
            <ShopListError onRetry={onRetry} />
          ) : shops.length === 0 ? (
            <ShopListEmpty onReset={onReset} />
          ) : (
            <BottomSheetFlatList
              data={shops}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingTop: 13, paddingBottom: bottomInset + 12 }}
              // 목록을 스크롤하면 검색 키보드가 내려가고, 카드 탭은 그대로 전달된다(QA #60).
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={{ paddingVertical: 16 }}>
                    <ActivityIndicator color={colors.primary[500]} />
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <ShopListCard
                  shop={item}
                  onPress={() => onSelectShop(item.id)}
                  onToggleFavorite={() => onToggleFavorite(item.id)}
                />
              )}
            />
          )}
        </>
      )}
    </BottomSheet>
  );
}
