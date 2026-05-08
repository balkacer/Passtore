/**
 * Local-first vault + sync (same protocol as mobile). IndexedDB + REST sync endpoints.
 */
export const USE_LOCAL_VAULT = import.meta.env.DEV;
export const USE_SYNC_OUTBOX = import.meta.env.DEV && USE_LOCAL_VAULT;
export const USE_SYNC_SOCKET = import.meta.env.DEV && USE_LOCAL_VAULT;
