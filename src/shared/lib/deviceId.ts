import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEY = 'syak_device_id';

// 설치 단위 고유 ID (BE POST /notifications/devices의 deviceId — docs/09 §3-5).
// 최초 실행 시 UUID 생성 후 영구 저장 — 앱 삭제·재설치 시 새 ID(= "설치마다 고유" 계약).
export async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await AsyncStorage.setItem(KEY, id);
  return id;
}
