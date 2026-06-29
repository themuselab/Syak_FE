import { Redirect } from 'expo-router';

// 앱의 '/' 진입점. 네이티브는 시작 시 '/'를 열기 때문에 이 라우트가 필요하다
// (initialRouteName만으로는 native 진입이 해결되지 않아 스플래시에서 멈춤).
// 여기서 첫 로딩 화면(splash)으로 보낸다.
export default function Index() {
  return <Redirect href="/splash" />;
}
