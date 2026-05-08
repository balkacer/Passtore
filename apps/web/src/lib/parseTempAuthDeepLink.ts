/** Igual que `apps/mobile` — URLs `passtore://temp-auth/...` para pairing y delivery. */

export type ParsedTempAuthUrl =
  | { kind: 'pairing'; sessionId: string; pairingCode: string }
  | { kind: 'delivery'; requestId: string };

export function parseTempAuthDeepLink(url: string): ParsedTempAuthUrl | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const trimmed = url.trim();
  if (!/^passtore:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const path = (u.pathname || '/').replace(/^\/+/, '');
    if (host === 'temp-auth' && path === 'pairing') {
      const sessionId = u.searchParams.get('sid') ?? u.searchParams.get('sessionId');
      const pairingCode = u.searchParams.get('code');
      if (sessionId && pairingCode) {
        return {
          kind: 'pairing',
          sessionId,
          pairingCode,
        };
      }
    }
    if (host === 'temp-auth' && path === 'delivery') {
      const requestId = u.searchParams.get('requestId');
      if (requestId) {
        return { kind: 'delivery', requestId };
      }
    }
  } catch {
    return null;
  }
  return null;
}
