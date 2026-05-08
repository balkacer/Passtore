import type { CredentialDto } from '@passtore/core';
import { decryptSensitive } from '@/services/encryption/encryptionService';

export async function isPlainPasswordDuplicate(
  plain: string,
  vaultKey: string,
  items: CredentialDto[],
  excludeId?: string,
): Promise<boolean> {
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
      /* skip unreadable */
    }
  }
  return false;
}
