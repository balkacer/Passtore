import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getApiBaseUrl } from '@/lib/config';
import { USE_SYNC_OUTBOX, USE_SYNC_SOCKET } from '@/config/featureFlags';
import { connectSyncSocket, disconnectSyncSocket } from '@/services/sync/syncSocket';
import { runFullVaultSync } from '@/services/sync/syncManualService';

/**
 * Socket.IO + flush/pull periódico cuando el cofre local y la cola de sync están activos.
 */
export function SyncCoordinator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  const runSync = useCallback(() => {
    void runFullVaultSync();
  }, []);

  useEffect(() => {
    if (!hydrated || !token || !USE_SYNC_SOCKET) {
      disconnectSyncSocket();
      return;
    }
    const api = getApiBaseUrl();
    connectSyncSocket(api, token, runSync);
    return () => disconnectSyncSocket();
  }, [hydrated, token, runSync]);

  useEffect(() => {
    if (!hydrated || !token || !USE_SYNC_OUTBOX) {
      return;
    }
    void runSync();
    const onOnline = () => runSync();
    window.addEventListener('online', onOnline);
    const interval = setInterval(() => runSync(), 30000);
    return () => {
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, [hydrated, token, runSync]);

  return null;
}
