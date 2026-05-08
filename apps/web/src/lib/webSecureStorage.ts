/**
 * Almacenamiento web: JWT en sessionStorage (desaparece al cerrar pestaña).
 * Material de bóveda en localStorage — mismo modelo de riesgo XSS que cualquier SPA.
 */

import { generateVaultKey } from '@passtore/vault-crypto';

const JWT_KEY = 'passtore.jwt';
const VAULT_KEY = 'passtore.vault.key';

export function saveJwt(token: string): void {
  sessionStorage.setItem(JWT_KEY, token);
}

export function getJwt(): string | null {
  return sessionStorage.getItem(JWT_KEY);
}

export function clearJwt(): void {
  sessionStorage.removeItem(JWT_KEY);
}

export function saveVaultKey(key: string): void {
  localStorage.setItem(VAULT_KEY, key);
}

export function getVaultKey(): string | null {
  return localStorage.getItem(VAULT_KEY);
}

export function clearVaultKey(): void {
  localStorage.removeItem(VAULT_KEY);
}

export function ensureVaultKey(): string {
  let key = getVaultKey();
  if (!key) {
    key = generateVaultKey();
    saveVaultKey(key);
  }
  return key;
}
