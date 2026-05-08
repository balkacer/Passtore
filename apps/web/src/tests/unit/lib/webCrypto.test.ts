import { describe, expect, it } from 'vitest';
import { sha256Hex } from '@/lib/webCrypto';

describe('webCrypto', () => {
  it('sha256Hex matches known vector', async () => {
    const enc = new TextEncoder();
    const hex = await sha256Hex(enc.encode('passtore'));
    expect(hex).toHaveLength(64);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });
});
