import { useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@/store/zustand/authStore';
import { getApiBaseUrl } from '@/config/env';
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
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        runSync();
      }
    });
    const interval = setInterval(() => runSync(), 30000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [hydrated, token, runSync]);

  return null;
}
