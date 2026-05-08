import CryptoJS from 'crypto-js';

/**
 * Vault field encryption (passwords, notes) using CryptoJS AES with the default
 * password-based serialization (OpenSSL salted). All Passtore clients must use
 * this module so ciphertext interoperates across web, mobile, and CLI.
 */

export function encryptSensitive(plainText: string, vaultKey: string): string {
  return CryptoJS.AES.encrypt(plainText, vaultKey).toString();
}

export function decryptSensitive(cipherText: string, vaultKey: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, vaultKey);
  const plain = bytes.toString(CryptoJS.enc.Utf8);
  if (!plain) {
    throw new Error(
      'Unable to decrypt — invalid vault key or corrupted ciphertext.',
    );
  }
  return plain;
}

/** Random vault key material (hex), same representation across clients. */
export function generateVaultKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}
