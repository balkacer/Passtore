import * as Keychain from 'react-native-keychain';
import { generateVaultKey } from '../encryption/encryptionService';

const JWT_SERVICE = 'com.passtore.auth.jwt';
const VAULT_KEY_SERVICE = 'com.passtore.vault.key';

export async function saveJwt(token: string): Promise<void> {
  await Keychain.setGenericPassword('jwt', token, { service: JWT_SERVICE });
}

export async function getJwt(): Promise<string | null> {
  const creds = await Keychain.getGenericPassword({ service: JWT_SERVICE });
  return creds ? creds.password : null;
}

export async function clearJwt(): Promise<void> {
  await Keychain.resetGenericPassword({ service: JWT_SERVICE });
}

/** Stores vault encryption material in the secure enclave / Keystore. */
export async function saveVaultKey(key: string): Promise<void> {
  await Keychain.setGenericPassword('vault', key, {
    service: VAULT_KEY_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getVaultKey(): Promise<string | null> {
  const creds = await Keychain.getGenericPassword({ service: VAULT_KEY_SERVICE });
  return creds ? creds.password : null;
}

export async function ensureVaultKey(): Promise<string> {
  const existing = await getVaultKey();
  if (existing) {
    return existing;
  }
  const key = generateVaultKey();
  await saveVaultKey(key);
  return key;
}

export async function clearVaultKey(): Promise<void> {
  await Keychain.resetGenericPassword({ service: VAULT_KEY_SERVICE });
}
