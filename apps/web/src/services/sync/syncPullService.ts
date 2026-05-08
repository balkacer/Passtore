import type { SyncPullApiResponse } from '@passtore/core';
import { USE_LOCAL_VAULT, USE_SYNC_OUTBOX } from '@/config/featureFlags';
import { getApiBaseUrl } from '@/lib/config';
import { getJwt } from '@/lib/webSecureStorage';
import { getDevicePublicId } from '@/services/sync/devicePublicId';
import { getSyncPullCursor, setSyncPullCursor } from '@/services/sync/syncMeta';
import { applySyncEnvelope } from '@/services/sync/syncApply';
import { passtoreApi } from '@/api/passtoreApi';
import { store } from '@/store';

/** Pull remote sync pages and merge into local vault; skips envelopes from this browser. */
export async function pullAndApplyRemoteSync(): Promise<void> {
  if (!USE_LOCAL_VAULT || !USE_SYNC_OUTBOX) {
    return;
  }
  const token = getJwt();
  if (!token) {
    return;
  }

  const base = getApiBaseUrl().replace(/\/$/, '');
  const mine = await getDevicePublicId();
  const skip = new Set([mine]);
  let cursor = await getSyncPullCursor();

  for (;;) {
    const url = new URL(`${base}/sync/events`);
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }
    url.searchParams.set('limit', '100');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return;
    }

    const data = (await res.json()) as SyncPullApiResponse;
    if (data.events.length === 0) {
      break;
    }

    for (const ev of data.events) {
      await applySyncEnvelope(ev, { skipDeviceIds: skip });
    }

    if (data.nextCursor) {
      cursor = data.nextCursor;
      await setSyncPullCursor(data.nextCursor);
    }

    if (data.events.length < 100) {
      break;
    }
  }

  store.dispatch(passtoreApi.util.invalidateTags([{ type: 'Credential', id: 'LIST' }]));
}
