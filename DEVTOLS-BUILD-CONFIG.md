# DevTools Build Configuration

## Overview

The GridKit DevTools package has been configured with separate build outputs for the NPM package and the browser extension.

## Build Structure

### NPM Package (`dist/`)
The main TypeScript package built with `tsup`:

- **Entry Point**: `index.ts`
- **Output Format**: ESM + CJS
- **TypeScript Definitions**: Included
- **Contains**:
  - Main bundles (`index.js`, `index.cjs`)
  - Type definitions (`index.d.ts`)
  - Backend integration code (`backend/`)
  - Communication bridge code (`bridge/`)

### Browser Extension (`extension-dist/`)
The Chrome/Firefox/Edge extension built with `webpack`:

- **Entry Points**:
  - `background.js` - Background service worker
  - `content.js` - Content script
  - `panel/index.tsx` - DevTools panel UI
- **Contains**:
  - All extension files ready to load in browser
  - Manifest configuration
  - Icons and assets
  - Panel UI (HTML, JS, CSS)

## Commands

### Build Only NPM Package
```bash
cd packages/devtools
pnpm build
```
Output: `packages/devtools/dist/`

### Build Only Extension
```bash
cd packages/devtools
pnpm build:extension
```
Output: `packages/devtools/extension-dist/`

### Build Both
```bash
cd packages/devtools
pnpm build:all
```
Output: Both `dist/` and `extension-dist/`

### Development Mode
```bash
cd packages/devtools
pnpm dev
```
Runs tsup in watch mode for the NPM package.

## Configuration Files

### `tsup.config.ts`
Configures the NPM package build:
- Entry: `index.ts`
- Output: `dist/`
- Formats: ESM + CJS
- DTS: Enabled
- Source Maps: Enabled

### `webpack.config.js`
Configures the browser extension build:
- Entry: Multiple (background, content, panel)
- Output: `extension-dist/`
- loaders: ts-loader, babel-loader, css-loader
- Plugins: CopyWebpackPlugin for assets

### `tsconfig.json`
Main TypeScript configuration:
- Target: ES2020
- Module: ESNext
- Source Maps: Enabled
- Excludes: `node_modules`, `dist`, `extension-dist`, `extension/**`, `src/**`

## Loading the Extension

1. Build the extension: `pnpm build:extension`
2. Load in browser:
   - **Chrome**: `chrome://extensions/` → Load unpacked → Select `extension-dist/`
   - **Firefox**: `about:debugging` → Load temporary extension
   - **Edge**: `edge://extensions/` → Load unpacked

## Project Structure

```
packages/devtools/
├── dist/                      # NPM package (built)
│   ├── index.js              # ESM bundle
│   ├── index.cjs             # CJS bundle
│   ├── index.d.ts            # Type definitions
│   ├── backend/              # Backend code
│   └── bridge/               # Bridge code
├── extension-dist/           # Extension (built)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── devtools.html
│   ├── devtools.js
│   ├── panel/
│   └── icons/
├── extension/                # Extension source
├── bridge/                   # Bridge source
├── backend/                  # Backend source
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── webpack.config.js
```

## Notes

- `dist/` and `extension-dist/` are gitignored
- Both outputs are included in `package.json` `files` array
- Turbo cache includes both output directories
- Clean script removes both directories
