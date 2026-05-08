import { parseTempAuthDeepLink } from '@/navigation/parseTempAuthUrl';

describe('parseTempAuthDeepLink', () => {
  it('parses pairing query', () => {
    const r = parseTempAuthDeepLink(
      'passtore://temp-auth/pairing?sid=uuid-1&code=secret%2Bcode',
    );
    expect(r).toEqual({
      kind: 'pairing',
      sessionId: 'uuid-1',
      pairingCode: 'secret+code',
    });
  });

  it('parses delivery query', () => {
    const r = parseTempAuthDeepLink(
      'passtore://temp-auth/delivery?requestId=req-99',
    );
    expect(r).toEqual({ kind: 'delivery', requestId: 'req-99' });
  });

  it('returns null for other schemes', () => {
    expect(parseTempAuthDeepLink('https://evil.com')).toBeNull();
  });
});
