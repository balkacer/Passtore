import type { CredentialDto, SyncEnvelopeApi } from '@passtore/core';
import { getVaultRepository } from '@/services/vault/vaultRepository';

export async function applySyncEnvelope(
  env: SyncEnvelopeApi,
  opts: { skipDeviceIds: Set<string> },
): Promise<void> {
  if (opts.skipDeviceIds.has(env.deviceId)) {
    return;
  }

  if (env.type === 'VAULT_ITEM_DELETE') {
    try {
      const parsed = JSON.parse(env.ciphertextPayload) as { credentialId?: string };
      if (parsed.credentialId) {
        await getVaultRepository().delete(parsed.credentialId);
      }
    } catch {
      /* ignore malformed */
    }
    return;
  }

  if (env.type === 'VAULT_ITEM_UPSERT') {
    try {
      const outer = JSON.parse(env.ciphertextPayload) as {
        v?: number;
        kind?: string;
        credential?: CredentialDto;
      };
      if (outer.v === 1 && outer.kind === 'credential_row' && outer.credential) {
        await getVaultRepository().replaceCredential(outer.credential);
      }
    } catch {
      /* ignore */
    }
  }
}
