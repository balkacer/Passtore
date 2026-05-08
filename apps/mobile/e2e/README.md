# E2E (iPhone / simulador)

Las pruebas **unitarias** cubren generador, fortaleza, cifrado y stores. Para flujos completos en dispositivo:

## Opción A — Detox (CLI React Native)

Ejecutar **en macOS** con Xcode instalado.

1. `cd mobile && npm install`
2. `brew tap wix/brew && brew install applesimutils` (recomendado por Detox para iOS).
3. En `package.json`, añade script `"test:e2e": "detox test --configuration ios.sim.debug"` tras configurar `.detoxrc.js` apuntando a `PasstoreMobile`.
4. Build de prueba: `detox build --configuration ios.sim.debug`.
5. Ejecutar tests: `detox test --configuration ios.sim.debug`.

Ajusta `binaryPath` en `.detoxrc.js` según la salida de `DerivedData` de Xcode.

## Opción B — Maestro (YAML)

1. Instala [Maestro](https://maestro.mobile.dev/).
2. Con la app instalada en simulador o dispositivo: `maestro test e2e/sample.maestro.yaml`.

Define flujos para onboarding → login → crear credencial → copiar contraseña según IDs de accesibilidad que vayas añadiendo en componentes.
