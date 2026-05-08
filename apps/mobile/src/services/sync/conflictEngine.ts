/**
 * Pure helpers for row-version sync conflicts (no React Native).
 * Server stores one logical "head" row version per item (`sync_item_state`).
 */

/** True when the client's expected base does not match the server's head version. */
export function rowVersionsConflict(
  clientBaseRowVersion: number,
  serverHeadRowVersion: number,
): boolean {
  return clientBaseRowVersion !== serverHeadRowVersion;
}

/**
 * Upsert path: if the server has no row yet, the client should use base `0`.
 * If `serverHasRow` is false and `clientBase !== 0`, that is inconsistent (treat as conflict / bad client).
 */
export function upsertBaseMatchesServer(
  serverHasRow: boolean,
  clientBaseRowVersion: number,
  serverHeadRowVersion: number,
): boolean {
  if (!serverHasRow) {
    return clientBaseRowVersion === 0;
  }
  return !rowVersionsConflict(clientBaseRowVersion, serverHeadRowVersion);
}

/** Delete path: client must send the same base as server head when a row exists. */
export function deleteBaseMatchesServer(
  serverHasRow: boolean,
  clientBaseRowVersion: number,
  serverHeadRowVersion: number,
): boolean {
  if (!serverHasRow) {
    return true;
  }
  return !rowVersionsConflict(clientBaseRowVersion, serverHeadRowVersion);
}
