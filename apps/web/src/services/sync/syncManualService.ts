import { USE_LOCAL_VAULT, USE_SYNC_OUTBOX } from '@/config/featureFlags';
import { flushSyncOutbox } from '@/services/sync/syncOutboxWorker';
import { pullAndApplyRemoteSync } from '@/services/sync/syncPullService';

export type VaultSyncResult =
  | { ok: true }
  | { ok: false; message: string };

/** Sube cambios locales pendientes y aplica eventos remotos en el cofre local. */
export async function runFullVaultSync(): Promise<VaultSyncResult> {
  if (!USE_LOCAL_VAULT) {
    return {
      ok: false,
      message:
        'Cofre local desactivado. En producción define VITE_USE_LOCAL_VAULT=true o usa `npm run dev`.',
    };
  }
  if (!USE_SYNC_OUTBOX) {
    return {
      ok: false,
      message: 'Cola de sincronización desactivada (VITE_USE_SYNC_OUTBOX).',
    };
  }
  await flushSyncOutbox();
  await pullAndApplyRemoteSync();
  return { ok: true };
}
