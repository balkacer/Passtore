/**
 * Local-first vault + sync (IndexedDB + `/sync/events`).
 * En desarrollo van activados por defecto. En producción, opt-in con variables `VITE_*`.
 */

function envBoolean(
  raw: string | boolean | undefined,
  whenUnset: boolean,
): boolean {
  if (raw === undefined || raw === '') {
    return whenUnset;
  }
  if (raw === true) {
    return true;
  }
  if (raw === false) {
    return false;
  }
  const s = String(raw).trim().toLowerCase();
  if (['0', 'false', 'no', 'off'].includes(s)) {
    return false;
  }
  if (['1', 'true', 'yes', 'on'].includes(s)) {
    return true;
  }
  return whenUnset;
}

/** Cofre en IndexedDB + RTK que no usa `GET/POST /credentials` del servidor. */
export const USE_LOCAL_VAULT =
  import.meta.env.DEV ||
  envBoolean(import.meta.env.VITE_USE_LOCAL_VAULT as string | undefined, false);

/** Cola outbox → POST `/sync/events`. */
export const USE_SYNC_OUTBOX =
  USE_LOCAL_VAULT &&
  envBoolean(import.meta.env.VITE_USE_SYNC_OUTBOX as string | undefined, true);

/** Socket.IO para avisos de cambio en vault (pull + flush). */
export const USE_SYNC_SOCKET =
  USE_LOCAL_VAULT &&
  envBoolean(import.meta.env.VITE_USE_SYNC_SOCKET as string | undefined, true);
