import type { CredentialDto } from '@passtore/core';
import {
  apiDelete,
  apiGetJson,
  apiPatchJson,
  apiPostJson,
} from './client.js';
import {
  argFlag,
  hasFlag,
  resolvePasswordFromArgv,
} from './cliArgv.js';
import { loadConfig, requireToken, requireVaultKey } from './config.js';
import { decryptSensitive, encryptSensitive } from '@passtore/vault-crypto';
import { generatePassword, parseGeneratorOpts } from './passwordGenerator.js';
import { evaluatePasswordStrength } from './passwordStrength.js';
import { isPlainPasswordDuplicate } from './vaultDuplicate.js';

function vaultUsage(): void {
  console.log(`Comandos vault (contraseñas vía API /credentials):

Variables:
  PASSTORE_TOKEN       JWT (obligatorio)
  PASSTORE_VAULT_KEY   Misma clave del cofre que la app (obligatorio para crear/editar/revelar)

  passtore vault list [--json]
      Lista credenciales (sin descifrar contraseñas).

  passtore vault show <id> [--json] [--reveal]
      Detalle; --reveal imprime contraseña y notas en claro (usa PASSTORE_VAULT_KEY).

  passtore vault add --alias A --platform P --login U [--url URL] [--category C]
      [--notes TEXT]
      [--password P | --password-stdin | --generate [--gen-length N] ...]
      Crea entrada. --generate usa el mismo generador que la app.

  passtore vault edit <id> [--alias A] [--platform P] [--login U] [--url URL]
      [--category C] [--notes TEXT]
      [--password P | --password-stdin | --generate [--gen-length N] ...]
      Actualiza solo los campos indicados.

  passtore vault delete <id>
      Elimina la credencial.

`);
}

function parseCredentialArray(data: unknown): CredentialDto[] {
  if (!Array.isArray(data)) {
    throw new Error('Respuesta inesperada: se esperaba un array');
  }
  return data as CredentialDto[];
}

async function resolvePlainPasswordForVault(
  argv: string[],
): Promise<string> {
  const useGen = hasFlag(argv, '--generate');
  const hasPwd =
    argFlag(argv, '--password') !== undefined ||
    hasFlag(argv, '--password-stdin');
  if (useGen && hasPwd) {
    console.error(
      'Use solo uno de: --generate o --password / --password-stdin',
    );
    process.exit(1);
  }
  if (useGen) {
    return generatePassword(parseGeneratorOpts(argv, 'vault'));
  }
  return resolvePasswordFromArgv(argv);
}

export async function dispatchVault(argv: string[]): Promise<void> {
  const sub = argv[0];
  if (!sub || sub === '-h' || sub === '--help' || sub === 'help') {
    vaultUsage();
    process.exit(sub && sub !== 'help' ? 0 : 1);
  }

  if (sub === 'list') {
    await cmdVaultList(argv.slice(1));
    return;
  }
  if (sub === 'show') {
    await cmdVaultShow(argv.slice(1));
    return;
  }
  if (sub === 'add') {
    await cmdVaultAdd(argv.slice(1));
    return;
  }
  if (sub === 'edit') {
    await cmdVaultEdit(argv.slice(1));
    return;
  }
  if (sub === 'delete') {
    await cmdVaultDelete(argv.slice(1));
    return;
  }

  console.error('Subcomando vault no reconocido. passtore vault --help');
  process.exit(1);
}

async function cmdVaultList(argv: string[]): Promise<void> {
  const { baseUrl, token } = loadConfig();
  requireToken(token);
  const asJson = hasFlag(argv, '--json');
  const data = await apiGetJson(baseUrl, token, '/credentials');
  const rows = parseCredentialArray(data);
  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (rows.length === 0) {
    console.error('(sin credenciales)');
    return;
  }
  for (const c of rows) {
    const url = c.url ?? '';
    console.log(
      `${c.id}\t${c.alias}\t${c.platformName}\t${c.loginUsername}\t${url}\t${c.updatedAt}`,
    );
  }
}

async function cmdVaultShow(argv: string[]): Promise<void> {
  const id = argv[0];
  if (!id || id.startsWith('-')) {
    console.error('Uso: passtore vault show <id> [--json] [--reveal]');
    process.exit(1);
  }
  const rest = argv.slice(1);
  const { baseUrl, token, vaultKey } = loadConfig();
  requireToken(token);
  const asJson = hasFlag(rest, '--json');
  const reveal = hasFlag(rest, '--reveal');

  const data = await apiGetJson(baseUrl, token, `/credentials/${id}`);
  const row = data as CredentialDto;

  if (reveal) {
    requireVaultKey(vaultKey);
    let plainPwd = '';
    let plainNotes = '';
    try {
      plainPwd = decryptSensitive(row.encryptedPassword, vaultKey);
    } catch {
      plainPwd = '(no se pudo descifrar la contraseña)';
    }
    if (row.notesEncrypted) {
      try {
        plainNotes = decryptSensitive(row.notesEncrypted, vaultKey);
      } catch {
        plainNotes = '(no se pudieron descifrar las notas)';
      }
    }
    const out = {
      id: row.id,
      alias: row.alias,
      platformName: row.platformName,
      url: row.url,
      loginUsername: row.loginUsername,
      iconUrl: row.iconUrl,
      strengthScore: row.strengthScore,
      isDuplicate: row.isDuplicate,
      category: row.category,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      passwordPlain: plainPwd,
      notesPlain: plainNotes || undefined,
    };
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  const safe = { ...row };
  delete (safe as { encryptedPassword?: string }).encryptedPassword;
  if (safe.notesEncrypted != null) {
    safe.notesEncrypted = '(cifrado)';
  }
  if (asJson) {
    console.log(JSON.stringify(safe, null, 2));
    return;
  }
  console.log(JSON.stringify(safe, null, 2));
}

async function cmdVaultAdd(argv: string[]): Promise<void> {
  const { baseUrl, token, vaultKey } = loadConfig();
  requireToken(token);
  requireVaultKey(vaultKey);

  const alias = argFlag(argv, '--alias');
  const platformName = argFlag(argv, '--platform');
  const loginUsername =
    argFlag(argv, '--login') ?? argFlag(argv, '--username');
  const url = argFlag(argv, '--url');
  const category = argFlag(argv, '--category');
  const notes = argFlag(argv, '--notes');

  if (!alias?.trim() || !platformName?.trim() || !loginUsername?.trim()) {
    console.error(
      'Obligatorio: --alias, --platform, --login (o --username)',
    );
    process.exit(1);
  }

  const plainPwd = await resolvePlainPasswordForVault(argv);
  if (!plainPwd) {
    console.error('La contraseña no puede estar vacía');
    process.exit(1);
  }

  const all = parseCredentialArray(
    await apiGetJson(baseUrl, token, '/credentials'),
  );
  const strength = evaluatePasswordStrength(plainPwd);
  const duplicate = isPlainPasswordDuplicate(plainPwd, vaultKey, all);

  const body = {
    alias: alias.trim(),
    platformName: platformName.trim(),
    url: url?.trim() || undefined,
    loginUsername: loginUsername.trim(),
    encryptedPassword: encryptSensitive(plainPwd, vaultKey),
    notesEncrypted: notes?.trim()
      ? encryptSensitive(notes.trim(), vaultKey)
      : undefined,
    strengthScore: strength.score,
    isDuplicate: duplicate,
    category: category?.trim() || undefined,
  };

  const created = await apiPostJson(baseUrl, token, '/credentials', body);
  console.log(JSON.stringify(created, null, 2));
}

async function cmdVaultEdit(argv: string[]): Promise<void> {
  const id = argv[0];
  if (!id || id.startsWith('-')) {
    console.error('Uso: passtore vault edit <id> [opciones]');
    process.exit(1);
  }
  const argvRest = argv.slice(1);

  const { baseUrl, token, vaultKey } = loadConfig();
  requireToken(token);
  requireVaultKey(vaultKey);

  const patch: Record<string, unknown> = {};
  const alias = argFlag(argvRest, '--alias');
  const platformName = argFlag(argvRest, '--platform');
  const loginUsername =
    argFlag(argvRest, '--login') ?? argFlag(argvRest, '--username');
  const url = argFlag(argvRest, '--url');
  const category = argFlag(argvRest, '--category');
  const notes = argFlag(argvRest, '--notes');

  if (alias !== undefined) patch.alias = alias.trim();
  if (platformName !== undefined) patch.platformName = platformName.trim();
  if (loginUsername !== undefined) patch.loginUsername = loginUsername.trim();
  if (url !== undefined) patch.url = url.trim() || null;
  if (category !== undefined) patch.category = category.trim() || null;

  const hasPwdFlag =
    argFlag(argvRest, '--password') !== undefined ||
    hasFlag(argvRest, '--password-stdin');
  const useGen = hasFlag(argvRest, '--generate');
  if (useGen && hasPwdFlag) {
    console.error(
      'Use solo uno de: --generate o --password / --password-stdin',
    );
    process.exit(1);
  }

  if (notes !== undefined) {
    patch.notesEncrypted = notes.trim()
      ? encryptSensitive(notes.trim(), vaultKey)
      : null;
  }

  if (hasPwdFlag || useGen) {
    const plainPwd = useGen
      ? generatePassword(parseGeneratorOpts(argvRest, 'vault'))
      : await resolvePasswordFromArgv(argvRest);
    if (!plainPwd) {
      console.error('La contraseña no puede estar vacía');
      process.exit(1);
    }
    const all = parseCredentialArray(
      await apiGetJson(baseUrl, token, '/credentials'),
    );
    patch.encryptedPassword = encryptSensitive(plainPwd, vaultKey);
    patch.strengthScore = evaluatePasswordStrength(plainPwd).score;
    patch.isDuplicate = isPlainPasswordDuplicate(plainPwd, vaultKey, all, id);
  }

  if (Object.keys(patch).length === 0) {
    console.error('Indique al menos un campo para actualizar');
    process.exit(1);
  }

  const updated = await apiPatchJson(
    baseUrl,
    token,
    `/credentials/${id}`,
    patch,
  );
  console.log(JSON.stringify(updated, null, 2));
}

async function cmdVaultDelete(argv: string[]): Promise<void> {
  const id = argv[0];
  if (!id || id.startsWith('-')) {
    console.error('Uso: passtore vault delete <id>');
    process.exit(1);
  }
  const { baseUrl, token } = loadConfig();
  requireToken(token);
  await apiDelete(baseUrl, token, `/credentials/${id}`);
  console.log(JSON.stringify({ ok: true, id }, null, 2));
}
