# ADR-002: Shell de escritorio — Tauri frente a Electron

## Estado

Aceptada (recomendación para Oleada C)

## Contexto

Passtore necesita un **cliente de escritorio** empaquetado (Windows, macOS, Linux) que:

- Incruste la SPA existente (`apps/web` tras `vite build`) o una vista equivalente, **sin duplicar** la lógica de negocio del navegador.
- Permita **deep links** `passtore://` alineados con móvil (`TEMPORARY_AUTH_SESSIONS.md`, pairing / delivery).
- Mantenga una superficie de actualización y seguridad razonable frente a XSS en la vista web y permisos del proceso nativo.

Oleada **C1** del plan de cobertura exige fijar el stack antes de implementar la shell (**C2–C4**).

## Opciones consideradas

### A — Tauri (v2)

- **Runtime:** Rust en el proceso nativo; UI = WebView del sistema (WebView2, WKWebView, WebKitGTK).
- **IPC:** comandos tipados Rust ↔ frontend; sin Node en el proceso pesado del renderer por defecto.
- **Tamaño:** instaladores notablemente más pequeños que Electron en configuraciones típicas.
- **Coste:** toolchain **Rust** obligatorio para compilar el shell y mantener código nativo (aunque sea acotado).

### B — Electron

- **Runtime:** Chromium embebido + Node.js en el proceso principal.
- **Ecosistema:** muy amplio; muchos ejemplos MV3/extension-related docs apuntan a Chrome/Chromium.
- **Tamaño / RAM:** binarios grandes; huella de memoria mayor.
- **Coste:** el equipo puede vivir solo en **TypeScript/JavaScript** si ya domina la web.

### C — Otros (fuera de alcance inmediato)

PWAs instaladas, Neutralino, Flutter Desktop — descartados como decisión principal para **paridad directa con `apps/web`** y menor churn.

## Decisión

Adoptar **Tauri 2** como stack **objetivo** para la aplicación de escritorio Passtore (`apps/desktop-tauri` o nombre equivalente en monorepo):

1. Mejor encaje con **menor superficie** en el bundle de escritorio y proceso nativo acotado frente a Chromium completo.
2. Los comandos IPC de Tauri permiten exponer solo lo necesario (protocolo custom, keychain/OS credential APIs más adelante).
3. El frontend sigue siendo la SPA React ya existente; no impone reescribir UI.

**Electron** queda como **alternativa explícita** si el equipo decide priorizar **velocidad de entrega** y **cero curva Rust** en CI/local: misma SPA cargada en `BrowserWindow`, mismo protocolo personalizado vía `app.setAsDefaultProtocolClient`.

## Consecuencias

**Positivas**

- Instaladores más ligeros y menor uso típico de RAM vs empaquetar Chromium completo.
- IPC claro entre shell nativo y UI web para `passtore://` y futuras integraciones OS.

**Negativas**

- Instalar y mantener **Rust + Tauri CLI** en desarrollo y CI (imagen de build con `rustc`, targets por OS).
- Curva de aprendizaje Rust para quien toque `src-tauri` (aunque el código inicial puede ser mínimo).

## Implementación posterior (no parte de este ADR)

- ~~Crear proyecto Tauri apuntando al `dist` de `apps/web`.~~ Hecho: `apps/desktop-tauri` (Oleada **C2**).
- ~~Registrar esquema `passtore` en cada SO según documentación Tauri (deep links) — Oleada **C3**.~~ Hecho: `tauri-plugin-deep-link`, `tauri.conf.json` `plugins.deep-link.desktop.schemes`, `TauriDeepLinkBridge` en `apps/web`.
- ~~CI: matrices por OS para artefactos (Oleada **C4**).~~ Hecho: `.github/workflows/desktop-tauri.yml`.

## Referencias

- [PLATFORM_COVERAGE_PLAN.md](../PLATFORM_COVERAGE_PLAN.md) — Oleada C
- [TEMPORARY_AUTH_SESSIONS.md](../TEMPORARY_AUTH_SESSIONS.md)
- [Tauri — Overview](https://v2.tauri.app/start/)
