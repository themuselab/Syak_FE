import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 하단 안전영역(내비바) 높이. iOS는 useSafeAreaInsets가 정확하지만, 일부 안드로이드 기기
// (구형 갤럭시 노트10 등, 3버튼 내비 + edge-to-edge)에서는 insets.bottom이 0으로 들어와
// 콘텐츠가 내비바에 잘린다 — SafeAreaProvider initialWindowMetrics로도 해결 안 됨(QA #12·#18, 실기기 확인).
// 그래서 안드로이드는 표준 3버튼 내비바 높이(48dp)를 하한으로 둔다(insets가 더 크면 그 값 사용).
// 제스처 내비 기기에선 약간의 여백이 더 생길 수 있으나(하한 48), 콘텐츠 잘림보다 낫다.
const ANDROID_NAV_BAR_FALLBACK = 48;

/** 하단 패딩에 쓸 안전영역 값. 안드로이드는 내비바 높이를 하한 보장. */
export function useBottomInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'android'
    ? Math.max(insets.bottom, ANDROID_NAV_BAR_FALLBACK)
    : insets.bottom;
}
