/**
 * iOS Credential Provider Extension bridge (ASCredentialIdentityStore).
 * See docs/AUTOFILL_PLATFORM_ARCHITECTURE.md
 */
export const credentialProviderService = {
  /** Push non-secret identity rows for QuickType bar */
  async syncIdentities(): Promise<void> {
    /* no-op until extension target */
  },

  async removeIdentity(_credentialId: string): Promise<void> {
    /* no-op */
  },
};
