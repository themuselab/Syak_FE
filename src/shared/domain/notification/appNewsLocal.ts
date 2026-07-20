import AsyncStorage from '@react-native-async-storage/async-storage';

// 앱 소식(공지·마케팅)의 기기 로컬 상태.
// - 읽음: 서버가 관리하지 않음(BE 공지 — docs/09 §3-5) → 읽은 id를 기기에 저장
// - 수신 on/off: 디바이스 단위 설정(POST /devices의 appNewsEnabled) → 서버 재등록용 원본 값을 기기에 저장

const READ_KEY = 'syak_app_news_read';
const ENABLED_KEY = 'syak_app_news_enabled';
const READ_MAX = 200; // 읽음 목록 무한 성장 방지 — 최신 200개만 유지(그 이전 소식은 목록에서 이미 밀려남)

export async function getAppNewsEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ENABLED_KEY);
    return v === null ? true : v === 'true'; // 미설정 = 기본 ON (BE 예시 기본값과 동일)
  } catch {
    return true;
  }
}

export async function setAppNewsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, String(enabled));
  } catch {
    // 저장 실패 시 다음 조회에서 기본값 — 치명적이지 않음
  }
}

export async function getReadAppNewsIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function markAppNewsRead(id: string): Promise<void> {
  try {
    const ids = await getReadAppNewsIds();
    if (ids.has(id)) return;
    const next = [...ids, id].slice(-READ_MAX);
    await AsyncStorage.setItem(READ_KEY, JSON.stringify(next));
  } catch {
    // 실패 시 다음 진입에 다시 미읽음 표시 — 치명적이지 않음
  }
}
