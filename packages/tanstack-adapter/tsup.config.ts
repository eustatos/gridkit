import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    tsconfig: 'tsconfig.dts.json',
  },
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
