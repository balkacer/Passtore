# Autofill y Credential Provider (roadmap técnico)

Implementación actual y límites (modelo de amenaza, Face ID, sandbox): [`docs/AUTOFILL_NATIVE_SCAFFOLD.md`](../../docs/AUTOFILL_NATIVE_SCAFFOLD.md).

Este documento describe cómo integrar Passtore con los sistemas de autofill del SO sin implementar aún extensiones nativas completas.

## iOS — Password AutoFill y Credential Provider Extension

1. **Associated Domains**: registra `webcredentials:tu-dominio.com` en el Apple Developer Portal y habilita **Associated Domains** en el target de la app (capability).
2. **Credential Provider Extension**: en el repo existe el target **PasstoreCredentialProvider** (`ios/PasstoreCredentialProvider/`). Apple provee `ASCredentialProviderViewController` como punto de entrada UI para elegir credenciales.
3. **ASCredentialIdentityStore**: desde la extensión, expone identidades (`ASPasswordCredentialIdentity`) al sistema para que Safari y apps llamen a Passtore cuando el usuario selecciona una entrada.
4. **App Groups**: comparte el almacén cifrado entre la app principal y la extensión mediante un contenedor **App Group** (`group.com.tuorg.passtore`). La misma `encryptionService` debe poder leer la clave de bóveda desde Keychain con **access group** compartido (ajustar `secureStorageService`).
5. **Passkeys / WebAuthn**: futura capa encima de `credentialProviderService` usando **AuthenticationServices** (`ASAuthorizationPlatformPublicKeyCredentialProvider`).

## Android — Autofill Service

1. Declara un servicio que extienda `android.service.autofill.AutofillService` en `AndroidManifest.xml` con permiso `BIND_AUTOFILL_SERVICE`.
2. Implementa `onFillRequest`: construye un `FillResponse` con `Dataset` que incluye usuario y contraseña (solo tras desbloqueo local/biometría).
3. **AssistStructure**: usa la jerarquía de vistas para detectar campos `AUTOFILL_HINT_PASSWORD` / `USERNAME`.
4. Comparte datos con la app principal vía **EncryptedSharedPreferences** o base local cifrada accesible solo desde el mismo proceso/firma.

## Reconocimiento por el sistema

- **iOS**: el usuario debe habilitar Passtore en **Ajustes → Contraseñas → Contraseñas de apps y sitios web** y seleccionar Passtore como proveedor cuando exista la extensión.
- **Android**: **Ajustes → Sistema → Idiomas y entrada → Avanzado → Servicio de autofill**.

## Placeholders en el código

- `src/services/autofill/autofillService.ts`: punto único para registrar credenciales expuestas al SO cuando exista bridge nativo.
- `src/services/credential-provider/credentialProviderService.ts`: sincronización de identidades con la extensión iOS.

Próximos pasos: definir formato estable de metadatos (dominio, `serviceIdentifier`) al guardar credenciales para mapear URLs visitadas a entradas del cofre.
