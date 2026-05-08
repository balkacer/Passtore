# API de sincronización (blobs cifrados)

El servidor **no interpreta** `ciphertextPayload`: solo lo persiste y lo devuelve en pulls incrementales.

## Autenticación

Todos los endpoints requieren `Authorization: Bearer <JWT>`.

## Dispositivos

### `POST /devices/register`

Registra o actualiza un dispositivo para el usuario autenticado.

**Body**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `devicePublicId` | string | Id estable generado en el cliente (8–128 caracteres). |
| `name` | string? | Nombre visible. |
| `platform` | string? | p. ej. `ios`, `android`. |
| `appVersion` | string? | Versión de la app. |

**Respuesta**: entidad `RegisteredDevice` (incluye `id` interno del servidor, `lastSeenAt`, etc.).

### `GET /devices`

Lista dispositivos del usuario (ordenados por `lastSeenAt` descendente).

---

## Eventos de sync

### `POST /sync/events`

Inserta un evento con payload opaco.

**Body**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `devicePublicId` | string | Debe coincidir con un dispositivo registrado (se crea/actualiza en el mismo flujo). |
| `deviceName` | string? | Actualiza metadata del dispositivo si se envía. |
| `platform` | string? | Idem. |
| `appVersion` | string? | Idem. |
| `type` | string | Uno de: `VAULT_ITEM_UPSERT`, `VAULT_ITEM_DELETE`, `SNAPSHOT_PUSH`, `DEVICE_REGISTER`. |
| `baseRevision` | string? | Revision previa del cliente (conflictos / futuro). |
| `ciphertextPayload` | string | Texto cifrado (máx. 5M caracteres). |
| `contentHash` | string? | Hash opcional para deduplicación. |

**Respuesta**: `{ "id": "<uuid>", "createdAt": "<ISO8601>" }`.

### `GET /sync/events`

Pull incremental.

**Query**

| Parámetro | Descripción |
|-----------|-------------|
| `cursor` | Opcional. Cursor opaco devuelto en la respuesta anterior (`nextCursor`). Codificación: base64url de `ISO8601|eventUuid`. |
| `limit` | Opcional. Por defecto 100; máximo 500. |

**Respuesta** (alineada con `@passtore/core`):

```json
{
  "events": [
    {
      "id": "...",
      "userId": "...",
      "deviceId": "<devicePublicId del emisor>",
      "type": "VAULT_ITEM_UPSERT",
      "baseRevision": "...",
      "ciphertextPayload": "...",
      "contentHash": "...",
      "createdAt": "..."
    }
  ],
  "nextCursor": "<opaque>",
  "serverTime": "<ISO8601>"
}
```

- `nextCursor` vacío cuando no hay filas en el lote (el cliente deja de paginar cuando recibe 0 eventos o cuando ya no hay más datos según su lógica).

---

## Relación con credenciales legacy

Los endpoints `GET/POST /credentials` siguen existiendo para compatibilidad. El modelo objetivo es **eventos cifrados + vault local**; ver `docs/IMPLEMENTATION_PHASES.md` para retirada gradual del CRUD centralizado.
