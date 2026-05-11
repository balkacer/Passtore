# Temporary auth sessions

Short-lived, limited-scope access for **non-primary clients**. The full vault is never synced; the API returns **one credential at a time** (ciphertext only).

## Intended use (product)

The main mental model is **“I am on someone else’s machine (or a machine I do not trust long-term)”**: open the **web app in a normal browser tab** or use a **desktop Passtore** session, pair from that context with your phone, fetch **one** credential, then **leave** (close the tab, revoke the session, or walk away). Examples: a friend’s laptop, a hotel business center, a shared lab PC.

**Browser extension** is *not* the primary story for temporary auth: installing an extension just to paste one password and uninstall is awkward and confusing. Today the Chromium extension may still use the same temporary JWT transport for MV reasons; longer term, a **logged-in extension** (normal user session + vault unlock in-extension) is a better fit for day-to-day autofill. Temporary pairing remains the right tool for **guest browser / one-off desktop** flows, not for “extension as the default way to use Passtore.”

## Security model

- **Pairing**: requesting client calls `POST /temporary-auth/pairing/init` and gets `sessionId`, plaintext `pairingCode`, `deepLink` (`passtore://temp-auth/pairing?sid=&code=`), and `qrPayload` (for QR). The server stores only `SHA256(pepper | code)`.
- **Approval**: the primary device authenticates with the normal user JWT, proves biometric locally, and calls `POST /temporary-auth/pairing/:sessionId/approve` with `pairingCode` and `devicePublicId` (must exist in `registered_devices`).
- **Temporary JWT**: after approval, clients poll `GET /temporary-auth/pairing/:sessionId/status` with header `X-Pairing-Code` or `?code=` until status is `active`; response includes `temporaryAccessToken` (JWT with claims `typ: temporary_session`, `sid`, `sub`).
- **Delivery (sesión temporal)**: `POST /temporary-auth/deliver` with `Authorization: Bearer <temporary token>` and body `{ credentialId, requestedOrigin, purpose }`. Origin must match `allowedOrigin` (hostname rules). If `requireBiometricPerSensitiveRequest` is true, **copy** and **reveal** create a pending row; the API returns `approvalDeepLink` (`passtore://temp-auth/delivery?requestId=`) for opening the primary app. The primary device approves with `POST /temporary-auth/deliveries/:requestId/approve`. The requesting client then polls `GET /temporary-auth/deliveries/:requestId/poll` until `status: ready` (single ciphertext payload; subsequent polls return `already_delivered`).
- **Extension autofill (JWT de usuario)**: `POST /temporary-auth/extension-autofill` with `Authorization: Bearer <user access JWT>` and body `{ credentialId, requestedOrigin }`. Solo autofill de `loginUsername`; el origen solicitado debe ser compatible con la URL guardada en la credencial (si existe). Pensado para la extensión del navegador enlazada a la sesión web.
- **Revocation**: `DELETE /temporary-auth/sessions/:sessionId` or `POST /temporary-auth/sessions/revoke-all` with the user JWT.
- **Audit**: rows in `temporary_auth_audit`; list with `GET /temporary-auth/sessions/:sessionId/audit` (user JWT).

## Environment

See `backend/.env.example`: `TEMPORARY_PAIRING_PEPPER`, `TEMPORARY_PAIRING_TTL_MS`, `TEMPORARY_SESSION_TTL_MS`, `TEMPORARY_REQUEST_TTL_MS`.

## Mobile

- **Deep links**: registered scheme `passtore` (Android `intent-filter`, iOS `CFBundleURLTypes`). Paths: `passtore://temp-auth/pairing?sid=&code=` and `passtore://temp-auth/delivery?requestId=`. Cold start and warm links set a pending intent; after JWT hydration, navigation opens `TempAuthPairing` / `TempAuthDelivery` for biometric approval.
- **Local audit**: ring buffer in AsyncStorage via `appendTempAuthAudit` / `listTempAuthAudit` / `clearTempAuthAudit` in `apps/mobile/src/services/temp-auth/tempAuthLocalAudit.ts` (complements server `temporary_auth_audit`).
- **Pantalla en app**: `SecurityTempAuth` — lista sesiones del servidor, revocar una o todas, historial local y sección de ideas para ampliar ajustes (notificaciones, preferencias, dominios, etc.). Acceso desde Home → **Seguridad**.
- RTK: `approveTemporaryPairing`, `approveTemporaryDelivery`, `temporaryAuthSessions`, `revokeTemporarySession`, `revokeAllTemporarySessions` in `apps/mobile/src/store/rtk/passtoreApi.ts` (tag `TemporaryAuthSession` para invalidar lista tras mutaciones).
