# Tests — layout del monorepo

Convención única para evitar mezclar `__tests__/`, carpetas sueltas en la raíz del app y `src/tests`.

## Apps (web, mobile, CLI)

| Tipo | Ubicación | Herramienta |
|------|-----------|-------------|
| Unit | `<app>/src/tests/unit/...` | Vitest (web, CLI) · Jest (mobile) |
| Integración (pocos smoke) | `<app>/src/tests/integration/...` | Jest (mobile: p. ej. render de `App`) |
| Setup / mocks globales | `<app>/src/tests/setup.ts` | Jest · Vitest `setupFiles` en web |

**No usar** en código propio:

- `__tests__/` junto a features (patrón Jest antiguo / RN template).
- `__tests__/` en la raíz del proyecto mobile (plantilla RN); los tests viven bajo `src/tests`.

Los únicos `__tests__` que debes ver son dentro de **`node_modules`** (dependencias).

## Backend (NestJS)

| Tipo | Ubicación |
|------|-----------|
| Unit | `backend/src/**/*.spec.ts` (colocado junto al módulo que prueba) |
| E2E HTTP | `backend/test/*.e2e-spec.ts` + `test/jest-e2e.json` |

## Paquetes (`packages/*`)

| Paquete | Unit |
|---------|------|
| `crypto-contract` | `packages/crypto-contract/tests/unit/*.test.ts` |
| `core`, `vault-crypto` | Por ahora solo typecheck / contratos vía apps; si añades tests, usa `packages/<name>/tests/unit/` |

## Scripts útiles (raíz del repo)

- `npm run test:unit` — unitarios en web, mobile (sin integración), CLI, backend, `crypto-contract`.
- `npm run test:mobile` — todos los tests Jest del móvil (unit + integración).
- `npm run test:crypto-contract` — contrato de cifrado entre apps + vectores del paquete.
- `npm run test:e2e` — e2e del backend.
- `npm run test:e2e:mobile` — Maestro (requiere dispositivo/emulador).
