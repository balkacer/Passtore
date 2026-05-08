# Plan de cobertura de plataformas — Passtore

Objetivo: que el usuario pueda **obtener y guardar contraseñas de forma segura** desde el mayor número de contextos posibles, sin multiplicar modelos de seguridad incompatibles.

**Principios**

- **Una identidad, un cofre cifrado en cliente**, sync por eventos opacos (ver `SYNC_API.md`).
- **Superficies no confiables** (navegador ajeno, extensión, escritorio compartido): usar **temporary auth** / pairing (`TEMPORARY_AUTH_SESSIONS.md`), no sincronizar el vault completo ahí sin política explícita.
- **Paridad funcional por oleadas**: cada oleada debe ser desplegable y testeable; no bloquear una plataforma por otra salvo dependencias indicadas abajo.

---

## Estado actual (resumen)

| Superficie | Estado | Notas |
|------------|--------|--------|
| API Nest + Postgres | Productivo MVP | Sync, passkeys, temporary-auth |
| `apps/mobile` (iOS / Android) | Fuerte | Vault SQLite, sync, autofill scaffold, temp auth + deep links |
| `apps/web` | Fuerte en vault + sync + temp auth | Rutas `/temp-auth/pair`, `/security/temp-sessions`; RTK + `sessionStorage` para JWT temporal |
| Docker / scripts raíz | OK | Postgres + API + web estática |
| Extensión navegador | MVP + empaquetado zip (`EXTENSION_CHROMIUM_STORE.md`) | Temp auth + autofill de usuario; `BROWSER_EXTENSION_BRIDGE.md` |
| Escritorio nativo | Shell Tauri (`apps/desktop-tauri`) | [ADR-002](./adr/ADR-002-tauri-desktop-shell.md); `npm run desktop:dev` |
| PWA | Mínima (manifest + icono SVG + SW sin caché de secretos) | `apps/web/public/`, registro en prod (`main.tsx`) |

---

## Oleadas de trabajo (orden recomendado)

### Oleada A — Base común web + políticas ✅ (cerrada)

**Por qué primero:** todo lo demás (extensión, escritorio empaquetado) puede reutilizar la misma API y patrones de sesión.

| # | Entregable | Estado |
|---|------------|--------|
| A1 | Paridad **temporary auth** en `apps/web`: init pairing, poll, JWT temporal en `sessionStorage`, deliver/poll, pantalla mínima “sesiones / revocar” | ✅ `passtoreApi` + `temporaryAuthStorage.ts`; páginas `TempAuthPairPage`, `TempAuthSessionsPage` |
| A2 | **PWA**: manifest, iconos, `service worker` acotado (sin guardar secretos en SW) | ✅ `public/manifest.webmanifest`, `public/sw.js`, `public/icons/pwa-icon.svg` |
| A3 | Tabla en README / env: CORS y WebAuthn por entorno | ✅ Sección en raíz `README.md` (“CORS y WebAuthn por entorno”) |

**Criterio de hecho:** desde el navegador se puede completar el flujo “origen no confiable → pairing → usar token temporal”; el aprobador puede ser la **app móvil** o la **web autenticada** si hay dispositivo registrado (`approveTemporaryPairing` en `TempAuthPairPage`).

---

### Oleada B — Extensión Chromium (Chrome / Edge / Brave)

**Por qué aquí:** máximo alcance de escritorio con una sola base (MV3).

| # | Entregable | Estado |
|---|------------|--------|
| B1 | Carpeta `apps/extension-chromium`: MV3, permisos mínimos (`activeTab`), content script + popup, bridge `PING`/`PONG` | ✅ MVP |
| B2 | Integración **temporary auth**: deep link / copiar `qrPayload` / poll + JWT en `chrome.storage.session` | ✅ MVP |
| B3 | Autofill básico: content script + `TEMP_AUTH_AUTOFILL_ACTIVE_TAB` → `POST /temporary-auth/deliver`, poll si `needsApproval`, relleno de **usuario** en la pestaña | ✅ MVP |
| B4 | Empaquetado y guía de publicación (Chrome Web Store / Edge Add-ons) | ✅ Guía + scripts `scripts/pack.ps1` / `pack.sh` → `docs/EXTENSION_CHROMIUM_STORE.md` |

**Criterio de hecho (oleada completa):** usuario puede rellenar y guardar en sitios elegidos sin abrir la SPA completa.

**Nota B3:** el relleno usa solo sesión temporal y **login en claro** devuelto por la API; la contraseña sigue siendo ciphertext en servidor sin clave de cofre en la extensión. **Guardar una credencial nueva** desde la extensión (`POST /credentials` u outbox) queda fuera de este MVP.

---

### Oleada C — Escritorio empaquetado (Windows / macOS / Linux)

**Por qué:** mejor integración que pestaña pura; biometría del SO; menos fricción “siempre abierto”.

| # | Entregable | Dependencias |
|---|------------|----------------|
| C1 | Elegir stack: **Tauri** (ligero, Rust) vs **Electron** (ecosistema grande) — ADR corto | ✅ [ADR-002](./adr/ADR-002-tauri-desktop-shell.md) |
| C2 | Shell que empaqueta `apps/web` build o vista dedicada; auto-update opcional (later) | ✅ `apps/desktop-tauri` |
| C3 | Deep links / protocolo `passtore://` en escritorio alineado con móvil | ✅ `tauri-plugin-deep-link` + esquema `passtore`; SPA `TauriDeepLinkBridge` + rutas temp-auth |
| C4 | Builds CI por OS (artifact por release) | ✅ GitHub Actions `.github/workflows/desktop-tauri.yml` (matrix Ubuntu / Windows / macOS + artefactos `bundle/`) |

**Criterio de hecho:** instalador por OS que abre la misma cuenta con misma seguridad que la web.

---

### Oleada D — Autofill del sistema operativo (profundidad)

**Ya hay base en mobile** — esta oleada es **pulido y paridad**.

| # | Entregable | Dependencias |
|---|------------|----------------|
| D1 | Android: `PasstoreAutofillService` + índice por dominio probado en apps reales | ✅ Implementación en `apps/mobile/android/.../PasstoreAutofillService.kt` + `AutofillIdentityStore`; QA manual en apps reales sigue siendo checklist de release |
| D2 | iOS: Credential Provider extension + App Groups si hace falta para datos compartidos | ✅ Target `PasstoreCredentialProvider` + App Group compartido con `PasstoreAutofill.m`; provisioning Apple Developer sigue siendo paso manual |
| D3 | Documentar límites (sandbox, Face ID) en `AUTOFILL_NATIVE_SCAFFOLD.md` | ✅ Sección “Límites y modelo de amenaza” |

---

### Oleada E — Firefox + Safari (extensiones)

**Por qué después:** APIs y tiendas distintas; Safari además requiere flujo Apple.

| # | Entregable | Estado |
|---|------------|--------|
| E1 | Firefox MV3 (WebExtensions) compartiendo máximo código con B | ✅ `manifest.firefox.json`, empaquetado / staging, CORS `moz-extension://` |
| E2 | Safari Web Extension empaquetada con app macOS/iOS según guía Apple | ✅ `docs/EXTENSION_SAFARI.md` + `apps/extension-safari/scripts/packager.sh`; CORS `safari-web-extension://`; proyecto Xcode en `generated/` (solo macOS) |

---

### Oleada F — Complementos (baja prioridad / nicho)

| Superficie | Uso | Notas |
|------------|-----|--------|
| **CLI** (`@passtore/cli`, bin `passtore`) | Sync pull, backup opaco, listar dispositivos | ✅ `apps/cli` — contratos en `src/types.ts` alineados con `packages/core` |
| **Wear OS / watchOS** | Solo TOTP / revelado ultra acotado + biometría | No sustituye app |
| **Smart TV / consolas** | Normalmente fuera de alcance | No recomendado salvo caso extremo |

---

## Dependencias transversales (en paralelo a cualquier oleada)

- **i18n** (ES primero, luego EN): strings centralizados por app.
- **Accesibilidad**: contraste (`UI_UX_GUIDELINES.md`), lectores de pantalla en web y RN.
- **Seguridad**: revisión por superficie (XSS web/extensión, CSP, permisos MV3 mínimos).
- **Observabilidad**: logs estructurados en API; **sin** plaintext de contraseñas.
- **Redis**: solo cuando haya **varias instancias** del API + Socket.IO (`SYNC_WEBSOCKET.md`).

---

## Métricas suaves de “cobertura”

- **Presencia:** ¿en cuántas tiendas / formatos instalables está Passtore? (Play, App Store, Chrome, Edge, Microsoft Store opcional para Tauri.)
- **Flujo crítico:** ¿login + lectura de una credencial + escritura en &lt; 2 min en cada superficie objetivo?
- **Incidentes:** vulnerabilidades reportadas por superficie (extension permisos, XSS).

---

## Relación con `IMPLEMENTATION_PHASES.md`

Las fases 0–7 del repo cubren **fundamentos, vault, sync, conflictos, web vault, autofill scaffold, calidad**. Este documento **no las sustituye**: organiza el trabajo **horizontal por plataforma** encima de esa base. Cuando una oleada cierre, conviene anotar un párrafo en `IMPLEMENTATION_PHASES` o un ADR si cambia arquitectura (p. ej. Tauri vs Electron).

---

## Próximo paso sugerido

**Oleada C3**: registrar protocolo **`passtore://`** en el escritorio (deep links alineados con móvil y temporary auth).
