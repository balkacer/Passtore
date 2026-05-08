import { getMeta, setMeta } from '@/services/vault/metaStore';

const KEY = 'device_public_id';

export async function getDevicePublicId(): Promise<string> {
  const existing = await getMeta(KEY);
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  await setMeta(KEY, id);
  return id;
}
