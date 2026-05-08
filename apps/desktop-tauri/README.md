# Passtore — escritorio (Tauri 2)

Empaqueta el build estático de **`apps/web`** (`vite build`). Desarrollo en caliente contra `npm run dev` en la web (`http://localhost:5173`).

## Requisitos

- **Rust** estable + **Cargo** ([rustup](https://rustup.rs/)).
- Node.js (misma versión que el monorepo).
- Backend en marcha si usas la API (p. ej. `http://localhost:3000`); en la web, `getApiBaseUrl()` usa por defecto `/api` — en dev el proxy de Vite reenvía a `:3000`. Para **build de producción** define `VITE_API_BASE_URL` al construir la web si el API no está en el mismo origen.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instala `@tauri-apps/cli`. |
| `npm run dev` | Ejecuta `beforeDevCommand` (Vite en `apps/web`) y abre la ventana Tauri. |
| `npm run build` | Ejecuta `beforeBuildCommand` (compila la web) y genera instaladores en `src-tauri/target/release/bundle/`. |
| `npm run icon` | Regenera iconos en `src-tauri/icons/` desde `../web/public/icons/pwa-icon.svg`. |

Desde la raíz del monorepo: `npm run desktop:dev` / `npm run desktop:build` (ver `package.json` raíz).

## Oleada C2 / C3

- **C2:** shell que sirve `apps/web/dist`.
- **C3:** esquema personalizado **`passtore://`** (plugin deep-link + `single-instance` con feature `deep-link` en Windows/Linux para reenviar la URL a la instancia en ejecución). La SPA usa `@tauri-apps/plugin-deep-link` (`getCurrent` + `onOpenUrl`) y navega a `/temp-auth/pair` o `/temp-auth/delivery`, alineado con `TEMPORARY_AUTH_SESSIONS.md` y `apps/mobile` (`passtore://temp-auth/pairing?sid=&code=`, `passtore://temp-auth/delivery?requestId=`).

**Probar en Windows (instalador o dev):** con la app ya abierta, desde cmd o Win+R:

`start passtore://temp-auth/pairing?sid=test&code=abc`

(o delivery: `start passtore://temp-auth/delivery?requestId=…`). La primera vez el SO puede pedir asociar el protocolo al binario.

**C4:** CI multi-OS en GitHub Actions — workflow [`desktop-tauri.yml`](../../.github/workflows/desktop-tauri.yml): matrix **Ubuntu / Windows / macOS**, `npm ci` en `apps/web` y `apps/desktop-tauri`, `cargo`/Rust estable, artefactos en `src-tauri/target/release/bundle/` por job (sin firma de código en CI).

### Verificación automática (local o antes de release)

Desde el repo:

1. **`apps/web`:** `npm run test` — incluye paridad del parser `passtore://` con móvil (`parseTempAuthDeepLink.test.ts`).
2. **`apps/web`:** `npm run build` — debe terminar sin errores de TypeScript/Vite.
3. **`apps/desktop-tauri`:** con Rust en PATH, `cd src-tauri && cargo check` o `npm run build` en esta carpeta — valida plugins deep-link / single-instance.

### Verificación manual (escritorio)

1. `npm run desktop:dev` desde la raíz del monorepo (o `npm run dev` en `apps/desktop-tauri`).
2. Abre **Cliente temporal** y comprueba la UI; luego prueba los `start passtore://…` de arriba con la ventana ya abierta: debe navegar a emparejamiento o entrega sin segunda ventana huérfana.

Ver [ADR-002](../../docs/adr/ADR-002-tauri-desktop-shell.md).
