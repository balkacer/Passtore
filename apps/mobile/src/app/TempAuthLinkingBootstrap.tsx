import { useEffect } from 'react';
import { Linking } from 'react-native';
import { parseTempAuthDeepLink } from '@/navigation/parseTempAuthUrl';
import { useTempAuthDeepLinkStore } from '@/store/zustand/tempAuthDeepLinkStore';

/** Registers passtore:// handlers (cold start + foreground). */
export function TempAuthLinkingBootstrap() {
  const setPendingPairing = useTempAuthDeepLinkStore((s) => s.setPendingPairing);
  const setPendingDelivery = useTempAuthDeepLinkStore((s) => s.setPendingDelivery);

  useEffect(() => {
    const consume = (url: string | null) => {
      if (!url) {
        return;
      }
      const parsed = parseTempAuthDeepLink(url);
      if (!parsed) {
        return;
      }
      if (parsed.kind === 'pairing') {
        setPendingPairing({
          sessionId: parsed.sessionId,
          pairingCode: parsed.pairingCode,
        });
      } else {
        setPendingDelivery({ requestId: parsed.requestId });
      }
    };

    void Linking.getInitialURL().then(consume);
    const sub = Linking.addEventListener('url', (e) => consume(e.url));
    return () => sub.remove();
  }, [setPendingDelivery, setPendingPairing]);

  return null;
}
