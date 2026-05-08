import {
  CONTRACT_CIPHERTEXT,
  CONTRACT_PLAINTEXT,
  CONTRACT_VAULT_KEY,
} from '@passtore/crypto-contract';
import {
  decryptSensitive,
  encryptSensitive,
} from '@passtore/vault-crypto';

describe('crypto contract — interoperabilidad con web y CLI', () => {
  it('descifra el ciphertext fijo generado con CryptoJS (referencia)', () => {
    expect(
      decryptSensitive(CONTRACT_CIPHERTEXT, CONTRACT_VAULT_KEY),
    ).toBe(CONTRACT_PLAINTEXT);
  });

  it('round-trip local con el mismo plaintext que el contrato', () => {
    const cipher = encryptSensitive(CONTRACT_PLAINTEXT, CONTRACT_VAULT_KEY);
    expect(decryptSensitive(cipher, CONTRACT_VAULT_KEY)).toBe(
      CONTRACT_PLAINTEXT,
    );
  });
});
