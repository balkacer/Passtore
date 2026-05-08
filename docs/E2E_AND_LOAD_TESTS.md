# E2E y pruebas de carga (Fase 7)

## Maestro (app móvil)

Flujos en `apps/mobile/e2e/maestro/`:

| Archivo | Uso |
|---------|-----|
| `smoke-android.yaml` | `appId` Android `com.passtoremobile` |
| `smoke-ios.yaml` | `appId` iOS según plantilla RN (`org.reactjs.native.example.PasstoreMobile`); ajústalo si cambias el bundle en Xcode |

**Instalación** (Mac): [Maestro](https://docs.maestro.dev/getting-started/installing-maestro).

**Ejecución** (con emulador/simulador y build instalada):

```bash
cd mobile
npm run e2e:maestro:android
# o
npm run e2e:maestro:ios
```

El smoke comprueba que tras lanzar la app sea visible el texto **Passtore** (pantalla de bienvenida sin sesión).

---

## Detox

El repo incluye `detox` como dependencia de desarrollo; no hay configuración `.detoxrc` versionada todavía. Cuando quieras estabilizar flujos en CI, genera la config con la CLI de Detox para tu RN 0.85 y añádela al repo.

---

## API — Jest E2E (Nest)

Prueba HTTP contra una app **mínima** (`HealthTestModule`: solo `AppController`), sin Postgres ni TypeORM — sirve para CI rápido:

```bash
cd backend
npm run test:e2e
```

El caso valida `GET /health`. Para pruebas de integración contra **AppModule** completo (DB real), añade otro archivo `*.e2e-spec.ts` que importe `AppModule` y ejecuta con Docker Compose en marcha.

---

## Carga sobre API (sin contenido sensible)

Script Node (fetch nativo, Node 22+): solo **`GET /health`**, sin JWT ni payloads de vault.

Con la API en marcha:

```bash
cd backend
npm run load:test
```

Variables opcionales:

| Variable | Default |
|----------|---------|
| `LOAD_TEST_BASE_URL` | `http://127.0.0.1:3000` |
| `LOAD_DURATION_MS` | `8000` |
| `LOAD_CONCURRENCY` | `20` |

Salida: JSON con duración, ráfagas correctas/fallidas y peticiones aproximadas.

Para cargas más realistas (perfiles rps, escenarios), valorar [k6](https://k6.io/) apuntando también solo a `/health` o a endpoints públicos documentados.
