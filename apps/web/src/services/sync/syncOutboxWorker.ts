import type { PushSyncEventBody } from '@passtore/core';
import { USE_SYNC_OUTBOX } from '@/config/featureFlags';
import { getApiBaseUrl } from '@/lib/config';
import { getJwt } from '@/lib/webSecureStorage';
import { getOutboxRepository } from '@/services/sync/outboxRepository';

/** POST pending outbox rows to `/sync/events`. */
export async function flushSyncOutbox(): Promise<void> {
  if (!USE_SYNC_OUTBOX) {
    return;
  }
  const token = getJwt();
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
      await getOutboxRepository().recordError(
        row.id,
        'sync conflict — resolve on mobile or retry with force when supported',
      );
      continue;
    }

    const text = await res.text();
    await getOutboxRepository().recordError(row.id, text || String(res.status));
  }
}
