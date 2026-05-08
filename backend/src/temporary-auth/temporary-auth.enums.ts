export enum TemporaryAuthSessionStatus {
  PENDING_PAIRING = 'pending_pairing',
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum TemporaryAuthContextType {
  BROWSER = 'browser',
  EXTENSION = 'extension',
  AUTOFILL = 'autofill',
  DESKTOP = 'desktop',
  WEB = 'web',
}

export enum TemporaryCredentialRequestPurpose {
  AUTOFILL = 'autofill',
  COPY = 'copy',
  REVEAL = 'reveal',
}

export enum TemporaryCredentialRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum TemporaryAuthAuditActor {
  REQUESTING_CLIENT = 'requesting_client',
  PRIMARY_DEVICE = 'primary_device',
  SYSTEM = 'system',
}
