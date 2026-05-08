/**
 * Minimal metadata row for ranking credentials for autofill (no secrets).
 * Populated from local vault after unlock; used by pure matching logic.
 */
export interface CredentialIndexRow {
  id: string;
  alias: string;
  normalizedOrigin: string | null;
  platformName: string;
  /** Login/username preview for UI ordering; optional in tests. */
  usernamePreview?: string;
  updatedAt: string;
}
