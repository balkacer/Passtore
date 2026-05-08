/**
 * Facade for vault key lifecycle — delegates to {@link secureStorageService}.
 * Single source of truth for DEK storage is Keychain/Keystore (`ensureVaultKey`).
 *
 * See docs/VAULT_CLIENT_SERVICES.md
 */
import * as SecureStorage from '@/services/secure-storage/secureStorageService';

export const keyManagementService = {
  getOrCreateVaultKey: SecureStorage.ensureVaultKey,
  getVaultKey: SecureStorage.getVaultKey,
  clearVaultKey: SecureStorage.clearVaultKey,
};
