# WebSocket sync — Socket.IO + Redis opcional

## Servidor

- **Namespace:** `/sync`
- **Auth:** JWT en `handshake.auth.token` o query `token` (mismo secreto que REST).
- Tras `POST /sync/events`, el servidor emite a la sala `user:<userId>` el evento **`vault:changed`** con `{ eventId? }`. Los clientes siguen usando **`GET /sync/events`** para traer datos.

### Redis (opcional)

Si defines **`REDIS_URL`** (p. ej. `redis://redis:6379`), `main.ts` usa `RedisIoAdapter` para que varias réplicas del API compartan salas Socket.IO.

Sin Redis, una sola instancia funciona con el adaptador por defecto.

## Cliente móvil

- **`SyncCoordinator`** (`apps/mobile/src/services/sync/SyncCoordinator.tsx`): conecta Socket.IO cuando hay sesión y los flags `USE_SYNC_*` están activos (por defecto en `__DEV__` junto al vault local).
- **`flushSyncOutbox`**: envía filas pendientes de la tabla `sync_outbox` vía REST.
- **`pullAndApplyRemoteSync`**: pagina `/sync/events`, aplica envelopes remotos al SQLite local e invalida la lista de credenciales.
- **NetInfo** + intervalo 30s disparan la misma rutina de sincronización.

Ver también [SYNC_API.md](./SYNC_API.md).
