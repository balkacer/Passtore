import type { PushSyncEventBody } from '@passtore/core';
import { USE_SYNC_OUTBOX } from '@/config/featureFlags';
import { getApiBaseUrl } from '@/config/env';
import * as SecureStorage from '@/services/secure-storage/secureStorageService';
import { getOutboxRepository } from '@/services/sync/outboxRepository';
import { useConflictStore } from '@/store/zustand/conflictStore';

/** POST pending outbox rows to `/sync/events`. */
export async function flushSyncOutbox(): Promise<void> {
  if (!USE_SYNC_OUTBOX) {
    return;
  }
  const token = await SecureStorage.getJwt();
  if (!token) {
    return;
  }

  const base = getApiBaseUrl().replace(/\/$/, '');
  const pending = await getOutboxRepository().listPending(50);

  for (const row of pending) {
    let body: PushSyncEventBody;
    try {
      body = JSON.parse(row.payload_json) as PushSyncEventBody;
    } catch {
      await getOutboxRepository().remove(row.id);
      continue;
    }

    const res = await fetch(`${base}/sync/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      await getOutboxRepository().remove(row.id);
      continue;
    }

    if (res.status === 409) {
      let detail: {
        conflict?: boolean;
        itemKey?: string;
        serverRowVersion?: number;
      } = {};
      try {
        detail = (await res.json()) as typeof detail;
      } catch {
        /* ignore */
      }
      if (detail.conflict && detail.itemKey) {
        useConflictStore.getState().addConflict({
          outboxRowId: row.id,
          itemKey: detail.itemKey,
          serverRowVersion: detail.serverRowVersion ?? 0,
          payload: body,
        });
      } else {
        await getOutboxRepository().recordError(row.id, 'conflict');
      }
      continue;
    }

    const text = await res.text();
    await getOutboxRepository().recordError(row.id, text || String(res.status));
  }
}
