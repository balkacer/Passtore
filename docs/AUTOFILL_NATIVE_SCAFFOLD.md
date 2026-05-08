# Autofill nativo — implementación actual

## Módulo React Native `PasstoreAutofill`

Expone métodos que llama `credentialProviderService.ts` tras CRUD en vault local:

| Método | Descripción |
|--------|-------------|
| `replaceIdentity(payload)` | Registra metadatos no secretos (`id`, `loginUsername`, `normalizedOrigin`, `url`, `alias`). |
| `removeIdentity(credentialId)` | Quita la entrada del índice nativo. |

**Android:** `com.passtoremobile.autofill.PasstoreAutofillModule` + `AutofillIdentityStore` (SharedPreferences JSON).

**iOS:** `PasstoreAutofill.m` — persiste en `NSUserDefaults` y sincroniza con `ASCredentialIdentityStore.saveCredentialIdentities` usando `ASPasswordCredentialIdentity` (sugerencias en la barra QuickType / Password AutoFill sin extensión Credential Provider aparte).

### Habilitación en el dispositivo

- **Android 8+:** Ajustes → Sistema → Idiomas e introducción de texto → Ayuda con la introducción de texto → Servicio de autofill → **Passtore Autofill**.
- **iOS:** Ajustes → Contraseñas → **Rellenar contraseñas** → activar Passtore (tras instalar la app y registrar identidades guardando credenciales).

---

## Android — `PasstoreAutofillService`

- Clase: `com.passtoremobile.autofill.PasstoreAutofillService`.
- Registrado en `AndroidManifest.xml` con `BIND_AUTOFILL_SERVICE`.
- En `onFillRequest`: obtiene el host web desde `AssistStructure` (p. ej. Chrome `webDomain`), busca la mejor coincidencia en el índice y devuelve un `Dataset` que rellena **usuario**; la contraseña se deja vacía (el secreto solo en la app).

---

## iOS — Credential Provider (Oleada D2)

Target **`PasstoreCredentialProvider`** (`CredentialProviderViewController.swift`): extensión **Credential Provider** que lee el mismo índice JSON que la app en **App Group** `group.org.reactjs.native.example.PasstoreMobile`.

| Pieza | Ubicación |
|-------|-----------|
| Extensión | `apps/mobile/ios/PasstoreCredentialProvider/` |
| Entitlements host | `PasstoreMobile/PasstoreMobile.entitlements` |
| Índice compartido | `PasstoreAutofill.m` persiste en `NSUserDefaults(suiteName:)` + migración desde `standardUserDefaults` |
| Bundle ID extensión | `org.reactjs.native.example.PasstoreMobile.CredentialProvider` |

La UI lista cuentas filtradas por dominio (`prepareCredentialList`) y devuelve **usuario + contraseña vacía** (misma política que QuickType: el secreto sigue en la app / cofre).

### Apple Developer (obligatorio para firma)

1. Registrar **App Group** idéntico al entitlements (`group.org.reactjs.native.example.PasstoreMobile` o el que adoptéis en producción).
2. En el App ID de la app principal: activar **App Groups** y **Password AutoFill / Credential Provider** según corresponda al tipo de ID.
3. Crear App ID para la extensión (`…CredentialProvider`) con **App Groups** enlazado al mismo grupo.
4. Regenerar **perfiles de provisión** (dev/distro) para **PasstoreMobile** y **PasstoreCredentialProvider**.
5. En Xcode, seleccionar **Team** en ambos targets si `DEVELOPMENT_TEAM` está vacío en el proyecto.

Referencias: [Password AutoFill](https://developer.apple.com/documentation/authenticationservices), [Credential Provider](https://developer.apple.com/documentation/authenticationservices/ascredentialproviderviewcontroller).

---

## Pruebas

- Unit: `credentialIndex.test.ts`, `autofillMatchingEngine.test.ts`.
- Dispositivo: guardar una credencial con URL, activar Passtore como proveedor de autofill, abrir un login en Chrome (Android) o Safari (iOS) y comprobar sugerencia de usuario.

---

## Límites y modelo de amenaza (Oleada D)

### Qué datos salen del cofre

| Superficie | Qué se guarda en el índice nativo | Secretos (contraseña / clave de cofre) |
|------------|-----------------------------------|----------------------------------------|
| Android `AutofillIdentityStore` | JSON en `SharedPreferences`: `id`, `loginUsername`, `normalizedOrigin` / `url`, `alias` | **No.** La contraseña no se escribe en el store ni en el `Dataset` de autofill (el campo password se rellena vacío en `PasstoreAutofillService`). |
| iOS `PasstoreAutofill` | `NSUserDefaults` + `ASCredentialIdentityStore` con `ASPasswordCredentialIdentity` (metadatos para QuickType) | **No** en el índice; el usuario debe completar el login desde la app o flujos que defináis después. |

Los almacenes nativos del índice **no están cifrados con la clave de bóveda**: solo deben contener metadatos equivalentes a “origen + usuario visible”, asumidos recuperables en el dispositivo. El cofre cifrado SQLite sigue siendo la fuente de verdad para ciphertext.

### Biometría (Face ID / Touch ID / Android biometría)

- **Desbloqueo del cofre** ocurre en la **app principal** cuando el usuario abre Passtore y usa la ruta vault existente.
- El **servicio de autofill de Android** y las **sugerencias iOS vía `ASCredentialIdentityStore`** no ejecutan por sí solos un prompt biométrico de terceros equivalente al de Keychain de Apple: si en el futuro se añade **Credential Provider Extension** (iOS) o flujos que exijan UI nativa, ahí se definiría cuándo mostrar biometría en extensión (requiere App Group + UX propia).

### Android — matching por dominio

- `PasstoreAutofillService` obtiene el host desde `AssistStructure` / `webDomain` (p. ej. Chrome).
- `findBestMatchingIdentity` prioriza **coincidencia exacta** de host; si no hay, usa `hostsMatch` (subdominio ↔ dominio registrado de forma conservadora).
- **WebViews y apps nativas** pueden no exponer `webDomain` como Chrome: en ese caso no habrá `FillResponse` aunque exista credencial.

### iOS — QuickType vs Credential Provider

- **Hoy:** la app publica identidades para la barra de sugerencias / Password AutoFill según `ASCredentialIdentityStore`.
- **No implementado:** target **Credential Provider Extension** + **App Groups** para compartir datos con una extensión empaquetada y UI de selección fuera de la app. Sin extensión, el alcance es el que permita el sistema con identidades registradas (ver [Password AutoFill](https://developer.apple.com/documentation/authenticationservices)).
- **Associated Domains** (`webcredentials:`) y provisioning siguen siendo requisitos de producción si se quiere asociación fuerte dominio ↔ app; ver `apps/mobile/docs/autofill-roadmap.md`.

### Sandbox y extensiones (futuro)

- Una extensión de credenciales corre en **proceso aislado**: no lee el SQLite de la app salvo **App Group** + diseño explícito de almacén compartido o IPC.
- Cualquier extensión debe repetir el principio: **no volcar la clave maestra** al contenedor compartido sin cifrado acorde; preferir solo índice opaco o desbloqueo por la app host.

---

## Referencias cruzadas

- Arquitectura general: [AUTOFILL_PLATFORM_ARCHITECTURE.md](./AUTOFILL_PLATFORM_ARCHITECTURE.md).
- Roadmap técnico histórico: [apps/mobile/docs/autofill-roadmap.md](../apps/mobile/docs/autofill-roadmap.md).
