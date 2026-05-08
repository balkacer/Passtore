import { copyToClipboard } from './clipboard.js';
import {
  generatePassword,
  parseGeneratorOpts,
} from './passwordGenerator.js';
import { evaluatePasswordStrength } from './passwordStrength.js';
import { apiGetJson } from './client.js';
import {
  argFlag,
  hasFlag,
  readOneLineFromStdin,
  resolvePasswordFromArgv,
} from './cliArgv.js';
import { loadConfig, requireToken, requireVaultKey } from './config.js';
import type { CredentialDto } from '@passtore/core';
import { isPlainPasswordDuplicate } from './vaultDuplicate.js';

function passwordUsage(): void {
  console.log(`Comandos password (sin llamar al API salvo duplicate):

  passtore password generate [--length N] [--no-uppercase] [--no-lowercase]
      [--no-numbers] [--no-symbols] [--allow-repeated] [--allow-ambiguous]
      [--count N] [--copy] [--json]
      Genera contraseña(s) con los mismos criterios que la app.

  passtore password strength [--json] [--stdin] [contraseña]
      Puntuación y etiqueta (weak/fair/good/strong). Sin argumento, usa --stdin.

  passtore password duplicate [--exclude-id <uuid>] [--password P | --password-stdin]
      Comprueba si la contraseña ya existe en el cofre (requiere PASSTORE_TOKEN + PASSTORE_VAULT_KEY).

`);
}

function parseCredentialArray(data: unknown): CredentialDto[] {
  if (!Array.isArray(data)) {
    throw new Error('Respuesta inesperada: se esperaba un array');
  }
  return data as CredentialDto[];
}

export async function dispatchPassword(argv: string[]): Promise<void> {
  const sub = argv[0];
  if (!sub || sub === '-h' || sub === '--help' || sub === 'help') {
    passwordUsage();
    process.exit(sub && sub !== 'help' ? 0 : 1);
  }

  if (sub === 'generate') {
    cmdPasswordGenerate(argv.slice(1));
    return;
  }
  if (sub === 'strength') {
    await cmdPasswordStrength(argv.slice(1));
    return;
  }
  if (sub === 'duplicate') {
    await cmdPasswordDuplicate(argv.slice(1));
    return;
  }

  console.error('Subcomando no reconocido. passtore password --help');
  process.exit(1);
}

function cmdPasswordGenerate(argv: string[]): void {
  const opts = parseGeneratorOpts(argv, 'cli');
  const countRaw = argFlag(argv, '--count');
  let count = 1;
  if (countRaw != null) {
    count = parseInt(countRaw, 10);
    if (!Number.isFinite(count) || count < 1 || count > 50) {
      console.error('--count debe estar entre 1 y 50');
      process.exit(1);
    }
  }
  const doCopy = hasFlag(argv, '--copy');
  const asJson = hasFlag(argv, '--json');

  const passwords: string[] = [];
  for (let i = 0; i < count; i++) {
    passwords.push(generatePassword(opts));
  }

  if (asJson) {
    console.log(JSON.stringify({ options: opts, passwords }, null, 2));
    return;
  }

  for (const p of passwords) {
    console.log(p);
  }

  if (doCopy) {
    const combined = passwords.join('\n');
    if (copyToClipboard(combined)) {
      console.error(
        count > 1
          ? '(copiadas al portapapeles)'
          : '(copiada al portapapeles)',
      );
    } else {
      console.error(
        '(no se pudo copiar al portapapeles; instala xclip/wl-copy en Linux o usa stdout)',
      );
    }
  }
}

async function cmdPasswordStrength(argv: string[]): Promise<void> {
  const asJson = hasFlag(argv, '--json');
  const useStdin = hasFlag(argv, '--stdin');
  const filtered = argv.filter((a) => a !== '--json' && a !== '--stdin');

  let plain: string;
  if (useStdin) {
    plain = (await readOneLineFromStdin()).trim();
  } else if (filtered.length > 0) {
    plain = filtered.join(' ').trim();
  } else {
    plain = (await readOneLineFromStdin()).trim();
  }

  if (!plain) {
    console.error('Indica una contraseña, posicional o por stdin (--stdin).');
    process.exit(1);
  }

  const r = evaluatePasswordStrength(plain);
  if (asJson) {
    console.log(JSON.stringify({ passwordLength: plain.length, ...r }, null, 2));
    return;
  }
  console.log(`score: ${r.score}\tlabel: ${r.label}`);
}

async function cmdPasswordDuplicate(argv: string[]): Promise<void> {
  const { baseUrl, token, vaultKey } = loadConfig();
  requireToken(token);
  requireVaultKey(vaultKey);

  const excludeId = argFlag(argv, '--exclude-id');
  const plain = await resolvePasswordFromArgv(argv);

  const all = parseCredentialArray(
    await apiGetJson(baseUrl, token, '/credentials'),
  );
  const dup = isPlainPasswordDuplicate(plain, vaultKey, all, excludeId);

  const out = {
    isDuplicate: dup,
    excludeId: excludeId ?? null,
  };
  console.log(JSON.stringify(out, null, 2));
  process.exitCode = dup ? 2 : 0;
}
