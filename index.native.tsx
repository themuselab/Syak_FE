import { registerRootComponent } from 'expo';

import { ShellApp } from '@/shell/ShellApp';

// 네이티브(iOS·Android) 진입점 — 웹뷰 셸만. 웹은 index.ts(expo-router)로 들어간다.
registerRootComponent(ShellApp);
