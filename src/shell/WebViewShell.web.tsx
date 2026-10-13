// 웹 빌드용 빈 구현. 웹은 "웹뷰 안의 화면" 자신이라 스스로를 또 띄울 일이 없다.
// react-native-webview는 네이티브 모듈이라 웹 번들에 섞이면 안 되므로 이 파일로 대체된다.
// (useWebViewShell이 웹에서 항상 null을 주므로 실제로 렌더되지도 않는다 — 안전장치)

type Props = { url: string };

export function WebViewShell(_props: Props) {
  return null;
}
