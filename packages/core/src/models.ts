export type SecurityIndicator =
  | 'strong'
  | 'weak'
  | 'duplicate'
  | 'compromised';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
}

/** Payload for creating/updating a credential (already encrypted fields from UI). */
export interface CreateCredentialBody {
  alias: string;
  platformName: string;
  url?: string;
  loginUsername: string;
  encryptedPassword: string;
  iconUrl?: string;
  notesEncrypted?: string;
  strengthScore?: number;
  isDuplicate?: boolean;
  category?: string;
}

export interface CredentialDto {
  id: string;
  alias: string;
  platformName: string;
  url: string | null;
  /** Normalized origin for autofill matching (persisted in local vault). */
  normalizedOrigin?: string | null;
  loginUsername: string;
  encryptedPassword: string;
  iconUrl: string | null;
  notesEncrypted: string | null;
  strengthScore: number | null;
  isDuplicate: boolean;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  /** Row version for optimistic sync / conflict detection (local vault). */
  version?: number;
}
