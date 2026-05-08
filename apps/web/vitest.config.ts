/** Tests en `src/tests/**` — convención global en `docs/TESTING.md`. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Config de tests **sin** `@vitejs/plugin-react`: en Vitest 4 el bundle del runner
 * puede romper `describe()` si se mezcla con el plugin de React en algunos entornos.
 */
const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dir, './src'),
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
  test: {
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
