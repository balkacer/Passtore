import { decryptSensitive } from '@passtore/vault-crypto';

export function isPlainPasswordDuplicate(
  plain: string,
  vaultKey: string,
  items: { id: string; encryptedPassword: string }[],
  excludeId?: string,
): boolean {
  for (const c of items) {
    if (excludeId && c.id === excludeId) {
      continue;
    }
    try {
      const existing = decryptSensitive(c.encryptedPassword, vaultKey);
      if (existing === plain) {
        return true;
      }
    } catch {
      /* skip rows we cannot decrypt */
    }
  }
  return false;
}
