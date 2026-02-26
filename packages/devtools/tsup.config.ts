import { defineConfig } from 'tsup'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export default defineConfig({
  entry: ['index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Exclude files that should not be bundled into the package
  // Extension files are handled separately by webpack
})
