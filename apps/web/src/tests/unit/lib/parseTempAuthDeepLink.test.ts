import { describe, expect, it } from 'vitest';
import { parseTempAuthDeepLink } from '@/lib/parseTempAuthDeepLink';

describe('parseTempAuthDeepLink', () => {
  it('parses canonical pairing URL (sid + code)', () => {
    const r = parseTempAuthDeepLink(
      'passtore://temp-auth/pairing?sid=s1&code=abc',
    );
    expect(r).toEqual({
      kind: 'pairing',
      sessionId: 's1',
      pairingCode: 'abc',
    });
  });

  it('accepts PASSTORE scheme case-insensitively', () => {
    const r = parseTempAuthDeepLink(
      'PASSTORE://temp-auth/pairing?sid=x&code=y',
    );
    expect(r).toMatchObject({ kind: 'pairing', sessionId: 'x', pairingCode: 'y' });
  });

  it('accepts sessionId alias in query', () => {
    const r = parseTempAuthDeepLink(
      'passtore://temp-auth/pairing?sessionId=alt&code=z',
    );
    expect(r).toEqual({
      kind: 'pairing',
      sessionId: 'alt',
      pairingCode: 'z',
    });
  });

  it('decodes percent-encoded query values', () => {
    const r = parseTempAuthDeepLink(
      'passtore://temp-auth/pairing?sid=a%2Fb&code=c%20d',
    );
    expect(r).toEqual({
      kind: 'pairing',
      sessionId: 'a/b',
      pairingCode: 'c d',
    });
  });

  it('parses delivery URL', () => {
    const r = parseTempAuthDeepLink(
      'passtore://temp-auth/delivery?requestId=req-1',
    );
    expect(r).toEqual({ kind: 'delivery', requestId: 'req-1' });
  });

  it('returns null for wrong host', () => {
    expect(
      parseTempAuthDeepLink('passtore://other/pairing?sid=1&code=2'),
    ).toBeNull();
  });

  it('returns null for wrong path', () => {
    expect(
      parseTempAuthDeepLink('passtore://temp-auth/other?sid=1&code=2'),
    ).toBeNull();
  });

  it('returns null when pairing params missing', () => {
    expect(parseTempAuthDeepLink('passtore://temp-auth/pairing?sid=only')).toBeNull();
    expect(parseTempAuthDeepLink('passtore://temp-auth/pairing?code=only')).toBeNull();
  });

  it('returns null when delivery requestId missing', () => {
    expect(parseTempAuthDeepLink('passtore://temp-auth/delivery')).toBeNull();
  });

  it('returns null for non-passtore schemes', () => {
    expect(parseTempAuthDeepLink('https://example.com')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseTempAuthDeepLink('')).toBeNull();
    expect(parseTempAuthDeepLink('   ')).toBeNull();
  });

  it('trims surrounding whitespace', () => {
    const r = parseTempAuthDeepLink(
      '  passtore://temp-auth/pairing?sid=s&code=c  ',
    );
    expect(r).toMatchObject({ kind: 'pairing', sessionId: 's', pairingCode: 'c' });
  });
});
