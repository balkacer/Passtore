import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dir, './src'),
      '@passtore/crypto-contract': path.resolve(
        dir,
        '../../packages/crypto-contract/src/index.ts',
      ),
      // vault-crypto builds to dist/ with `import ... from 'crypto-js'`; Rollup resolves from web root.
      'crypto-js': path.resolve(dir, 'node_modules/crypto-js'),
    },
  },
  server: {
    fs: {
      allow: [dir, path.resolve(dir, '../../packages')],
    },
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
