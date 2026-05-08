import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/zustand/authStore';
import { useTempAuthDeepLinkStore } from '@/store/zustand/tempAuthDeepLinkStore';
import { navigationRootRef } from '@/navigation/navigationRootRef';

/** Navigates to temp-auth screens once JWT + navigator are ready (e.g. after login). */
export function TempAuthNavigationEffects() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.accessToken);
  const pendingPairing = useTempAuthDeepLinkStore((s) => s.pendingPairing);
  const pendingDelivery = useTempAuthDeepLinkStore((s) => s.pendingDelivery);
  const clearPendingPairing = useTempAuthDeepLinkStore((s) => s.clearPendingPairing);
  const clearPendingDelivery = useTempAuthDeepLinkStore((s) => s.clearPendingDelivery);
  const attempts = useRef(0);

  useEffect(() => {
    if (!hydrated || !token) {
      return;
    }
    if (!pendingPairing && !pendingDelivery) {
      attempts.current = 0;
      return;
    }

    const run = () => {
      if (!navigationRootRef.isReady()) {
        return false;
      }
      if (pendingPairing) {
        navigationRootRef.navigate('TempAuthPairing', {
          sessionId: pendingPairing.sessionId,
          pairingCode: pendingPairing.pairingCode,
        });
        clearPendingPairing();
        attempts.current = 0;
        return true;
      }
      if (pendingDelivery) {
        navigationRootRef.navigate('TempAuthDelivery', {
          requestId: pendingDelivery.requestId,
        });
        clearPendingDelivery();
        attempts.current = 0;
        return true;
      }
      return false;
    };

    if (run()) {
      return;
    }

    const id = setInterval(() => {
      attempts.current += 1;
      if (attempts.current > 120) {
        clearInterval(id);
        return;
      }
      if (run()) {
        clearInterval(id);
      }
    }, 50);

    return () => clearInterval(id);
  }, [
    clearPendingDelivery,
    clearPendingPairing,
    hydrated,
    pendingDelivery,
    pendingPairing,
    token,
  ]);

  return null;
}
