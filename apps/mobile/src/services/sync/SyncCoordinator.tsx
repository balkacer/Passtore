import { useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@/store/zustand/authStore';
import { getApiBaseUrl } from '@/config/env';
import { USE_SYNC_OUTBOX, USE_SYNC_SOCKET } from '@/config/featureFlags';
import { connectSyncSocket, disconnectSyncSocket } from '@/services/sync/syncSocket';
import { flushSyncOutbox } from '@/services/sync/syncOutboxWorker';
import { pullAndApplyRemoteSync } from '@/services/sync/syncPullService';

/**
 * Keeps Socket.IO connected (JWT), flushes outbox on net/interval, pulls remote events on hints.
 */
export function SyncCoordinator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);

  const runSync = useCallback(() => {
    void flushSyncOutbox().then(() => pullAndApplyRemoteSync());
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
    void flushSyncOutbox();
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
