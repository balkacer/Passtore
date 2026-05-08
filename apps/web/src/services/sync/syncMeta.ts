import { getMeta, setMeta } from '@/services/vault/metaStore';

const CURSOR_KEY = 'sync_pull_cursor';

export async function getSyncPullCursor(): Promise<string> {
  return (await getMeta(CURSOR_KEY)) ?? '';
}

export async function setSyncPullCursor(cursor: string): Promise<void> {
  await setMeta(CURSOR_KEY, cursor);
}
