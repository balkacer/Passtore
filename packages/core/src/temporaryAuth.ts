export type TemporaryAuthContextType =
  | 'browser'
  | 'extension'
  | 'autofill'
  | 'desktop'
  | 'web';

export type TemporaryAuthSessionStatus =
  | 'pending_pairing'
  | 'active'
  | 'revoked'
  | 'expired';

export type TemporaryCredentialRequestPurpose =
  | 'autofill'
  | 'copy'
  | 'reveal';

export interface InitTemporaryPairingBody {
  requestingDeviceName: string;
  contextType: TemporaryAuthContextType;
  allowedOrigin: string;
  permissions?: Record<string, unknown>;
}

export interface InitTemporaryPairingResponse {
  sessionId: string;
  pairingCode: string;
  pairingExpiresAt: string;
  deepLink: string;
  qrPayload: { v: number; sid: string; code: string };
}

export type PollTemporaryPairingResponse =
  | {
      status: Exclude<TemporaryAuthSessionStatus, 'active'>;
      temporaryAccessToken: null;
    }
  | {
      status: 'active';
      temporaryAccessToken: string;
      expiresAt: string;
    };

export interface ApproveTemporaryPairingBody {
  pairingCode: string;
  devicePublicId: string;
  biometricAssertion?: string;
}

export interface ApproveTemporaryPairingResponse {
  sessionId: string;
  temporaryAccessToken: string;
  expiresAt: string;
}

export interface TemporaryAuthSessionDto {
  id: string;
  userId: string | null;
  approvedByDeviceId: string | null;
  requestingDeviceName: string;
  contextType: TemporaryAuthContextType;
  allowedOrigin: string;
  permissions: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  status: TemporaryAuthSessionStatus;
  pairingExpiresAt: string | null;
  deliveryCount: number;
}

export interface DeliverTemporaryCredentialBody {
  credentialId: string;
  requestedOrigin: string;
  purpose: TemporaryCredentialRequestPurpose;
}

export type DeliverTemporaryCredentialResponse =
  | {
      needsApproval: true;
      requestId: string;
      expiresAt: string;
      approvalDeepLink: string;
    }
  | {
      needsApproval: false;
      credential: {
        id: string;
        alias: string;
        platformName: string;
        url: string | null;
        loginUsername: string;
        encryptedPassword: string;
        notesEncrypted: string | null;
      };
    };

export type PollTemporaryDeliveryResponse =
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'rejected' }
  | { status: string }
  | { status: 'already_delivered' }
  | {
      status: 'ready';
      credential: {
        id: string;
        alias: string;
        platformName: string;
        url: string | null;
        loginUsername: string;
        encryptedPassword: string;
        notesEncrypted: string | null;
      };
    };
