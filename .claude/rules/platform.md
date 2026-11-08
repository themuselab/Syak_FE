---
paths:
  - "**/*.tsx"
  - "app.config.ts"
  - "app/app.config.ts"
---

## 8. 크로스플랫폼(iOS · Android) 규칙

**iOS와 Android 동시 출시를 전제로 한다.** 하나의 코드로 두 플랫폼을 지원하며, 처음부터 양쪽을 의식하고 짠다.

- **한 코드베이스 유지.** 플랫폼별로 코드를 복제하지 않는다. 차이는 같은 코드 안에서 `Platform.OS` / `Platform.select()`로 최소 분기. iOS·Android 전용 파일(`*.ios.tsx`/`*.android.tsx`)은 꼭 필요할 때만.
- **SafeArea 필수.** 노치/상태바/홈 인디케이터 여백은 하드코딩하지 말고 `react-native-safe-area-context`(`SafeAreaView`/`useSafeAreaInsets`)로 처리한다. 두 플랫폼·기기 크기에서 잘리지 않게.
- **그림자는 양쪽 다 보이게.** iOS(`shadowColor/Offset/Opacity/Radius`)와 Android(`elevation`)를 함께 지정하거나, 공통 그림자 토큰/컴포넌트로 추상화한다.
- **네이티브 모듈은 iOS·Android 설정을 모두 챙긴다.** 지도/소셜 로그인/푸시 등은 플랫폼별 키·URL scheme·권한 설정이 따로 필요하다. 한쪽만 설정하지 않는다.
- **소셜 로그인**: 카카오/네이버 등을 제공하면 **iOS는 "Apple로 로그인"이 필수**(앱스토어 심사 규정). 온보딩은 이를 전제로 한다.
- **크로스플랫폼 우선.** iOS 전용/웹 전용 API보다 양 플랫폼 지원 라이브러리를 택한다. 터치 영역·폰트·키보드 동작도 양쪽에서 점검한다.
- **개발은 안드로이드(갤럭시탭/Expo Go·dev build), iOS는 빌드 후 확인 + 미세 조정.** iOS 확인은 마일스톤마다 하여 플랫폼 차이를 일찍 잡는다.
