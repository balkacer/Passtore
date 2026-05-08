/** Tests en `src/tests/**` — ver `docs/TESTING.md`. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.contract.test.ts'],
  },
  resolve: {
    alias: {
      '@passtore/crypto-contract': path.resolve(
        dir,
        '../../packages/crypto-contract/src/index.ts',
      ),
      '@passtore/vault-crypto': path.resolve(
        dir,
        '../../packages/vault-crypto/src/index.ts',
      ),
    },
  },
});
