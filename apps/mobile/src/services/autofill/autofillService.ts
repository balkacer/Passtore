/**
 * OS autofill integration facade.
 * Wire Android AutofillService / iOS ASCredentialIdentityStore here.
 * Architecture: docs/AUTOFILL_PLATFORM_ARCHITECTURE.md
 */
import type { CredentialDto } from '@passtore/core';
import { credentialProviderService } from '@/services/autofill/credentialProviderService';

export const autofillService = {
  /** Called after local save when identities should be mirrored to the OS */
  async registerCredential(credential?: CredentialDto): Promise<void> {
    if (credential) {
      await credentialProviderService.replaceIdentityForCredential(credential);
    }
  },

  async unregisterCredential(credentialId: string): Promise<void> {
    await credentialProviderService.removeIdentityForCredentialId(credentialId);
  },

  /** Invalidate suggestions after bulk changes */
  async invalidateCache(): Promise<void> {
    /* native: clear OS-side caches when implemented */
  },
};
