import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@gridkit/core',
  ],
  
  outDir: 'dist',
  
  esbuildOptions(options) {
    options.jsx = 'automatic';
    options.jsxDev = false;
    options.conditions = ['module', 'import'];
  },
  
  banner: {
    js: '// @gridkit/react - React adapter for GridKit',
  },
  
  watch: process.env.NODE_ENV === 'development',
  
  platform: 'browser',
  target: 'es2022',
});
