/**
 * Vectores fijos para comprobar que web, móvil y CLI usan el mismo esquema
 * CryptoJS AES (`AES.encrypt(plain, key).toString()` / `AES.decrypt`).
 *
 * `CONTRACT_CIPHERTEXT` se generó una vez con la misma API que las apps:
 * `CryptoJS.AES.encrypt(CONTRACT_PLAINTEXT, CONTRACT_VAULT_KEY).toString()`
 */

export const CONTRACT_VAULT_KEY =
  'passtore-crypto-contract-v1-key-material';

/** Texto con Unicode + emoji para validar UTF-8 end-to-end. */
export const CONTRACT_PLAINTEXT = 'Cross-app üñ 🔑';

/**
 * Ciphertext de referencia (OpenSSL/CryptoJS salted). Cualquier app debe
 * poder descifrarlo a `CONTRACT_PLAINTEXT` con `CONTRACT_VAULT_KEY`.
 */
export const CONTRACT_CIPHERTEXT =
  'U2FsdGVkX19VuEJNF/ApiLC2jtue8HWPNSA3i5tzaznjuFFK+mN+kUnf6bYq96Np';
