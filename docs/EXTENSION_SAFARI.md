# Safari Web Extension (Oleada E2)

Convierte la extensión MV3 de **`apps/extension-chromium`** en un **host nativo** (macOS o iOS) con el generador de Apple. El JavaScript, HTML y el `manifest.json` se reutilizan; lo que cambia es el **envoltorio Xcode** y la firma.

## Requisitos

- **macOS** con **Xcode** (última estable recomendada).
- Herramientas de línea de comandos: `xcode-select --install` si hace falta.
- Cuenta **Apple Developer** para distribución fuera de modo desarrollo (firma notarial / App Store / fuera de Mac App Store según el canal).

## Fuente de la extensión web

Origen canónico del código MV3:

| Ruta | Uso |
|------|-----|
| `apps/extension-chromium/manifest.json` | Manifest Chrome/Safari packager (mismo que desarrollo Chromium). |
| `background.js`, `content.js`, `popup.html`, `popup.js` | Misma lógica que en Chrome/Edge/Firefox. |

Tras publicar en Chrome, alinea **versión** y permisos; revisa [Assessing your Safari web extension’s browser compatibility](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility) si el packager avisa de claves del `manifest` no soportadas en tu versión de Safari.

## Generar el proyecto Xcode (recomendado en el monorepo)

En **macOS**, desde la raíz del repositorio:

```bash
chmod +x apps/extension-safari/scripts/packager.sh
./apps/extension-safari/scripts/packager.sh
```

Opcional — personalizar bundle id y nombre de la app host:

```bash
export PASSTORE_SAFARI_BUNDLE_ID=com.tuorg.passtore.safari.host
export PASSTORE_SAFARI_APP_NAME=PasstoreSafariHost
./apps/extension-safari/scripts/packager.sh
```

Salida por defecto: **`apps/extension-safari/generated/`** (ignorada por git), con el `.xcodeproj` y la app contenedora.

### Herramienta de Apple

Apple expone el **Safari web extension packager** (antes “converter”):

```bash
xcrun safari-web-extension-packager --help
```

Documentación: [Packaging a web extension for Safari](https://developer.apple.com/documentation/safariservices/converting-a-web-extension-for-safari).

El script del repo usa **`--copy-resources`** para que el proyecto Xcode sea autocontenido (copia de los JS/HTML/manifest). Si prefieres referencias vivas al árbol `extension-chromium`, quita esa opción en `packager.sh` y regenera.

### Plataformas

- **`--macos-only`**: solo escritorio (caso típico para desarrollo rápido).
- Para **iOS** o universal: genera primero macOS y luego usa **`--rebuild-project`** con la ruta al `.xcodeproj`, o vuelve a ejecutar el packager con las opciones que indique la ayuda de tu versión de Xcode.

## Probar en Safari

1. Abre el proyecto generado en Xcode, selecciona el esquema del **host app**, firma con tu equipo.
2. Ejecuta (**Run**): Safari cargará la extensión en modo depuración según [Running your Safari web extension](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension).
3. En Safari: **Desarrollo** → habilitar extensiones no firmadas solo en entornos de desarrollo según la guía actual de Apple.

## API backend (CORS)

Las peticiones `fetch` desde el **service worker** / extension pueden usar origen **`safari-web-extension://`**. El backend Nest ya permite extensiones genéricas junto con `chrome-extension://` y `moz-extension://` — ver `backend/src/main.ts`.

Si tu política CORS usa solo `CORS_ORIGINS` explícitos, añade el origen que reporte Safari en las herramientas de red o mantén la rama que autoriza prefijos `safari-web-extension://`.

## Distribución

- **Fuera de la Mac App Store**: notarización y distribución del `.app` según [Apple notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution).
- **Mac App Store / iOS**: target **App Extension** dentro del binario enviado a App Store Connect; flujo descrito en [distributing Safari Web Extensions](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension).

También existe el flujo web en **App Store Connect** para empaquetado — ver [Packaging and distributing Safari Web Extensions with App Store Connect](https://developer.apple.com/documentation/SafariServices/packaging-and-distributing-safari-web-extensions-with-app-store-connect).

## CI

En **GitHub Actions** puedes usar **`macos-latest`**, instalar Xcode y ejecutar `packager.sh` para validar que la conversión sigue funcionando (artefacto: `.xcarchive` o zip del proyecto generado).

## Referencias cruzadas

- Empaquetado Chromium / Edge / Firefox: `apps/extension-chromium/README.md`, `docs/EXTENSION_CHROMIUM_STORE.md`.
- Puente de mensajes: `docs/BROWSER_EXTENSION_BRIDGE.md`.
