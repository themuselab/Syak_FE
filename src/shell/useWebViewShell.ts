import { Platform } from 'react-native';

// 한 레포에서 두 가지를 만든다(docs/webview-migration.md):
//   expo export --platform web  →  Vercel에 올라가는 "화면"
//   eas build                   →  그 화면을 띄우는 "셸"
//
// 갈림길은 이 값 하나다.
//  - 웹 빌드는 Platform.OS === 'web' 이라 항상 null → 평소처럼 RN 화면을 그린다.
//  - 네이티브 빌드는 EXPO_PUBLIC_WEBVIEW_URL이 있으면 그 주소를 웹뷰로 띄운다.
//  - 그 값을 비우고 빌드하면 예전처럼 네이티브 화면이 그대로 뜬다(= 롤백 스위치).
//    심사에서 Guideline 4.2로 막히면 이 값만 빼고 다시 올린다.
export function useWebViewShellUrl(): string | null {
  if (Platform.OS === 'web') return null;
  const url = process.env.EXPO_PUBLIC_WEBVIEW_URL;
  return url && url.length > 0 ? url : null;
}
