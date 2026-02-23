import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/events/index.ts',
    'src/types/index.ts',
    'src/plugin/index.ts',
    'src/validation/index.ts',
    'src/performance/index.ts',
    'src/column/index.ts',
    'src/row/index.ts',
    'src/state/index.ts',
    'src/table/index.ts',
    'src/errors/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
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
  tsconfig: 'tsconfig.json',
  esbuildOptions: (options) => {
    // Override lib for build
    options.platform = 'browser';
    return options;
  },
});
