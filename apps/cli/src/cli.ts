#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SyncEnvelopeApi } from '@passtore/core';
import { loadConfig, requireToken } from './config.js';
import { apiGetJson, pullSyncPage } from './client.js';
import { dispatchVault } from './vault.js';
import { dispatchPassword } from './passwordCli.js';

async function maybeInteractiveUi(argv: string[]): Promise<boolean> {
  const isUiCmd = argv[0] === 'ui';
  const isBare =
    argv.length === 0 ||
    (argv.length === 1 && (argv[0] === '-i' || argv[0] === '--interactive'));
  const tty = process.stdin.isTTY && process.stdout.isTTY;
  if (!isUiCmd && !isBare) {
    return false;
  }
  if (!tty) {
    if (isUiCmd || argv[0] === '-i' || argv[0] === '--interactive') {
      console.error(
        'La interfaz interactiva (Ink) requiere una terminal TTY (no pipes/redirección).',
      );
      process.exit(1);
    }
    return false;
  }
  const { runTui } = await import('./tui/runTui.js');
  await runTui();
  return true;
}

function usage(): void {
  console.log(`Passtore CLI — cofre, sync opaco, dispositivos

Variables de entorno:
  PASSTORE_API_BASE_URL   Base del API (default: http://localhost:3000)
  PASSTORE_TOKEN          JWT obligatorio para comandos que llaman al API
  PASSTORE_VAULT_KEY      Clave del cofre (misma que la app) — vault add/edit/show --reveal

Comandos password (generar / analizar; duplicate usa API):
  passtore password generate [--length N] [--copy] ...
  passtore password strength [--stdin] [contraseña]
  passtore password duplicate [--exclude-id id] [--password-stdin]
  passtore password --help

Comandos vault (contraseñas):
  passtore vault list [--json]
  passtore vault show <id> [--json] [--reveal]
  passtore vault add ... [--password ... | --password-stdin | --generate]
  passtore vault edit <id> ... [--password ... | --password-stdin | --generate]
  passtore vault delete <id>
  passtore vault --help

Sync y dispositivos:
  passtore sync pull [--limit N] [--cursor C]
      Una página GET /sync/events. Imprime JSON (incluye nextCursor).

  passtore sync backup [--out PATH] [--limit N]
      Pagina hasta agotar eventos y escribe JSON con todos los blobs cifrados.
      Default --out: passtore-sync-backup.json en el cwd.

  passtore devices list
      GET /devices — JSON en stdout.

Interfaz tipo app (terminal):
  passtore ui
  passtore --interactive    alias -i
  (sin argumentos en una TTY abre la misma UI)

  passtore --help
`);
}

function argFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith('-')) {
    return argv[i + 1];
  }
  return undefined;
}

function parseLimit(argv: string[], defaultLimit: number): number {
  const raw = argFlag(argv, '--limit');
  if (!raw) return defaultLimit;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    console.error('--limit debe ser un entero ≥ 1');
    process.exit(1);
  }
  return Math.min(n, 500);
}

async function cmdSyncPull(argv: string[]): Promise<void> {
  const { baseUrl, token } = loadConfig();
  requireToken(token);
  const limit = parseLimit(argv, 100);
  const cursor = argFlag(argv, '--cursor');
  const page = await pullSyncPage(baseUrl, token, cursor, limit);
  console.log(JSON.stringify(page, null, 2));
}

async function cmdSyncBackup(argv: string[]): Promise<void> {
  const { baseUrl, token } = loadConfig();
  requireToken(token);
  const limit = parseLimit(argv, 500);
  const outPath =
    argFlag(argv, '--out') ??
    path.join(process.cwd(), 'passtore-sync-backup.json');

  const events: SyncEnvelopeApi[] = [];
  let cursor: string | undefined;
  let lastServerTime = '';

  for (;;) {
    const page = await pullSyncPage(baseUrl, token, cursor, limit);
    lastServerTime = page.serverTime;
    events.push(...page.events);
    if (page.events.length === 0) break;
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    baseUrl,
    serverTime: lastServerTime,
    eventCount: events.length,
    events,
  };

  await writeFile(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.error(`Escrito ${events.length} eventos en ${outPath}`);
}

async function cmdDevicesList(): Promise<void> {
  const { baseUrl, token } = loadConfig();
  requireToken(token);
  const data = await apiGetJson(baseUrl, token, '/devices');
  console.log(JSON.stringify(data, null, 2));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === '-h' || argv[0] === '--help' || argv[0] === 'help') {
    usage();
    process.exit(0);
  }

  if (await maybeInteractiveUi(argv)) {
    return;
  }

  if (argv.length === 0) {
    usage();
    process.exit(1);
  }

  const [a, b] = argv;
  if (a === 'sync' && b === 'pull') {
    await cmdSyncPull(argv.slice(2));
    return;
  }
  if (a === 'sync' && b === 'backup') {
    await cmdSyncBackup(argv.slice(2));
    return;
  }
  if (a === 'devices' && b === 'list') {
    await cmdDevicesList();
    return;
  }
  if (a === 'vault') {
    await dispatchVault(argv.slice(1));
    return;
  }
  if (a === 'password') {
    await dispatchPassword(argv.slice(1));
    return;
  }

  console.error('Comando no reconocido. Usa: passtore --help');
  process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
