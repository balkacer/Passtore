import type { PushSyncEventBody } from '@passtore/core';
import { openVaultDb } from '@/services/vault/idb';

function newId(): string {
  return crypto.randomUUID();
}

export interface OutboxRow {
  id: string;
  payload_json: string;
  created_at: string;
}

export class OutboxRepository {
  async enqueue(body: PushSyncEventBody): Promise<void> {
    const id = newId();
    const now = new Date().toISOString();
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sync_outbox', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('outbox enqueue'));
      tx.objectStore('sync_outbox').put({
        id,
        payload_json: JSON.stringify(body),
        created_at: now,
        attempts: 0,
        status: 'pending',
      });
    });
  }

  async listPending(limit: number): Promise<OutboxRow[]> {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_outbox', 'readonly');
      const store = tx.objectStore('sync_outbox');
      const req = store.getAll();
      req.onsuccess = () => {
        const raw = (req.result as Record<string, unknown>[])
          .filter((r) => r.status === 'pending')
          .sort((a, b) =>
            String(a.created_at).localeCompare(String(b.created_at)),
          )
          .slice(0, limit);
        const rows: OutboxRow[] = raw.map((r) => ({
          id: String(r.id),
          payload_json: String(r.payload_json),
          created_at: String(r.created_at),
        }));
        resolve(rows);
      };
      req.onerror = () => reject(req.error ?? new Error('outbox list'));
    });
  }

  async remove(id: string): Promise<void> {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sync_outbox', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('outbox remove'));
      tx.objectStore('sync_outbox').delete(id);
    });
  }

  async recordError(id: string, message: string): Promise<void> {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_outbox', 'readwrite');
      const store = tx.objectStore('sync_outbox');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const row = getReq.result as Record<string, unknown> | undefined;
        if (!row) {
          reject(new Error('outbox row missing'));
          return;
        }
        const attempts = Number(row.attempts ?? 0) + 1;
        const putReq = store.put({
          ...row,
          attempts,
          last_error: message.slice(0, 2000),
          status: 'pending',
        });
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('recordError tx'));
    });
  }

  async updatePayload(id: string, body: PushSyncEventBody): Promise<void> {
    const db = await openVaultDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_outbox', 'readwrite');
      const store = tx.objectStore('sync_outbox');
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const row = getReq.result as Record<string, unknown> | undefined;
        if (!row) {
          reject(new Error('outbox row missing'));
          return;
        }
        const putReq = store.put({
          ...row,
          payload_json: JSON.stringify(body),
          attempts: 0,
          last_error: null,
          status: 'pending',
        });
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('updatePayload tx'));
    });
  }
}

let singleton: OutboxRepository | null = null;

export function getOutboxRepository(): OutboxRepository {
  if (!singleton) {
    singleton = new OutboxRepository();
  }
  return singleton;
}
