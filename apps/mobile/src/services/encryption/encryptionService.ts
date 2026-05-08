/** Re-export vault crypto so feature code can keep `@/services/encryption/*` imports. */
export {
  decryptSensitive,
  encryptSensitive,
  generateVaultKey,
} from '@passtore/vault-crypto';
