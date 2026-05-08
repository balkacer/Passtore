import { openVaultDb } from '@/services/vault/idb';

export async function getMeta(key: string): Promise<string | null> {
  const db = await openVaultDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get(key);
    req.onsuccess = () => {
      const row = req.result as { key: string; value: string } | undefined;
      resolve(row?.value ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error('meta get'));
  });
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await openVaultDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('meta set'));
    tx.objectStore('meta').put({ key, value });
  });
}
