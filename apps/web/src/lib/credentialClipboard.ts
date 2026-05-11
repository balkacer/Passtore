import type { CredentialDto } from '@passtore/core';
import { decryptSensitive } from '@passtore/vault-crypto';
import { getVaultKey } from '@/lib/webSecureStorage';

export type CopyPasswordResult =
  | { ok: true }
  | { ok: false; reason: 'no_vault_key' | 'decrypt_failed' | 'clipboard_failed' };

/** Decrypts and writes password to clipboard; schedules clipboard clear like detail page. */
export async function copyCredentialPassword(
  row: CredentialDto,
): Promise<CopyPasswordResult> {
  const key = getVaultKey();
  if (!key) {
    return { ok: false, reason: 'no_vault_key' };
  }
  let plain: string;
  try {
    plain = decryptSensitive(row.encryptedPassword, key);
  } catch {
    return { ok: false, reason: 'decrypt_failed' };
  }
  try {
    await navigator.clipboard.writeText(plain);
  } catch {
    return { ok: false, reason: 'clipboard_failed' };
  }
  window.setTimeout(() => {
    navigator.clipboard.writeText('').catch(() => {});
  }, 45_000);
  return { ok: true };
}
