# Extensión Chromium — publicación (Chrome Web Store · Edge Add-ons)

Guía **Oleada B4**: empaquetado, revisión de permisos y checklist antes de enviar a tienda.

## Empaquetado

Desde `apps/extension-chromium/`:

| Entorno | Comando |
|---------|---------|
| Windows (PowerShell) | `powershell -ExecutionPolicy Bypass -File scripts/pack.ps1` |
| Linux / macOS / Git Bash | `chmod +x scripts/pack.sh && ./scripts/pack.sh` |

Salida: `dist/passtore-chromium-v<version>.zip` (solo `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`).

Carga local: **Cargar descomprimida** sigue usando la **carpeta** del proyecto; el zip es para **dashboards de tienda** y distribución.

## Chrome Web Store

1. Cuenta de desarrollador de pago único ([Google Play / Chrome Web Store](https://chrome.google.com/webstore/devconsole)).
2. **Nuevo elemento** → subir el zip.
3. **Descripción**: una sola función principal clara (gestor de contraseñas / acceso temporal Passtore).
4. **Capturas**: 1280×800 o 640×400 recomendadas (al menos una).
5. **Icono**: el manifest actual no incluye `icons`; añade PNG **128×128** (y 48 / 96 si quieres) antes del envío público.
6. **Política de privacidad**: URL pública obligatoria si la extensión recoge datos del usuario o llama a tu API — enlaza a la política del producto Passtore.
7. **Justificación de permisos** (campo “Permission justification”):
   - **`storage`**: guardar URL base del API, URL de la app web, JWT de sesión web (`chrome.storage.local`) y JWT temporal (`chrome.storage.session`).
   - **`tabs`**: localizar pestañas del origen de la app web para leer el JWT de `sessionStorage` vía el content script (sincronizar sesión con la extensión).
   - **`activeTab`**: interactuar con la pestaña activa para autofill y ping de prueba.
   - **`host_permissions` amplios (`https://*/*`)**: necesarios para que el service worker llame a tu backend en el dominio que el usuario configure y para inyectar el content script en sitios de login. Para reducir alcance en revisión, ver [Endurecer permisos](#endurecer-permisos-antes-de-producción).
8. **Revisión**: tiempos variables; respuestas claras si piden aclaración sobre datos remotos (solo tu backend, sin terceros).

## Microsoft Edge Add-ons

1. [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) → **Create new extension**.
2. Suele aceptarse el **mismo zip** que Chrome (MV3 compatible).
3. Metadatos similares: descripción, capturas, política de privacidad.
4. Si ya publicas en Chrome, puedes indicar paridad en la descripción.

## Endurecer permisos antes de producción

El manifest de desarrollo usa patrones amplios para facilitar pruebas locales y cualquier dominio HTTPS.

Opciones para endurecer (sin implementar código nuevo aquí):

1. **`host_permissions`**: sustituir `https://*/*` por los hosts concretos del API en producción (p. ej. `https://api.tudominio.com/*`). El popup ya permite base URL; los `fetch` deben seguir coincidiendo con los hosts declarados.
2. **`content_scripts.matches`**: reducir de `https://*/*` a dominios donde quieras autofill (más trabajo de mantenimiento).
3. **`optional_permissions` + `chrome.permissions.request`**: pedir acceso al host solo cuando el usuario guarde la URL del API (requiere refactor del popup/background).

Documenta en la ficha de la tienda por qué necesitas cada permiso si los revisores preguntan por alcance amplio.

## Rutina rápida pre-envío

- [ ] Versión incrementada en `manifest.json`.
- [ ] Prueba con zip generado (cargar zip descomprimido en carpeta temporal o importar en dashboard de prueba).
- [ ] Iconos PNG en manifest.
- [ ] Textos del popup sin datos sensibles en logs.
- [ ] Política de privacidad actualizada con mención a API propia y datos de sesión temporal.
