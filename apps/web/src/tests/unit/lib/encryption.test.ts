import { describe, expect, it } from 'vitest';
import { decryptSensitive, encryptSensitive } from '@passtore/vault-crypto';

describe('encryptSensitive / decryptSensitive', () => {
  it('round-trips plaintext', () => {
    const key = 'vault-key-test';
    const plain = 'secret-note';
    const cipher = encryptSensitive(plain, key);
    expect(cipher).not.toContain(plain);
    expect(decryptSensitive(cipher, key)).toBe(plain);
  });

  it('throws when key is wrong', () => {
    const cipher = encryptSensitive('x', 'good-key');
    expect(() => decryptSensitive(cipher, 'wrong-key')).toThrow(/decrypt/i);
  });
});
