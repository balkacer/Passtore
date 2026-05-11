/**
 * Feature flags — cofre local + sync.
 *
 * En `__DEV__` todo va activo. En release, exporta variables de entorno **antes del bundle**:
 * `PASSTORE_USE_LOCAL_VAULT=true` (y opcionalmente `PASSTORE_USE_SYNC_OUTBOX`, `PASSTORE_USE_SYNC_SOCKET`).
 * Babel las inserta en tiempo de compilación (`babel-plugin-transform-inline-environment-variables`).
 */
export const USE_LOCAL_VAULT =
  __DEV__ || process.env.PASSTORE_USE_LOCAL_VAULT === 'true';

export const USE_SYNC_OUTBOX =
  USE_LOCAL_VAULT &&
  (__DEV__ ||
    (process.env.PASSTORE_USE_SYNC_OUTBOX !== 'false' &&
      process.env.PASSTORE_USE_SYNC_OUTBOX !== '0'));

export const USE_SYNC_SOCKET =
  USE_LOCAL_VAULT &&
  (__DEV__ ||
    (process.env.PASSTORE_USE_SYNC_SOCKET !== 'false' &&
      process.env.PASSTORE_USE_SYNC_SOCKET !== '0'));
