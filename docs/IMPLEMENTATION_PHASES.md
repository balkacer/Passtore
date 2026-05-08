# Fases de implementación

Implementación incremental sobre el repo actual (`apps/mobile/`, `apps/web/`, `backend/`). Cada fase debe ser **desplegable** y **testeable** por sí misma.

---

## Fase 0 — Fundamentos (completada en repo)

- [x] Documento de arquitectura (`docs/ARCHITECTURE.md`).
- [x] Evaluación storage (`docs/STORAGE_EVALUATION.md`).
- [x] ADR SQLite (`docs/adr/ADR-001-sqlite-vault.md`).
- [x] Paquete compartido `@passtore/core` con tipos de dominio y protocolo sync (ver `packages/core`).
- [x] Placeholders autofill ampliados (`autofillMatchingEngine`, `browserExtensionBridge`).

**Entregable**: decisiones por escrito + contratos TS compartidos.

---

## Fase 1 — Vault local robusto (mobile primero)

- [x] Integrar SQLite (`react-native-quick-sqlite`) + migraciones v1 → v2 (`deleted_at`).
- [x] Repositorio `VaultRepository` (CRUD local; almacena ciphertext ya generado por la UI).
- [x] Contrato documentado: `docs/VAULT_CLIENT_SERVICES.md` + `keyManagementService` como fachada de `secureStorageService`.
- [x] Feature flag `USE_LOCAL_VAULT` (`src/config/featureFlags.ts`): en `__DEV__` usa SQLite; en release `false` hasta validar sync.

**Pruebas**: tests de `mapRowToCredentialDto` y migraciones SQL; Jest fuerza `USE_LOCAL_VAULT=false` para no cargar SQLite nativo en tests globales.

---

## Fase 2 — Protocolo sync en backend (sin WebSocket)

- [x] Tablas: `sync_events` (ciphertext opaco) + `registered_devices` (el “vault” vive en cliente; el servidor almacena **eventos** cifrados, no filas de password descifrables). Ver [SYNC_API.md](./SYNC_API.md).
- [x] Endpoints: `POST /sync/events`, `GET /sync/events?cursor&limit`, `POST /devices/register`, `GET /devices` (módulo Nest `backend/src/sync/`).
- [x] Cliente móvil: RTK `registerDevice`, `registeredDevices`, `syncEventsPull`, `syncEventsPush` (`apps/mobile/src/types/sync.ts` + `passtoreApi`).
- [ ] Deprecar gradualmente `GET/POST /credentials` cuando el outbox + sync reemplacen el flujo (documentado en SYNC_API).

**Pruebas**: unit tests de cursor (`sync-cursor.spec.ts`); E2E de API sync pendiente.

---

## Fase 3 — WebSocket + cola offline

- [x] Gateway Socket.IO (`/sync`) con JWT; evento `vault:changed` tras cada push (`sync.gateway.ts`).
- [x] Outbox SQLite (`sync_outbox`) + `flushSyncOutbox` + enqueue en RTK al crear/editar/borrar credencial local.
- [x] Pull incremental + apply al vault (`syncPullService`, `syncApply`, `replaceCredential`).
- [x] Redis opcional (`REDIS_URL` + `RedisIoAdapter` en `main.ts`). Documentación: [SYNC_WEBSOCKET.md](./SYNC_WEBSOCKET.md).

**Pruebas**: mocks de NetInfo/socket en Jest; prueba manual multi-dispositivo recomendada.

---

## Fase 4 — Conflictos y UX

- [x] Detección de conflicto por `baseRowVersion` / versión de fila en servidor (`SyncItemState` + 409 en push).
- [x] Pantalla “Resolver conflicto” (forzar envío / versión servidor; duplicar como placeholder).

**Pruebas**: tests de motor de conflictos puro (`conflictEngine.test.ts`, sin RN).

---

## Fase 5 — Web + extension (preparación)

- [x] Web consume mismo protocolo sync (`/sync/events`, outbox, pull/apply); vault en IndexedDB; Web Crypto para utilidades (`webCrypto.ts`); ciphertext de campos compatible con móvil (CryptoJS). Ver [WEB_VAULT.md](./WEB_VAULT.md).
- [x] Documentar bridge extensión: [BROWSER_EXTENSION_BRIDGE.md](./BROWSER_EXTENSION_BRIDGE.md) (`browserExtensionBridge.ts`).

---

## Fase 6 — Autofill nativo

- [x] Módulo nativo `PasstoreAutofill` + `credentialProviderService` (iOS `ASCredentialIdentityStore`, Android índice + servicio). Ver [AUTOFILL_NATIVE_SCAFFOLD.md](./AUTOFILL_NATIVE_SCAFFOLD.md).
- [x] Android `PasstoreAutofillService` registrado (relleno de usuario por dominio).
- [ ] iOS Credential Provider extension + App Groups (opcional; la app ya expone identidades para sugerencias).
- [x] Matching engine integrado con metadatos locales (`normalized_origin`, `credentialIndex.ts`, hooks tras CRUD).

---

## Fase 7 — Calidad

- [x] Suite e2e Maestro (smoke Android/iOS) + guía Detox opcional. Ver [E2E_AND_LOAD_TESTS.md](./E2E_AND_LOAD_TESTS.md).
- [x] Load tests API sin contenido (`backend/scripts/load-health.mjs`, `GET /health`). Misma guía.

---

## Nota sobre reorganización de carpetas

- [x] Carpetas `apps/mobile/` y `apps/web/` (mayo 2026). Opcional futuro: `backend/` → `services/api/` cuando el equipo acepte el churn de imports y CI; `@passtore/core` se enlaza desde `apps/mobile` con `file:../../packages/core`.

---

## Cobertura multi-plataforma (roadmap horizontal)

El trabajo por **superficie** (web paridad temp-auth, extensión Chromium, escritorio Tauri/Electron, autofill OS profundo, Firefox/Safari) está descrito en **[PLATFORM_COVERAGE_PLAN.md](./PLATFORM_COVERAGE_PLAN.md)** por oleadas **A–F**, sin reemplazar las fases 0–7 anteriores.

**Oleada A (web + PWA mínima)** quedó cerrada: temporary auth en `apps/web` (rutas públicas/protegidas anteriores), `README` con tabla CORS/WebAuthn, PWA con manifest y SW sin caché sensible.

**Oleada B (extensión Chromium)** (`apps/extension-chromium`): MV3; temporary auth; deliver + autofill usuario; **B4**: scripts `pack.ps1` / `pack.sh`, carpeta `dist/*.zip`, guía [EXTENSION_CHROMIUM_STORE.md](./EXTENSION_CHROMIUM_STORE.md).

**Oleada C (escritorio):** [ADR-002](./adr/ADR-002-tauri-desktop-shell.md); proyecto **`apps/desktop-tauri`** (Tauri 2, `frontendDist` → `apps/web/dist`, scripts `desktop:dev` / `desktop:build` en raíz). Siguiente: **C3** — deep links `passtore://`.
