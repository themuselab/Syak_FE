import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { GA_MEASUREMENT_ID } from '@/shared/lib/gaConfig';

// 웹 정적 export(app.json web.output)의 HTML 뼈대. 웹 빌드에서만 쓰이고 네이티브 번들엔
// 들어가지 않는다(네이티브 앱은 index.native.tsx → 웹뷰 셸).
// expo-router 기본 Html(expo-router 패키지 build 폴더의 html.js)과 똑같이 두고 GA4 gtag 로더만 더했다
// — 화면 모양은 그대로. 화면 조회는 analytics.ts가 app_screen_view로 직접 보내므로 자동 page_view는 끈다.
const gtagBootstrap = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{send_page_view:false});`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        {/* GA4 (gtag) — docs/analytics.md */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: gtagBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
