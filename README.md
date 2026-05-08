# Passtore

Monorepo MVP: **app móvil React Native CLI (TypeScript)** + **app web (Vite + React)** + **API NestJS** + **PostgreSQL** (Docker). Gestor de contraseñas con cifrado en cliente, RTK Query, Zustand y UI minimalista en tonos rojo/rosa.

## Arquitectura local-first (documentación)

La dirección del producto es **LOCAL-FIRST + ENCRYPTED-FIRST + SYNC-OPTIONAL**: el servidor coordina identidad y sincronización de **blobs cifrados**, sin descifrar el cofre.

| Documento | Contenido |
|-----------|-----------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitectura general, sync, cifrado, conflictos, seguridad, monorepo |
| [docs/STORAGE_EVALUATION.md](./docs/STORAGE_EVALUATION.md) | SQLite vs Realm vs WatermelonDB |
| [docs/IMPLEMENTATION_PHASES.md](./docs/IMPLEMENTATION_PHASES.md) | Fases de implementación |
| [docs/AUTOFILL_PLATFORM_ARCHITECTURE.md](./docs/AUTOFILL_PLATFORM_ARCHITECTURE.md) | Autofill multiplataforma |
| [docs/UI_UX_GUIDELINES.md](./docs/UI_UX_GUIDELINES.md) | Líneas UI/UX premium |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Índice de decisiones y ADRs |
| [docs/SYNC_API.md](./docs/SYNC_API.md) | REST sync: push/pull eventos cifrados, dispositivos |
| [docs/SYNC_WEBSOCKET.md](./docs/SYNC_WEBSOCKET.md) | Socket.IO `/sync`, Redis opcional, cliente móvil |
| [docs/GAP_REVIEW.md](./docs/GAP_REVIEW.md) | Huecos entre backend, `apps/mobile`, `apps/web`, extensión |
| [docs/PLATFORM_COVERAGE_PLAN.md](./docs/PLATFORM_COVERAGE_PLAN.md) | Plan por oleadas: web, extensión, escritorio, autofill OS, Firefox/Safari |
| [docs/EXTENSION_CHROMIUM_STORE.md](./docs/EXTENSION_CHROMIUM_STORE.md) | Empaquetado zip y checklist Chrome Web Store / Edge Add-ons |
| [docs/TESTING.md](./docs/TESTING.md) | Convención de carpetas de tests y scripts del monorepo |
| [docs/adr/ADR-002-tauri-desktop-shell.md](./docs/adr/ADR-002-tauri-desktop-shell.md) | Escritorio: Tauri vs Electron — shell recomendado |

**Paquetes compartidos** (`packages/*`, enlazados con `file:../../packages/...` desde cada app):

| Paquete | Rol |
|---------|-----|
| **`@passtore/core`** | Tipos de dominio y API compartidos (`CredentialDto`, sync, temporary auth, autofill index). |
| **`@passtore/vault-crypto`** | Cifrado AES de campos del cofre (CryptoJS) + material de clave; misma implementación en web, móvil y CLI. |
| **`@passtore/crypto-contract`** | Vectores “golden” para comprobar interoperabilidad del ciphertext entre clientes. |

## Estructura

```
Passtore/
├── apps/
│   ├── mobile/      # React Native CLI (Passtore)
│   ├── web/         # Passtore web (Vite + React + TypeScript)
│   ├── extension-chromium/  # Extensión MV3 (Chrome / Edge / Firefox / fuente Safari)
│   ├── extension-safari/    # Scripts packager Safari (macOS) → ver docs/EXTENSION_SAFARI.md
│   ├── cli/                 # @passtore/cli — bin `passtore` (cofre, sync pull, dispositivos, TUI)
│   └── desktop-tauri/       # Escritorio Tauri → apps/web
├── backend/         # NestJS + TypeORM + JWT
├── packages/
│   ├── core/              # @passtore/core — tipos compartidos
│   ├── vault-crypto/      # @passtore/vault-crypto — AES cofre (web / móvil / CLI)
│   └── crypto-contract/   # @passtore/crypto-contract — vectores de contrato cifrado
├── docs/            # Arquitectura local-first, ADRs, fases
├── docker-compose.yml
└── README.md
```

### Frontend (`apps/mobile/`)

- `src/app/` — arranque, `AppBootstrap` (hidrata JWT, perfil).
- `src/navigation/` — pilas Auth / Main.
- `src/screens/` — onboarding, auth, home, vault, notificaciones.
- `src/features/password-generator/` — componente reutilizable del generador.
- `src/services/` — API RTK (en `store/rtk`), `encryptionService` (reexport de `@passtore/vault-crypto`), `secureStorageService`, **vault SQLite** (`services/vault/`, `react-native-quick-sqlite`), biometría, favicon, placeholders autofill.
- **Vault local:** con `USE_LOCAL_VAULT` en `true` (por defecto en `__DEV__` en `apps/mobile/src/config/featureFlags.ts`), las credenciales se guardan solo en SQLite en el dispositivo; en release sigue la API hasta activar sync. Contrato: `apps/mobile/docs/VAULT_CLIENT_SERVICES.md`. Tras `npm install`, en iOS ejecuta `pod install` en `apps/mobile/ios` para enlazar SQLite nativo.
- `src/store/rtk/` — `passtoreApi` + `store`.
- `src/store/zustand/` — sesión (`authStore`).
- `src/tests/unit/` — tests Jest (unitarios); `src/tests/integration/` — smokes (p. ej. render de `App`). Setup en `src/tests/setup.ts`. Ver [docs/TESTING.md](./docs/TESTING.md).
- `docs/autofill-roadmap.md` — integración futura iOS/Android autofill.
- `e2e/` — guía Detox / Maestro para flujos en dispositivo.

### Web (`apps/web/`)

- Misma API REST y los mismos tipos vía **`@passtore/core`**; cifrado de cofre vía **`@passtore/vault-crypto`**. **RTK Query** + **Zustand** (paridad con móvil).
- Tests unitarios en **`src/tests/unit/`** (Vitest); setup en `src/tests/setup.ts`. Ver [docs/TESTING.md](./docs/TESTING.md).
- JWT en `sessionStorage`; clave de bóveda en `localStorage` (riesgo XSS inherente a cualquier SPA — usar solo HTTPS en producción).
- Desarrollo: `Vite` hace **proxy** de `/api` → `http://localhost:3000` (ver `apps/web/vite.config.ts`).
- Producción: define `VITE_API_BASE_URL` apuntando al host público del backend y habilita **CORS** para ese origen.
- **Importante:** el **formato** del ciphertext es el mismo en todos los clientes (`@passtore/vault-crypto`). Aun así, la **clave de bóveda** suele ser distinta por dispositivo/navegador hasta que exista un flujo de desbloqueo o sync que reparta la misma clave; sin eso, el ciphertext almacenado en un cliente no es descifrable en otro aunque la app sea la misma.

#### CORS y WebAuthn por entorno (referencia rápida)

| Entorno | Origen típico (web) | Backend |
|--------|---------------------|---------|
| Desarrollo local | `http://localhost:5173` | Incluir ese origen en `CORS_ORIGINS` (ver `backend/.env.example`). WebAuthn: `RP_ID=localhost` y prueba en **HTTPS** o `localhost` según el navegador. |
| Producción | `https://app.tudominio.com` | Mismo origen en `CORS_ORIGINS`; `RP_ID` = host público sin puerto; certificado TLS válido. |
| PWA instalada | Origen del mismo dominio que desplegaste | Sin cambio en API si el scope es el mismo; evita mezclar `www` y apex sin configuración RP/WebAuthn explícita. |

### Extensión de navegador (`apps/extension-chromium/` + Safari)

- Manifest **V3**: `service_worker`, popup y content script; temporary auth; **autofill** del nombre de usuario vía `/temporary-auth/deliver` + mensaje `PASSTORE_AUTOFILL`. Contrato de mensajes: [docs/BROWSER_EXTENSION_BRIDGE.md](./docs/BROWSER_EXTENSION_BRIDGE.md).
- **Chrome / Edge:** carga desempaquetada (`chrome://extensions`). Ver `apps/extension-chromium/README.md`.
- **Firefox / Safari:** mismo código; Firefox zip + staging en ese README. **Safari:** packager Apple solo en macOS — [docs/EXTENSION_SAFARI.md](./docs/EXTENSION_SAFARI.md), scripts en `apps/extension-safari/`.

### Escritorio Tauri (`apps/desktop-tauri/`)

- Misma SPA que `apps/web` empaquetada con **Tauri 2**; requiere **Rust** + `npm run desktop:dev` en la raíz. **Deep links** `passtore://temp-auth/...` (pairing / delivery) en línea con móvil y `TEMPORARY_AUTH_SESSIONS.md`. Builds multi-OS en CI: [.github/workflows/desktop-tauri.yml](./.github/workflows/desktop-tauri.yml). Ver [apps/desktop-tauri/README.md](./apps/desktop-tauri/README.md) y [ADR-002](./docs/adr/ADR-002-tauri-desktop-shell.md).

### Backend (`backend/`)

- Auth JWT (`/auth/login`, `/auth/register`, `/auth/forgot-password` mock).
- Perfil (`GET /users/me`).
- Credenciales CRUD (`/credentials`). El campo `encryptedPassword` **solo almacena ciphertext generado en el cliente**; la API no descifra ni debe recibir contraseñas en claro.
- **Sync (fase 2):** `POST/GET /sync/events`, `POST /devices/register`, `GET /devices` — blobs/opacos; ver [docs/SYNC_API.md](./docs/SYNC_API.md).

## Requisitos

- Node.js ≥ 22 (recomendado).
- Para **iOS**: macOS, Xcode, CocoaPods (`sudo gem install cocoapods`).
- Docker Desktop (opcional, para Postgres + API en contenedor).

### Scripts desde la raíz del monorepo

Tras `npm install` en la raíz (instala `concurrently` para el stack combinado):

| Comando | Qué hace |
|---------|----------|
| `npm run local:db` | Solo levanta **Postgres** con Docker (`docker compose up -d postgres`) en `:5432`. Útil si el API y la web corren en Node en tu máquina. En `backend/.env`, usa `DATABASE_HOST=localhost`. |
| `npm run local:backend` | NestJS en modo watch (`backend`). |
| `npm run local:web` | Vite dev server (`apps/web`, típicamente `:5173`). |
| `npm run local:mobile` | Metro bundler (`apps/mobile`). |
| `npm run local:stack` o `npm run local:dev` | **API + web** en paralelo (una terminal; Ctrl+C detiene ambos). |
| `npm run extension:pack` | Genera `apps/extension-chromium/dist/passtore-chromium-v*.zip` (Windows / PowerShell). En Linux/macOS usa `apps/extension-chromium/scripts/pack.sh`. |
| `npm run extension:pack:firefox` | Zip MV3 para **Firefox** (`passtore-firefox-v*.zip`). Unix: `apps/extension-chromium/scripts/pack-firefox.sh`. |
| `npm run extension:stage:firefox` | Carpeta `apps/extension-chromium/dist/firefox-unpacked/` para cargar complemento temporal en Firefox (`about:debugging`). |
| `npm run extension:safari:packager` | En Windows muestra que el packager Safari requiere macOS; en Mac ejecuta `./apps/extension-safari/scripts/packager.sh`. |
| `npm run desktop:dev` | Shell **Tauri** + Vite en `apps/web` (requiere [Rust/Cargo](https://rustup.rs/) en el PATH). |
| `npm run desktop:build` | Build instaladores del escritorio (`apps/desktop-tauri`). |
| `npm run cli:build` | Compila la CLI [`apps/cli`](./apps/cli/README.md) (`passtore`). |
| `npm run passtore -- --help` | Ejecuta la CLI compilada (tras `cli:build`): `node apps/cli/dist/cli.js`. Para comandos que llaman al API: `PASSTORE_TOKEN`; opcional `PASSTORE_API_BASE_URL`. |
| `npm run core:typecheck` | `tsc` en **`packages/core`**. |
| `npm run test:unit` | Tests unitarios: web + móvil (sin integración) + CLI + backend + paquete `crypto-contract`. |
| `npm run test:crypto-contract` | Contrato de cifrado entre web, móvil, CLI + vectores en `packages/crypto-contract`. |
| `npm run test:all` | `test:unit` + e2e backend + test de integración móvil (`App`). |
| `npm run test:e2e` | Jest e2e del backend (`/health`, etc.). |
| `npm run test:mobile` | Todos los tests Jest del móvil (unit + integración). |
| `npm run test:e2e:mobile` | Maestro Android (requiere emulador/dispositivo; ver `apps/mobile/e2e/`). |

La primera vez: copia `backend/.env.example` → `backend/.env`, instala dependencias en `backend/`, `apps/web/` y `apps/mobile/` según lo que vayas a usar. Para escritorio: `npm install --prefix apps/desktop-tauri` y [Rust](https://rustup.rs/) en el PATH.

## Instalación — web

```bash
cd apps/web
npm install
npm run dev
```

Abre `http://localhost:5173`. El backend debe estar en `http://localhost:3000` (o ajusta proxy / `VITE_API_BASE_URL`). En `backend/.env`, incluye `http://localhost:5173` en `CORS_ORIGINS` (ya está en `.env.example`).

Build estático:

```bash
cd apps/web
npm run build
npm run preview   # sirve la carpeta dist localmente
```

## Instalación — móvil

```bash
cd apps/mobile
npm install
```

### iOS (simulador o iPhone físico)

**En macOS:**

```bash
cd ios
bundle install   # si usas Gemfile de RN
bundle exec pod install
cd ..
```

Abre `apps/mobile/ios/PasstoreMobile.xcworkspace` en Xcode, selecciona tu equipo de firma para dispositivo físico y ejecuta.

Con Metro:

```bash
npm start
npm run ios -- --simulator "iPhone 16"
```

**iPhone físico y API en tu Mac**

1. Asegura que Mac y iPhone están en la misma red.
2. Obtén la IP LAN del Mac (ej. `192.168.1.10`).
3. En `apps/mobile/src/config/env.ts`, asigna:

   `export const DEV_API_HOST_OVERRIDE = '192.168.1.10';`

4. Levanta el backend accesible en `http://<IP>:3000`.
5. El simulador puede usar `localhost`; el dispositivo **no** — por eso la constante anterior.

**Pasos nativos obligatorios / revisión**

| Área | Qué hacer |
|------|-----------|
| Pods | Después de instalar dependencias nativas: `cd ios && pod install`. |
| Face ID | Ya existe `NSFaceIDUsageDescription` en `Info.plist`. |
| Sign In with Apple | Capability “Sign In with Apple” en Xcode + backend token verification (pendiente). |
| Google Sign-In | Crear OAuth Client en Google Cloud, añadir `GoogleService-Info.plist`, reversed client ID como URL scheme en Xcode (ver documentación de `@react-native-google-signin/google-signin`). |
| Keychain / biometría | `react-native-keychain` y `react-native-biometrics` requieren build real; en simulador Face ID está limitado. |

### Android (desarrollo)

```bash
npm run android
```

Emulador: el API en `http://10.0.2.2:3000` ya está contemplado en `getApiBaseUrl()`.

## Backend local (sin Docker, solo API + Postgres tú mismo)

```bash
cd backend
cp .env.example .env
# Ajusta DATABASE_* y JWT_SECRET
npm install
npm run start:dev
```

Equivalente desde la raíz: `npm run local:backend` (tras `npm install` dentro de `backend/`).

Asegúrate de tener PostgreSQL escuchando con la misma credencial que en `.env`, o ejecuta `npm run local:db` en la raíz para usar solo el contenedor de Postgres del compose.

## Docker Compose (Postgres + API + Web)

En la raíz del repo:

```bash
cp backend/.env.example backend/.env
# Opcional: edita JWT_SECRET, WEBAUTHN_* si usas otro host/puerto
docker compose up --build
```

Desde la raíz también puedes usar los scripts npm: `npm run docker:up:build` (equivalente), `npm run docker:up` sin rebuild, `npm run docker:down`, `npm run docker:logs`, etc.

- **API:** `http://localhost:3000`
- **Web (Nginx + estático Vite, proxy `/api` → backend):** `http://localhost:8080`
- **Postgres:** `localhost:5432` (usuario/clave `passtore` por defecto en `docker-compose.yml`).

La app **móvil** no se ejecuta dentro de Docker (simulador/dispositivo + Metro). Apunta el cliente al backend en la misma red (IP LAN + puerto `3000`, o el puerto que publiques). Ver `apps/mobile/src/config/env.ts`.

`DATABASE_SYNC=true` en el servicio `backend` permite crear tablas en entorno demo (no usar en producción sin migraciones).

### Passkeys (WebAuthn)

- Tras registrarte con email/contraseña, en **web** (cabecera “Passkey”) o **móvil** (Home → “＋Passkey”) puedes registrar una credencial en ese navegador/dispositivo.
- **Entrada solo con passkey:** en login, sección “solo passkey”: usuario + botón de passkey (sin contraseña).
- Variables en backend (ver `backend/.env.example`): `WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`, `WEBAUTHN_ORIGINS`. El **RP ID** debe coincidir con el host visible al usuario (`localhost` si entras por `http://localhost:8080`; para HTTPS en dominio real, usa ese dominio y añade el origen exacto en `WEBAUTHN_ORIGINS`).
- **Dispositivo físico / otro host:** si la app llama a `http://192.168.x.x:3000`, configura `WEBAUTHN_RP_ID` y orígenes acorde (en la práctica suele requerirse **HTTPS** y dominio con Associated Domains / Digital Asset Links para passkeys estables en móvil).

## Tests

Desde la **raíz del monorepo** (tras `npm install`):

| Comando | Alcance |
|---------|---------|
| `npm run test:unit` | Web (Vitest), móvil solo unitarios Jest (sin `integration`), CLI (Vitest), backend (`*.spec.ts`), paquete `packages/crypto-contract`. |
| `npm run test:crypto-contract` | Solo contrato AES entre web, móvil y CLI + vectores en `packages/crypto-contract`. |
| `npm run test:mobile` | Todo Jest del móvil (unit + integración). |
| `npm run test:all` | `test:unit` + e2e backend + integración móvil (`App`). |
| `npm run test:e2e` | Jest e2e HTTP del backend. |
| `npm run test:e2e:mobile` | Maestro en Android (emulador o dispositivo). |

Convención de carpetas y más detalle: **[docs/TESTING.md](./docs/TESTING.md)**.

Para ejecutar por paquete sin pasar por la raíz: `cd apps/web && npm test`, `cd apps/mobile && npm test`, `cd backend && npm test`, etc.

**E2E en dispositivo:** ver `apps/mobile/e2e/README.md` (Maestro).

## Decisiones técnicas

| Decisión | Motivo |
|----------|--------|
| React Native CLI (sin Expo) | Control total de nativos (Keychain, biometría, futuras extensiones). |
| Zustand | Estado de sesión ligero y síncrono con UI. |
| RTK Query | Cache, invalidación y contrato HTTP claros para la API. |
| Cifrado de cofre (`@passtore/vault-crypto`) | AES compartido entre web, móvil y CLI; validado por `test:crypto-contract` y por `packages/crypto-contract`. CryptoJS sigue en sitios puntuales (p. ej. generadores) donde conviene. |
| JWT en Keychain | Token no guardado en AsyncStorage sin cifrar. |
| JWT en web (sessionStorage) | Desaparece al cerrar la pestaña; CORS explícito hacia el origen de Vite. |
| Favicon | Servicio Google favicons por dominio + fallback visual en UI. |
| Web con Vite (no react-native-web) | Misma API y patrones (RTK Query, Zustand, `@passtore/core` / `@passtore/vault-crypto`) sin acoplar el bundle nativo. |

## Pendientes / mejoras

- La **clave de bóveda** en web (localStorage) y en móvil (Keychain) no se comparten: el ciphertext es compatible, pero hace falta un flujo de desbloqueo / sync si quieres misma clave en todos los dispositivos.
- OAuth Google/Apple con verificación en backend y enlaces reales.
- Migraciones TypeORM en lugar de `synchronize`.
- Autofill: seguir `apps/mobile/docs/autofill-roadmap.md`.
- ~~Passkeys/WebAuthn en backend y cliente.~~ (MVP: login/registro passkey en API + web + móvil; producción: HTTPS + dominio.)
- Endurecer derivación de clave de bóveda (Argon2 / PBKDF2 con parámetros auditados).

## Licencia

Uso interno / MVP — ajusta según tu organización.
