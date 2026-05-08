/**
 * Feature flags — toggles while migrating to local-first vault + sync.
 *
 * `USE_LOCAL_VAULT`: credentials CRUD uses SQLite on-device (`VaultRepository`)
 * instead of `GET/POST /credentials`. Auth, profile, passkeys still hit the API.
 *
 * `USE_SYNC_OUTBOX` / `USE_SYNC_SOCKET`: push queue + Socket.IO hints + pull apply (Phase 3).
 */
export const USE_LOCAL_VAULT = __DEV__;
export const USE_SYNC_OUTBOX = __DEV__ && USE_LOCAL_VAULT;
export const USE_SYNC_SOCKET = __DEV__ && USE_LOCAL_VAULT;
