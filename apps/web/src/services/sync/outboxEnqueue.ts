import type { CredentialDto, PushSyncEventBody } from '@passtore/core';
import { USE_SYNC_OUTBOX } from '@/config/featureFlags';
import { getDevicePublicId } from '@/services/sync/devicePublicId';
import { getOutboxRepository } from '@/services/sync/outboxRepository';

const APP_VERSION = '0.0.1';

function wrapCredentialPayload(credential: CredentialDto): string {
  return JSON.stringify({
    v: 1,
    kind: 'credential_row',
    credential,
  });
}

export async function enqueueVaultUpsert(
  credential: CredentialDto,
  opts?: { baseRowVersion?: number },
): Promise<void> {
  if (!USE_SYNC_OUTBOX) {
    return;
  }
  const devicePublicId = await getDevicePublicId();
  const baseRv = opts?.baseRowVersion ?? 0;
  const newRv = credential.version ?? 1;
  const body: PushSyncEventBody = {
    devicePublicId,
    platform: 'web',
    appVersion: APP_VERSION,
    type: 'VAULT_ITEM_UPSERT',
    ciphertextPayload: wrapCredentialPayload(credential),
    itemKey: credential.id,
    baseRowVersion: baseRv,
    newRowVersion: newRv,
  };
  await getOutboxRepository().enqueue(body);
}

export async function enqueueVaultDelete(
  credentialId: string,
  opts?: { baseRowVersion?: number },
): Promise<void> {
  if (!USE_SYNC_OUTBOX) {
    return;
  }
  const devicePublicId = await getDevicePublicId();
  const body: PushSyncEventBody = {
    devicePublicId,
    platform: 'web',
    appVersion: APP_VERSION,
    type: 'VAULT_ITEM_DELETE',
    ciphertextPayload: JSON.stringify({ v: 1, credentialId }),
    itemKey: credentialId,
    baseRowVersion: opts?.baseRowVersion,
  };
  await getOutboxRepository().enqueue(body);
}
