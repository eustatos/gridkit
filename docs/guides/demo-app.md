# Demo Application Guide

This guide explains how to run and test the GridKit Demo application and DevTools extension.

## Quick Start (3 Steps)

### 1. Start the Demo Application

```bash
pnpm dev:demo
```

This opens `http://localhost:3000` with a working table.

### 2. Load DevTools Extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select folder: `packages/devtools/extension-dist`

### 3. Verify It Works

- Open DevTools Extension (GridKit icon in extensions panel)
- You should see the table list
- You can view state, events, and metrics

---

## What You Can Test

### In the Demo Application:
- ✅ Column sorting (click headers)
- ✅ Pagination (bottom panel)
- ✅ Row selection (checkboxes)
- ✅ Theme switching (Dark/Light)
- ✅ Notifications (enable/disable)

### In DevTools Extension:
- ✅ View current table state
- ✅ Event log
- ✅ Performance metrics
- ✅ Memory and leak detection
- ✅ Plugins inspection

---

## DevTools Development

If you're developing the extension itself:

### 1. Rebuild the Extension

```bash
cd packages/devtools
npm run build:extension
```

### 2. In Chrome, Click "Reload" for the Extension

Look for the circular arrow button on the extension card.

### 3. Refresh the Demo Application Page

---

## Troubleshooting

### Extension Won't Load

**Check:**
- `manifest.json` exists in `packages/devtools/extension/`
- `background.js`, `content.js`, `devtools.js` exist
- Icon files (`.svg`) exist

### DevTools Can't Find Table

**Check:**
- Debug mode is enabled in table: `debug: true`
- Check browser console for errors
- Extension is loaded in Chrome

### Data Not Updating

**Check:**
- Table methods are being called (`updateOptions`, `setData`, etc.)
- Notifications are enabled in demo app

---

## Build Configuration

The DevTools package has two build outputs:

### NPM Package (`dist/`)

Built with `tsup`:
- Main bundles (`index.js`, `index.cjs`)
- Type definitions (`index.d.ts`)
- Backend integration code
- Communication bridge code

### Browser Extension (`extension-dist/`)

Built with `webpack`:
- `manifest.json`
- `background.js` - Background service worker
- `content.js` - Content script
- `panel/` - DevTools panel UI
- `icons/` - Extension icons

### Build Commands

```bash
# Build NPM package only
cd packages/devtools
pnpm build

# Build extension only
pnpm build:extension

# Build both
pnpm build:all
```

---

## Related Documentation

- [GridKit Documentation](../../docs/README.md)
- [DevTools Architecture](../../packages/devtools/README.md)
- [Core Package](../../packages/core/README.md)
- [Installation Guide](../../docs/guides/installation.md)
