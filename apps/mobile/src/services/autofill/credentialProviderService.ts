/**
 * Bridge to ASCredentialIdentityStore (iOS) / Android Autofill index.
 * Native module: `PasstoreAutofill` (see mobile/ios + android autofill package).
 */
import { NativeModules, Platform } from 'react-native';
import type { CredentialDto } from '@passtore/core';

type PasstoreAutofillNative = {
  replaceIdentity?: (payload: Record<string, string>) => Promise<boolean>;
  removeIdentity?: (credentialId: string) => Promise<boolean>;
};

const native = NativeModules.PasstoreAutofill as PasstoreAutofillNative | undefined;

function payloadFromDto(c: CredentialDto): Record<string, string> {
  return {
    id: c.id,
    loginUsername: c.loginUsername,
    normalizedOrigin: c.normalizedOrigin ?? '',
    url: c.url ?? '',
    alias: c.alias,
  };
}

export const credentialProviderService = {
  async replaceIdentityForCredential(credential: CredentialDto): Promise<void> {
    if (!native?.replaceIdentity) {
      return;
    }
    try {
      await native.replaceIdentity(payloadFromDto(credential));
    } catch (e) {
      if (__DEV__) {
        console.warn('[PasstoreAutofill] replaceIdentity', Platform.OS, e);
      }
    }
  },

  async removeIdentityForCredentialId(credentialId: string): Promise<void> {
    if (!native?.removeIdentity) {
      return;
    }
    try {
      await native.removeIdentity(credentialId);
    } catch (e) {
      if (__DEV__) {
        console.warn('[PasstoreAutofill] removeIdentity', Platform.OS, e);
      }
    }
  },
};
