import type { QuickSQLiteConnection } from 'react-native-quick-sqlite';
import type { PushSyncEventBody } from '@passtore/core';
import { getVaultConnection } from '@/services/vault/db';

function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class OutboxRepository {
  constructor(private readonly conn: QuickSQLiteConnection) {}

  async enqueue(body: PushSyncEventBody): Promise<void> {
    const id = newId();
    const now = new Date().toISOString();
    await this.conn.executeAsync(
      `INSERT INTO sync_outbox (id, payload_json, created_at, attempts, status) VALUES (?, ?, ?, 0, 'pending')`,
      [id, JSON.stringify(body), now],
    );
  }

  async listPending(
    limit: number,
  ): Promise<{ id: string; payload_json: string }[]> {
    const r = await this.conn.executeAsync(
      `SELECT id, payload_json FROM sync_outbox WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
      [limit],
    );
    const rows: { id: string; payload_json: string }[] = [];
    if (!r.rows?.length) {
      return rows;
    }
    for (let i = 0; i < r.rows.length; i++) {
      const item = r.rows.item(i) as { id: string; payload_json: string };
      rows.push(item);
    }
    return rows;
  }

  async remove(id: string): Promise<void> {
    await this.conn.executeAsync(`DELETE FROM sync_outbox WHERE id = ?`, [id]);
  }

  async recordError(id: string, message: string): Promise<void> {
    await this.conn.executeAsync(
      `UPDATE sync_outbox SET attempts = attempts + 1, last_error = ?, status = 'pending' WHERE id = ?`,
      [message.slice(0, 2000), id],
    );
  }

  async updatePayload(id: string, body: PushSyncEventBody): Promise<void> {
    await this.conn.executeAsync(
      `UPDATE sync_outbox SET payload_json = ?, attempts = 0, last_error = NULL, status = 'pending' WHERE id = ?`,
      [JSON.stringify(body), id],
    );
  }
}

let singleton: OutboxRepository | null = null;

export function getOutboxRepository(): OutboxRepository {
  if (!singleton) {
    singleton = new OutboxRepository(getVaultConnection());
  }
  return singleton;
}
