import { USE_LOCAL_VAULT, USE_SYNC_OUTBOX } from '@/config/featureFlags';
import { flushSyncOutbox } from '@/services/sync/syncOutboxWorker';
import { pullAndApplyRemoteSync } from '@/services/sync/syncPullService';

export type VaultSyncResult =
  | { ok: true }
  | { ok: false; message: string };

export async function runFullVaultSync(): Promise<VaultSyncResult> {
  if (!USE_LOCAL_VAULT) {
    return {
      ok: false,
      message:
        'Cofre local desactivado. En release define PASSTORE_USE_LOCAL_VAULT=true al compilar o usa un build de desarrollo.',
    };
  }
  if (!USE_SYNC_OUTBOX) {
    return {
      ok: false,
      message: 'Sincronización desactivada (PASSTORE_USE_SYNC_OUTBOX).',
    };
  }
  await flushSyncOutbox();
  await pullAndApplyRemoteSync();
  return { ok: true };
}
