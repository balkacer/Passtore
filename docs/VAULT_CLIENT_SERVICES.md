# Contrato de servicios cliente — vault y claves

Ubicación en código (`apps/mobile/src/services/`):

| Servicio | Responsabilidad |
|----------|-----------------|
| **`encryptionService`** | Cifrado/descifrado de campos sensibles con material de clave ya disponible en memoria (`encryptSensitive` / `decryptSensitive`). Evolución recomendada: AES-GCM nativo. |
| **`secureStorageService`** | Persistencia en Keychain (JWT, **DEK de bóveda**). `ensureVaultKey()` es la única función que debe crear la clave aleatoria inicial. |
| **`keyManagementService`** | Fachada delgada sobre `secureStorageService` para enroll/clear DEK; usar cuando el dominio sea “gestión de claves” explícita. |
| **`vault/`** (`db.ts`, `migrations.ts`, `vaultRepository.ts`) | SQLite local: esquema versionado, CRUD de credenciales **ya cifradas** (mismo formato que enviaba la API). |

## Reglas

1. La UI obtiene `vaultKey` con `ensureVaultKey()` antes de cifrar contraseñas/notas.
2. El repositorio **no** descifra contraseñas; solo persiste ciphertext y metadatos (`normalized_origin`, etc.).
3. Con `USE_LOCAL_VAULT === true` (`src/config/featureFlags.ts`), RTK Query usa `VaultRepository` en lugar de REST para credenciales; auth sigue siendo API.
