# Vault web (IndexedDB) y sync

La SPA en `apps/web/` puede operar en modo **local-first** alineado con móvil: credenciales en el dispositivo, eventos cifrados en el servidor. Ver [SYNC_API.md](./SYNC_API.md) para el protocolo HTTP.

## Feature flags

Definidos en `apps/web/src/config/featureFlags.ts` (Vite `import.meta.env`):

| Flag | Comportamiento |
|------|----------------|
| `USE_LOCAL_VAULT` | `true` en **desarrollo** (`import.meta.env.DEV`). CRUD vía `VaultRepository` (IndexedDB) en lugar de `GET/POST /credentials`. |
| `USE_SYNC_OUTBOX` | Encola `VAULT_ITEM_UPSERT` / `VAULT_ITEM_DELETE` y `flushSyncOutbox` + `pullAndApplyRemoteSync`. |
| `USE_SYNC_SOCKET` | Conexión Socket.IO a `/sync` para `vault:changed` (mismo patrón que móvil). |

En **producción** (`npm run build`) los flags están en `false`, por lo que la web sigue usando el API REST de credenciales legacy hasta que se active explícitamente (p. ej. con variables de entorno en el futuro).

## Almacenamiento

- **Base de datos**: `passtore_web_vault` (IndexedDB).
- **Stores**: `credentials` (filas `CredentialDto`), `meta` (cursor de pull, `device_public_id`), `sync_outbox` (cola de push).
- **Clave de vault**: `localStorage` (`passtore.vault.key`), igual que antes; material de clave alineado con móvil vía `@passtore/vault-crypto` (`generateVaultKey`) desde `webSecureStorage`.

## Cifrado de campos sensibles

Los campos `encryptedPassword` y `notesEncrypted` siguen usando **CryptoJS AES** compartido en **`@passtore/vault-crypto`** para ser **interoperables** con la app móvil y con los envelopes `credential_row` del sync. Las utilidades en `apps/web/src/lib/webCrypto.ts` (p. ej. SHA-256) usan **Web Crypto API** para hashes y futuras extensiones; no sustituyen el formato de ciphertext del vault sin una migración coordinada.

## Coordinación de sync

`SyncCoordinator` (`apps/web/src/services/sync/SyncCoordinator.tsx`) se monta en `App.tsx`: con sesión activa hace *flush* periódico, escucha `online` y opcionalmente Socket.IO.

## Depuración

- Limpiar datos: herramientas de desarrollo del navegador → Application → IndexedDB → eliminar `passtore_web_vault`.
- API: por defecto el proxy de Vite envía `/api` al backend (ver `apps/web/vite.config.ts`).
