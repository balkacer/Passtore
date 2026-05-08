import {
  decryptSensitive,
  encryptSensitive,
  generateVaultKey,
} from '@/services/encryption/encryptionService';

describe('encryptionService', () => {
  it('roundtrips text', () => {
    const key = generateVaultKey();
    const plain = 'secret-password-123';
    const cipher = encryptSensitive(plain, key);
    expect(cipher).not.toContain(plain);
    expect(decryptSensitive(cipher, key)).toBe(plain);
  });
});
