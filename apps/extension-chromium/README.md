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

## Temporary auth (B2)

Pairing, poll, JWT en **`chrome.storage.session`**, copiar deep link / `qrPayload`.

## Autofill (B3)

1. Completa el flujo de sesión temporal (JWT presente en la pastilla del popup).
2. Abre la pestaña del **login** (mismo **origen** que configuraste al emparejar).
3. Indica el **UUID** de la credencial y el **propósito** (`autofill` suele ser directo si la política lo permite; `copy` / `reveal` suelen pedir aprobación en el móvil).
4. **Rellenar usuario en la pestaña actual** → `POST /temporary-auth/deliver` con el JWT temporal; si hace falta aprobación, copia el enlace y el popup hace **poll** hasta que la entrega esté `ready`.
5. El **content script** escribe solo **`loginUsername`** (texto plano). La contraseña sigue cifrada en el servidor; sin clave de cofre en la extensión no se descifra ni se rellena el campo password.

Si no se rellena, recarga la página tras instalar o actualizar la extensión (para inyectar el content script).

## Bridge de prueba (B1)

En **Bridge de prueba**: ping al background y al content script. Ver `docs/BROWSER_EXTENSION_BRIDGE.md`.

## Publicación en tienda

Ver [docs/EXTENSION_CHROMIUM_STORE.md](../../docs/EXTENSION_CHROMIUM_STORE.md) (checklist, justificación de permisos, iconos PNG).
