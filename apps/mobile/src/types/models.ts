import type { CredentialDto, SecurityIndicator } from '@passtore/core';

/** Runtime model with decrypted fields only held transiently in memory. */
export interface CredentialView extends CredentialDto {
  security: SecurityIndicator;
}
