import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'passtore_temp_auth_audit_v1';
const MAX = 100;

export type TempAuthLocalAuditEntry = {
  at: string;
  action: string;
  detail?: Record<string, unknown>;
};

async function readAll(): Promise<TempAuthLocalAuditEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as TempAuthLocalAuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendTempAuthAudit(
  action: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  const row: TempAuthLocalAuditEntry = {
    at: new Date().toISOString(),
    action,
    detail,
  };
  const prev = await readAll();
  const next = [row, ...prev].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function listTempAuthAudit(): Promise<TempAuthLocalAuditEntry[]> {
  return readAll();
}

export async function clearTempAuthAudit(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
