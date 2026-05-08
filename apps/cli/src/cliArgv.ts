import * as readline from 'node:readline';

export function argFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith('-')) {
    return argv[i + 1];
  }
  return undefined;
}

export function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

export async function readOneLineFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin });
    rl.once('line', (line) => {
      rl.close();
      resolve(line.trimEnd());
    });
    rl.once('error', reject);
  });
}

/** Contraseña por `--password`, `--password-stdin` o error. */
export async function resolvePasswordFromArgv(argv: string[]): Promise<string> {
  const fromFlag = argFlag(argv, '--password');
  const useStdin = hasFlag(argv, '--password-stdin');
  if (fromFlag && useStdin) {
    console.error('Use solo uno de: --password o --password-stdin');
    process.exit(1);
  }
  if (useStdin) {
    const line = await readOneLineFromStdin();
    return line.trim();
  }
  if (fromFlag !== undefined) {
    return fromFlag;
  }
  console.error('Indique --password o --password-stdin');
  process.exit(1);
}
