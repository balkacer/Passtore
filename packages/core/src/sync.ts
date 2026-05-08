/** Server sync envelope — `deviceId` is the client's devicePublicId. */
export interface SyncEnvelopeApi {
  id: string;
  userId: string;
  deviceId: string;
  type: string;
  baseRevision?: string;
  ciphertextPayload: string;
  contentHash?: string;
  createdAt: string;
}

export interface SyncPullApiResponse {
  events: SyncEnvelopeApi[];
  nextCursor: string;
  serverTime: string;
}

export interface PushSyncEventBody {
  devicePublicId: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  type: string;
  ciphertextPayload: string;
  baseRevision?: string;
  contentHash?: string;
  /** Credential id — sync concurrency */
  itemKey?: string;
  /** Expected server row version before this mutation */
  baseRowVersion?: number;
  /** Row version after local mutation */
  newRowVersion?: number;
  /** Skip server conflict checks after user confirmation */
  force?: boolean;
}

export interface RegisterDeviceBody {
  devicePublicId: string;
  name?: string;
  platform?: string;
  appVersion?: string;
}

export interface RegisteredDeviceDto {
  id: string;
  userId: string;
  devicePublicId: string;
  name: string | null;
  platform: string | null;
  appVersion: string | null;
  lastSeenAt: string;
  createdAt: string;
}
