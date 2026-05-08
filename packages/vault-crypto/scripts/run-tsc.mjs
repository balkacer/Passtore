/**
 * Runs the repo-local TypeScript compiler. npm often hoists deps so
 * `vault-crypto/node_modules` may not exist even after `npm ci` in an app.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const tscJsCandidates = [
  join(pkgRoot, 'node_modules/typescript/lib/tsc.js'),
  join(pkgRoot, '../../apps/web/node_modules/typescript/lib/tsc.js'),
  join(pkgRoot, '../../apps/mobile/node_modules/typescript/lib/tsc.js'),
  join(pkgRoot, '../../apps/cli/node_modules/typescript/lib/tsc.js'),
  join(pkgRoot, '../../node_modules/typescript/lib/tsc.js'),
];

for (const tscJs of tscJsCandidates) {
  if (existsSync(tscJs)) {
    const result = spawnSync(process.execPath, [tscJs, '-p', 'tsconfig.json'], {
      cwd: pkgRoot,
      stdio: 'inherit',
    });
    process.exit(result.status ?? 1);
  }
}

console.error(
  'vault-crypto: TypeScript compiler not found. Install deps first, e.g.:\n' +
    '  npm ci --prefix packages/vault-crypto\n' +
    '  or npm ci --prefix apps/web',
);
process.exit(1);
