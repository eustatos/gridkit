import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react/index.ts',
    columns: 'src/columns/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  platform: 'browser',
  external: [
    '@tanstack/react-table',
    '@gridkit/core',
    'react',
    'react-dom'
  ],
  tsconfig: 'tsconfig.json',
  esbuildCssMinify: true,
})
