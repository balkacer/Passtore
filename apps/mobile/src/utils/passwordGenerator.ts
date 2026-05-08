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
