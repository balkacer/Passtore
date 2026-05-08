# Autofill multiplataforma — arquitectura

Este documento amplía `apps/mobile/docs/autofill-roadmap.md` con la capa común que debe permanecer **agnóstica del SO**.

## Componentes

### `autofillMatchingEngine`

Responsabilidad: dado un **contexto de relleno**, producir una lista ordenada de **candidate credential ids** usando solo **metadatos locales** (tras desbloqueo, descifrar campos necesarios).

**Entrada (conceptual)**

- `normalizedOrigin` (eTLD+1 o esquema + host)
- `pathPrefix` opcional
- Android: `packageName`
- iOS: `bundleIdentifier` (cuando aplique)

**Salida**

- Lista de `{ credentialId, score, reasons[] }`

**Estrategia**

1. Normalizar URL (quitar tracking params, forzar HTTPS canonical host).
2. Filtrar por coincidencia exacta de dominio → subdominio → path.
3. Penalizar entradas antiguas o sin uso.
4. Nunca enviar contraseñas al servidor para “ranking”.

Implementación inicial: ver `apps/mobile/src/services/autofill/autofillMatchingEngine.ts` y el mapeo vault → índice en `apps/mobile/src/services/autofill/credentialIndex.ts`.

---

### `autofillService`

Fachada para **registrar** credenciales en el almacén del SO cuando el bridge exista (Android/iOS). La app principal llama tras crear/editar entrada local.

---

### `credentialProviderService`

Puente hacia **ASCredentialIdentityStore** (iOS) y equivalentes; sincroniza identidades no secretas (usuario + dominio) para sugerencias rápidas.

---

### `browserExtensionBridge`

Contrato futuro para mensajería:

- **Manifest V3** extension ↔ **native host** (desktop) o **content script** ↔ app web.
- Payloads: solo **ids** y **acciones** (“fill”, “unlock”) — el descifrado ocurre en el proceso que tiene la DEK.

---

## Biometría y autofill

Flujo recomendado:

1. Usuario invoca autofill.
2. Extensión/SO pide **dataset**.
3. Passtore muestra UI de desbloqueo si la sesión local expiró.
4. Tras biometría, se construye `FillResponse` / `ASPasswordCredential`.

---

## Investigación continua

- **iOS**: Associated Domains + Credential Provider Extension + App Groups.
- **Android**: `AutofillService`, `FillResponse`, detección de `View` hints.
- **Extension**: CSP y aislamiento; minimizar superficie XSS en página web.
