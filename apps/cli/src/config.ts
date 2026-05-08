export type CliConfig = {
  baseUrl: string;
  token: string | undefined;
  /** Misma clave del cofre que en la app (texto plano local); usada solo en esta máquina. */
  vaultKey: string | undefined;
};

export function loadConfig(): CliConfig {
  const raw = process.env.PASSTORE_API_BASE_URL ?? 'http://localhost:3000';
  const baseUrl = raw.replace(/\/$/, '');
  const token = process.env.PASSTORE_TOKEN?.trim() || undefined;
  const vaultKey = process.env.PASSTORE_VAULT_KEY?.trim() || undefined;
  return { baseUrl, token, vaultKey };
}

export function requireToken(token: string | undefined): asserts token is string {
  if (!token) {
    console.error(
      'Defina PASSTORE_TOKEN con un JWT de usuario (Authorization Bearer).',
    );
    process.exit(1);
  }
}

export function requireVaultKey(
  vaultKey: string | undefined,
): asserts vaultKey is string {
  if (!vaultKey) {
    console.error(
      'Defina PASSTORE_VAULT_KEY con la misma clave del cofre que usa la app (cifrado AES como en web/móvil).',
    );
    process.exit(1);
  }
}
