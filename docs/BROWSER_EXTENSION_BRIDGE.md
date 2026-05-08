# Bridge con la extensión de navegador

Contrato compartido entre la app web, el futuro *content script* y el *background* de la extensión. La implementación vive en el cliente móvil como *stub* exportable; la web reutilizará el mismo shape de mensajes al conectar el host.

## Ubicación en el repo

- Contrato TypeScript (stub): `apps/mobile/src/services/browser-extension/browserExtensionBridge.ts`
- Extensión Chromium (MV3; `PING` y temporary-auth por mensajes al service worker): `apps/extension-chromium/` (ver `README.md` en esa carpeta)

## Tipos de mensaje

| Mensaje | Dirección | Uso |
|--------|-----------|-----|
| `REQUEST_FILL` | extensión → app | Pedir rellenar con `credentialId` (y opcionalmente `frameOrigin` para comprobar el origen). |
| `PASSTORE_AUTOFILL` | background → content script | Rellenar **usuario** en el DOM (`loginUsername` en claro tras `/temporary-auth/deliver`). Implementado en `apps/extension-chromium/content.js`. |
| `UNLOCK_SESSION` | extensión → app | Indicar que el usuario debe desbloquear el vault en la app (no enviar claves en claro). |
| `PING` / `PONG` | ambas | *Health check* con `nonce` correlacionado. |

Respuestas: `PONG` (eco del *nonce*), `ERROR` con `code` estable para telemetría o UI.

## Reglas de seguridad

1. **Nunca** cruzar la frontera con contraseñas en claro sin un desbloqueo local (vault key en memoria tras biometría o contraseña maestra, según producto).
2. El *content script* no debe almacenar el material de cifrado; solo reenvía identificadores opacos y orígenes.
3. Orígenes y `credentialId` deben validarse en el *host* (página de Passtore o *side panel*) antes de rellenar en un *frame*.

## Próximos pasos de implementación

- `postMessage` desde *iframe* / *side panel* hacia la app web embebida, o *native messaging* en entornos que lo permitan.
- Registro de orígenes de confianza alineado con [AUTOFILL_PLATFORM_ARCHITECTURE.md](./AUTOFILL_PLATFORM_ARCHITECTURE.md) (si existe) y con el *matching engine* en `autofillMatchingEngine`.
