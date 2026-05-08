import CryptoJS from 'crypto-js';

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeRepeated: boolean;
  excludeAmbiguous: boolean;
}

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const NUM = '23456789';
const SYM = '!@#$%^&*()-_=+[]{}';

const AMBIGUOUS = new Set(['O', '0', 'o', 'l', 'I', '1', '|']);

function filterCharset(base: string, excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous) {
    return base;
  }
  return [...base].filter((c) => !AMBIGUOUS.has(c)).join('');
}

function buildPool(opts: GeneratorOptions): string {
  let pool = '';
  if (opts.uppercase) {
    pool += filterCharset(UPPER, opts.excludeAmbiguous);
  }
  if (opts.lowercase) {
    pool += filterCharset(LOWER, opts.excludeAmbiguous);
  }
  if (opts.numbers) {
    pool += filterCharset(NUM, opts.excludeAmbiguous);
  }
  if (opts.symbols) {
    pool += SYM;
  }
  if (!pool) {
    pool = filterCharset(LOWER + UPPER + NUM, opts.excludeAmbiguous);
  }
  return pool;
}

function secureRandomIndex(max: number): number {
  if (max <= 0) {
    return 0;
  }
  const words = CryptoJS.lib.WordArray.random(4);
  const n = parseInt(words.toString(CryptoJS.enc.Hex).slice(0, 8), 16);
  return n % max;
}

export function generatePassword(opts: GeneratorOptions): string {
  const pool = buildPool(opts);
  const chars: string[] = [];
  const used = new Set<string>();

  const pick = () => {
    let c = pool[secureRandomIndex(pool.length)];
    let guard = 0;
    while (
      opts.excludeRepeated &&
      used.has(c) &&
      used.size < pool.length &&
      guard++ < 64
    ) {
      c = pool[secureRandomIndex(pool.length)];
    }
    used.add(c);
    chars.push(c);
  };

  for (let i = 0; i < opts.length; i++) {
    pick();
  }

  return chars.join('');
}

/** Mismos defaults que `PasswordGenerator` en web/móvil. */
export function defaultGeneratorOptions(): GeneratorOptions {
  return {
    length: 18,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeRepeated: true,
    excludeAmbiguous: true,
  };
}

function argFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith('-')) {
    return argv[i + 1];
  }
  return undefined;
}

function hasFlag(argv: string[], name: string): boolean {
  return argv.includes(name);
}

/**
 * `cli`: flags `--length`, `--no-uppercase`, …
 * `vault`: `--gen-length`, `--gen-no-uppercase`, … (para `vault add/edit --generate`)
 */
export function parseGeneratorOpts(
  argv: string[],
  variant: 'cli' | 'vault',
): GeneratorOptions {
  const opts = defaultGeneratorOptions();
  const P = variant === 'vault' ? 'gen-' : '';

  const lenRaw = argFlag(argv, `--${P}length`);
  if (lenRaw != null) {
    const n = parseInt(lenRaw, 10);
    if (!Number.isFinite(n) || n < 4 || n > 128) {
      console.error(
        `${variant === 'vault' ? '--gen-length' : '--length'} debe estar entre 4 y 128`,
      );
      process.exit(1);
    }
    opts.length = n;
  }

  if (hasFlag(argv, `--${P}no-uppercase`)) opts.uppercase = false;
  if (hasFlag(argv, `--${P}no-lowercase`)) opts.lowercase = false;
  if (hasFlag(argv, `--${P}no-numbers`)) opts.numbers = false;
  if (hasFlag(argv, `--${P}no-symbols`)) opts.symbols = false;
  if (hasFlag(argv, `--${P}allow-repeated`)) opts.excludeRepeated = false;
  if (hasFlag(argv, `--${P}allow-ambiguous`)) opts.excludeAmbiguous = false;

  return opts;
}
