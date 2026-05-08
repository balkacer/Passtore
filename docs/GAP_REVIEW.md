# Revisión de huecos (backend · apps · extension)

Estado aproximado respecto al producto **local-first + sync + acceso temporal**.

## Backend

| Área | Estado | Notas |
|------|--------|--------|
| Auth JWT, perfil, CRUD credentials | Listo | |
| Sync REST + dispositivos | Listo | Ver `SYNC_API.md` |
| Socket.IO + Redis opcional | Listo | |
| Conflictos push | Listo | |
| **Temporary auth** (`/temporary-auth/*`) | Listo | Pairing, JWT temporal, entrega por credencial, auditoría tabla |
| Migraciones Flyway/TypeORM producción | Pendiente | Sigue `synchronize` en dev; endurecer antes de prod |
| Preferencias usuario (TTL temp auth, defaults) | No existe | Necesario si la app debe guardar políticas sin hardcode |

## App móvil (`apps/mobile`)

| Área | Estado | Notas |
|------|--------|--------|
| Vault SQLite + sync + conflictos | Listo | Flags `USE_*` |
| **Temp auth**: deep links, pairing/delivery + biometría | Listo | `passtore://temp-auth/...` |
| **Seguridad**: sesiones remotas + auditoría local | Listo | Pantalla `SecurityTempAuth` |
| Push para `approvalDeepLink` | Pendiente | Opcional; mejor UX |
| Passkeys / OAuth | Parcial | Passkeys MVP; OAuth backend pendiente en README |
| **Autofill del SO** (Android `PasstoreAutofillService`, iOS `ASCredentialIdentityStore` + extensión Credential Provider) | MVP | Metadatos solo; contraseña vacía en autofill OS — ver `AUTOFILL_NATIVE_SCAFFOLD.md`. Provisioning App Group / extensión en Apple Developer: manual |

## Web (`apps/web`)

| Área | Estado | Notas |
|------|--------|--------|
| Login, vault IndexedDB, sync, Socket.IO | Listo | Ver `WEB_VAULT.md` |
| **Temporary auth** (init pairing, poll, temp JWT, deliver, aprobar desde otro dispositivo) | Listo (MVP) | `/temp-auth/pair`, JWT en `sessionStorage`; aprobación desde web si hay dispositivo registrado o desde móvil |
| Pantalla “seguridad” sesiones temporales | Listo (MVP) | `/security/temp-sessions` — listar / revocar |
| Extensión navegador consumiendo bridge | MVP (`apps/extension-chromium`) | MV3 Chromium + Firefox + **Safari** (packager Xcode, ver `EXTENSION_SAFARI.md`); temp auth + deliver/autofill usuario; ver `BROWSER_EXTENSION_BRIDGE.md` |

## Escritorio (`apps/desktop-tauri`)

| Área | Estado | Notas |
|------|--------|--------|
| Shell Tauri + SPA web | MVP | `npm run desktop:dev`; Rust requerido; **deep links** `passtore://` (pairing/delivery) como en móvil — ver `apps/desktop-tauri/README.md` |
| CI builds escritorio (multi-OS) | MVP | `.github/workflows/desktop-tauri.yml` — artefactos por OS; firma de código / notarización → pendiente si se publica en tiendas |

## Extension / autofill

| Área | Estado |
|------|--------|
| Bridge TS compartido (móvil) | Placeholder |
| **Temp auth desde extensión** | MVP: pairing + JWT + `POST /deliver` + poll + autofill de **usuario** en DOM (`PASSTORE_AUTOFILL`). Guardar credencial nueva desde extensión → pendiente |

## CLI (`apps/cli`)

| Área | Estado | Notas |
|------|--------|--------|
| Sync pull / backup JSON opaco / devices | MVP | `PASSTORE_TOKEN` + `PASSTORE_API_BASE_URL`; ver `apps/cli/README.md` |

## Reorganización de carpetas

- **`apps/mobile`** y **`apps/web`** son las rutas canónicas; `docker-compose` construye la imagen web desde `./apps/web`.
- Tras clonar o mover, ejecutar `npm install` en `apps/mobile` para re-enlazar `@passtore/core` (`file:../../packages/core`).
- Opción futura: `backend/` → `services/api/` y workspaces npm en raíz (ver `MONOREPO_LAYOUT.md`).
