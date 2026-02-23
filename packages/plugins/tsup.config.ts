import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/audit-log/index.ts',
    'src/analytics/index.ts',
    'src/export/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ['@gridkit/core', 'react'],
  esbuildOptions(options) {
    options.jsx = 'preserve';
  },
});
