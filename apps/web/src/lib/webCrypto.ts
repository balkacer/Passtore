/**
 * WebCrypto helpers. Credential field ciphertext stays CryptoJS-compatible with mobile
 * (`encryptSensitive` / `decryptSensitive`) so sync envelopes interoperate.
 */

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
