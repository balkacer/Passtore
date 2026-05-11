# Passtore — extensión Chromium / Firefox (MV3)

Misma base de código (`background.js`, `popup.*`, `content.js`). **Chrome / Edge** usan `manifest.json`; **Firefox** usa `manifest.firefox.json` (bloque `browser_specific_settings.gecko`). Mantén la **versión** en ambos manifests al publicar.

## Desarrollo

### Chromium / Edge

1. `chrome://extensions` → **Modo desarrollador** → **Cargar descomprimida** → esta carpeta.
2. Tras cambiar archivos, pulsa **Recargar** en la tarjeta de la extensión.

### Firefox (Oleada E1)

1. Firefox **115+** (MV3 + `chrome.storage.session`).
2. Genera la carpeta de prueba: `powershell -ExecutionPolicy Bypass -File scripts/stage-firefox-unpacked.ps1` (o `./scripts/stage-firefox-unpacked.sh`). Luego `about:debugging` → **Esta Firefox** → **Cargar complemento temporal** → **`dist/firefox-unpacked/manifest.json`**.
3. El backend debe permitir orígenes **`moz-extension://`** (ya contemplado en `backend/src/main.ts` junto a `chrome-extension://`).

### Paquete zip (tienda)

**Chromium / Edge**

- Windows: `powershell -ExecutionPolicy Bypass -File scripts/pack.ps1`
- Linux / macOS / Git Bash: `./scripts/pack.sh`

Genera `dist/passtore-chromium-v<version>.zip`. Guía completa (Chrome Web Store, Edge, permisos): [docs/EXTENSION_CHROMIUM_STORE.md](../../docs/EXTENSION_CHROMIUM_STORE.md).

**Firefox**

- Windows: `powershell -ExecutionPolicy Bypass -File scripts/pack-firefox.ps1`
- Unix: `chmod +x scripts/pack-firefox.sh && ./scripts/pack-firefox.sh`
- Desde la raíz del monorepo: `npm run extension:pack:firefox`

Genera `dist/passtore-firefox-v<version>.zip`. Publicación: [Firefox Browser Add-ons](https://addons.mozilla.org/developers/) (cuenta de desarrollador; el `gecko.id` en `manifest.firefox.json` debe ser estable para actualizaciones).

## Safari (Oleada E2)

Mismo código; el envoltorio es un proyecto **Xcode** generado en macOS. Guía y script: [docs/EXTENSION_SAFARI.md](../../docs/EXTENSION_SAFARI.md), `apps/extension-safari/scripts/packager.sh`.

## API (backend Nest)

- **URL base** en el popup (por defecto `http://localhost:3000`). Rutas sin prefijo `/api`.
- **CORS:** el backend admite orígenes `chrome-extension://…` además de `CORS_ORIGINS` (`backend/src/main.ts`).

## Sesión web en la extensión (recomendado)

1. Configura **URL de la app web** (p. ej. `http://localhost:5173`) y **Base URL** del API.
2. Si ya tienes Passtore abierto en una pestaña con sesión iniciada, al abrir el popup se intenta **sincronizar** el JWT desde `sessionStorage` (`passtore.jwt`) vía el content script. También puedes pulsar **Sincronizar sesión desde la web**.
3. Si no hay sesión: **Iniciar sesión o registrarse en la web** abre `/login?extension=1`; tras entrar, vuelve a la extensión y sincroniza (deja la pestaña de Passtore abierta).
4. **Autofill** con propósito `autofill` → `POST /temporary-auth/extension-autofill` con el JWT de usuario. El **origen de la pestaña activa** debe coincidir (reglas de host) con la **URL guardada en la credencial**, si existe.
5. **copy / reveal** siguen usando **sesión temporal** emparejada → `POST /temporary-auth/deliver`.

El **content script** responde a `PASSTORE_READ_WEB_JWT` solo en páginas donde esté inyectado; el permiso **`tabs`** permite buscar pestañas del mismo origen que la app web.

## Temporary auth (B2) — equipo ajeno / avanzado

La **sesión temporal** en producto está pensada sobre todo para **navegador en equipo ajeno** o **app de escritorio puntual**: entras, sacas una credencial con el móvil como aprobador, sales. No es el flujo ideal para “instalar la extensión solo para copiar una contraseña y desinstalar”.

En el popup, el bloque **Sesión temporal** está en el desplegable *avanzado*. El JWT temporal sigue en **`chrome.storage.session`**.

## Autofill (B3)

1. **Preferido:** JWT de sesión web guardado en la extensión (`chrome.storage.local`) — ver sección anterior.
2. **Alternativa:** JWT temporal (emparejamiento + poll).
3. Abre la pestaña del **login** del sitio donde quieres autofill.
4. Indica el **UUID** de la credencial y el **propósito** (`autofill` con sesión web; `copy` / `reveal` con temporal).
5. **Rellenar usuario** → el background llama a `extension-autofill` o `/temporary-auth/deliver`; si hace falta aprobación (solo temporal con copy/reveal), el popup hace **poll**.
6. El **content script** escribe solo **`loginUsername`**. La contraseña sigue cifrada en el servidor.

Si no se rellena, recarga la página tras instalar o actualizar la extensión (para inyectar el content script).

## Bridge de prueba (B1)

En **Bridge de prueba**: ping al background y al content script. Ver `docs/BROWSER_EXTENSION_BRIDGE.md`.

## Publicación en tienda

Ver [docs/EXTENSION_CHROMIUM_STORE.md](../../docs/EXTENSION_CHROMIUM_STORE.md) (checklist, justificación de permisos, iconos PNG).
