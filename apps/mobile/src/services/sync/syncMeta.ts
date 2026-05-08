import { getVaultConnection } from '@/services/vault/db';

const KEY = 'sync_pull_cursor';

export async function getSyncPullCursor(): Promise<string | undefined> {
  const conn = getVaultConnection();
  const r = await conn.executeAsync(`SELECT value FROM vault_meta WHERE key = ?`, [KEY]);
  if (!r.rows?.length) {
    return undefined;
  }
  const v = String((r.rows.item(0) as { value: string }).value);
  return v || undefined;
}

export async function setSyncPullCursor(cursor: string): Promise<void> {
  const conn = getVaultConnection();
  await conn.executeAsync(`INSERT OR REPLACE INTO vault_meta (key, value) VALUES (?, ?)`, [
    KEY,
    cursor,
  ]);
}
