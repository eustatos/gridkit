import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Disable dts generation in tsup
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [],
  outDir: 'dist',
  shims: true,
  inject: [],
  platform: 'browser',
  skipNodeModulesBundle: true,
});
