/**
 * Map local vault rows to @passtore/core index rows and rank for autofill.
 * Uses normalized_origin from SQLite when present; otherwise derives from url.
 */
import type { CredentialIndexRow } from '@passtore/core';
import type { CredentialDto } from '@passtore/core';
import {
  normalizeOrigin,
  rankCredentialsForFill,
  type FillContext,
} from '@/services/autofill/autofillMatchingEngine';

export type { FillContext };

export function credentialDtoToIndexRow(dto: CredentialDto): CredentialIndexRow {
  const normalizedOrigin =
    dto.normalizedOrigin ??
    (dto.url ? normalizeOrigin(dto.url) : null);
  return {
    id: dto.id,
    alias: dto.alias,
    normalizedOrigin,
    platformName: dto.platformName,
    usernamePreview: dto.loginUsername,
    updatedAt: dto.updatedAt,
  };
}

/** Rank vault credentials for a fill context (metadata only; no decryption). */
export function rankVaultCredentialsForAutofill(
  credentials: CredentialDto[],
  ctx: FillContext,
) {
  const rows = credentials.map(credentialDtoToIndexRow);
  return rankCredentialsForFill(rows, ctx);
}
