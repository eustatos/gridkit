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
  noExternal: ['react', 'react-dom'],
  // After build, copy subdirectories to dist
  esbuildPlugins: [
    {
      name: 'copy-subdirectories',
      setup(build) {
        build.onEnd(() => {
          console.log('[tsup-plugin] Starting copy-subdirectories')
          
          // Copy backend/ to dist/backend/ (excluding __tests__)
          const backendSrc = path.join(process.cwd(), 'backend')
          const backendDest = path.join(process.cwd(), 'dist', 'backend')
          console.log('[tsup-plugin] backendSrc:', backendSrc)
          console.log('[tsup-plugin] backendDest:', backendDest)
          if (fs.existsSync(backendSrc)) {
            console.log('[tsup-plugin] backend contents:', fs.readdirSync(backendSrc))
            fs.rmSync(backendDest, { recursive: true, force: true })
            fs.mkdirSync(backendDest, { recursive: true })
            // Use shell command to exclude __tests__
            execSync(`cp -r "${backendSrc}"/* "${backendDest}" 2>/dev/null || true`)
            execSync(`rm -rf "${backendDest}/__tests__"`)
            console.log('[tsup-plugin] backend copied')
          }

          // Copy bridge/ to dist/bridge/ (excluding __tests__)
          const bridgeSrc = path.join(process.cwd(), 'bridge')
          const bridgeDest = path.join(process.cwd(), 'dist', 'bridge')
          console.log('[tsup-plugin] bridgeSrc:', bridgeSrc)
          console.log('[tsup-plugin] bridgeDest:', bridgeDest)
          if (fs.existsSync(bridgeSrc)) {
            console.log('[tsup-plugin] bridge contents:', fs.readdirSync(bridgeSrc))
            fs.rmSync(bridgeDest, { recursive: true, force: true })
            fs.mkdirSync(bridgeDest, { recursive: true })
            // Use shell command to exclude __tests__
            execSync(`cp -r "${bridgeSrc}"/* "${bridgeDest}" 2>/dev/null || true`)
            execSync(`rm -rf "${bridgeDest}/__tests__"`)
            console.log('[tsup-plugin] bridge copied')
          }
          
          console.log('[tsup-plugin] Copying complete')
        })
      },
    },
  ],
})
