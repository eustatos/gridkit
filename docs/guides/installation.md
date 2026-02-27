# Installation Guide

This guide covers installing GridKit in your project.

## Prerequisites

Before installing GridKit, ensure you have:

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0 or **pnpm** >= 8.0.0
- **TypeScript** >= 5.0.0 (for TypeScript projects)

## Installation

### Core Package

Install the core GridKit package:

```bash
# npm
npm install @gridkit/core

# pnpm
pnpm add @gridkit/core

# yarn
yarn add @gridkit/core
```

### React Adapter (for React projects)

If you're using React, install the React adapter:

```bash
# npm
npm install @gridkit/tanstack-adapter @tanstack/react-table

# pnpm
pnpm add @gridkit/tanstack-adapter @tanstack/react-table

# yarn
yarn add @gridkit/tanstack-adapter @tanstack/react-table
```

### Optional: DevTools

For enhanced debugging experience:

```bash
# npm
npm install @gridkit/devtools

# pnpm
pnpm add @gridkit/devtools
```

### Optional: Plugins

Install official plugins as needed:

```bash
# Audit logging plugin
npm install @gridkit/plugins

# pnpm
pnpm add @gridkit/plugins
```

## Package Overview

| Package | Description | Size |
|---------|-------------|------|
| `@gridkit/core` | Core library with all essential features | ~18KB gzipped |
| `@gridkit/tanstack-adapter` | React adapter for TanStack Table integration | ~8KB gzipped |
| `@gridkit/devtools` | Browser DevTools extension | ~25KB gzipped |
| `@gridkit/plugins` | Official plugin collection | Varies by plugin |

## TypeScript Configuration

GridKit requires TypeScript 5.0+ with strict mode enabled. Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Verification

Verify the installation by importing GridKit:

```typescript
// TypeScript/ESM
import { createTable } from '@gridkit/core';

// CommonJS
const { createTable } = require('@gridkit/core');

// React
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter';
```

## Next Steps

- [Getting Started](getting-started.md) - Create your first table
- [Basic Table](basic-table.md) - Learn table fundamentals
- [API Reference](../api/core.md) - Explore the API

## Troubleshooting

### TypeScript Errors

If you encounter TypeScript errors:

1. Ensure TypeScript version is 5.0+
2. Check that `strict` mode is enabled in `tsconfig.json`
3. Clear your build cache: `rm -rf node_modules/.vite` or `rm -rf dist`
4. Restart your TypeScript server in your IDE

### Module Resolution Issues

If modules can't be resolved:

1. Check your `moduleResolution` setting in `tsconfig.json`
2. For bundlers: ensure proper configuration for ESM packages
3. Try clearing node_modules: `rm -rf node_modules && npm install`

### React Adapter Issues

If the React adapter doesn't work:

1. Ensure both `@gridkit/tanstack-adapter` and `@tanstack/react-table` are installed
2. Check React version compatibility (React 18+ recommended)
3. Verify your bundler supports React Server Components if using Next.js

## Browser Support

GridKit supports the last 2 versions of major browsers:

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |

**Required APIs:**
- ES2020+
- IntersectionObserver (for virtualization)
- ResizeObserver (for column resizing)
- Performance API (for monitoring)

## CDN Usage

For quick prototyping without bundlers:

```html
<!-- Development build -->
<script src="https://unpkg.com/@gridkit/core@latest/dist/index.js"></script>

<!-- Production build (minified) -->
<script src="https://unpkg.com/@gridkit/core@latest/dist/index.min.js"></script>
```

Note: CDN usage is not recommended for production applications.

## Peer Dependencies

GridKit has zero runtime dependencies for the core package. Optional peer dependencies:

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "@tanstack/react-table": ">=8.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "@tanstack/react-table": { "optional": true }
  }
}
```

## License

MIT License - see the [LICENSE](../LICENSE) file for details.
