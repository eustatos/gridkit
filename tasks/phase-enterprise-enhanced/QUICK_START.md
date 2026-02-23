# Quick Start: TanStack Adapter Implementation

This guide walks you through implementing the GridKit TanStack adapter.

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- Existing GridKit core package setup

## Setup Steps

### 1. Create Package Structure

```bash
mkdir -p packages/tanstack-adapter/src/{core,react,enhancers,types,__tests__}
```

**✅ Already Created**

### 2. Create Package Configuration

Create `packages/tanstack-adapter/package.json`:

```json
{
  "name": "@gridkit/tanstack-adapter",
  "version": "0.1.0",
  "description": "GridKit Enhanced adapter for TanStack Table",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.js",
      "types": "./dist/react/index.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "clean": "rm -rf dist .turbo node_modules"
  },
  "peerDependencies": {
    "@tanstack/react-table": "^8.0.0",
    "@gridkit/core": "workspace:*"
  },
  "devDependencies": {
    "@tanstack/react-table": "^8.20.5",
    "@types/react": "^18.2.0",
    "react": "^18.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

**✅ Already Created**

### 3. Create TypeScript Configuration

Create `packages/tanstack-adapter/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationDir": "./dist",
    "types": ["react", "node"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

**✅ Already Created**

### 4. Create Build Configuration

Create `packages/tanstack-adapter/tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/react/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
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
  ]
})
```

**✅ Already Created**

### 5. Create Test Configuration

Create `packages/tanstack-adapter/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist']
    }
  }
})
```

**✅ Already Created**

### 6. Create Source Files

#### `src/types/enhanced.ts`

**✅ Already Created**

#### `src/core/createEnhancedTable.ts`

**✅ Already Created**

#### `src/enhancers/withEvents.ts`

**✅ Already Created**

#### `src/enhancers/withPerformanceMonitoring.ts`

**✅ Already Created**

#### `src/enhancers/withValidation.ts`

**✅ Already Created**

#### `src/react/index.ts`

**✅ Already Created**

#### `src/index.ts`

**✅ Already Created**

### 7. Create Test Setup

Create `src/__tests__/setup.ts`:

```typescript
import { jsdomSetup } from '@testing-library/react/vitest'

// Setup JSDOM for React components testing
jsdomSetup()

// Setup global test utilities
beforeEach(() => {
  // Clear any global state
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
})
```

**✅ Already Created**

### 8. Create README

Create `README.md`:

```markdown
# @gridkit/tanstack-adapter

GridKit Enhanced adapter for TanStack Table - adds enterprise features to TanStack Table without breaking changes.

## Features

- **Zero Breaking Changes** - Preserves all TanStack Table API
- **Event-Driven** - Enhanced event system with middleware
- **Performance Monitoring** - Built-in metrics and budgets
- **Validation** - Schema-based validation
- **Plugin System** - Full plugin ecosystem
- **TypeScript** - Full type safety

## Installation

```bash
npm install @gridkit/tanstack-adapter @tanstack/react-table @gridkit/core
```

## Quick Start

```typescript
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter/react'

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    events: true,
    performance: true,
    validation: true
  }
})

// TanStack API works as before
const rows = table.getRowModel().rows

// + GridKit features
table.on('row:select', handler)
console.log(table.metrics.getStats())
```
```

**✅ Already Created**

### 9. Update Workspace

The `pnpm-workspace.yaml` already includes `packages/*`, so the adapter will be automatically included.

**✅ Already Configured**

## Verify Setup

```bash
cd /Users/aleksanderastashkin/develop/gridkit

# Install dependencies
pnpm install

# Build the adapter
pnpm build -w packages/tanstack-adapter

# Run tests
pnpm test -w packages/tanstack-adapter

# Check types
pnpm typecheck -w packages/tanstack-adapter
```

## Next Steps

1. **Implement Core Features**: Complete `createEnhancedTable` implementation
2. **Add Tests**: Write unit tests for each enhancer
3. **Complete Implementation**: Follow Phase 1 tasks in `TASK_LIST.md`
4. **Build Examples**: Create example in demo app

## Files Created

- `packages/tanstack-adapter/package.json`
- `packages/tanstack-adapter/tsconfig.json`
- `packages/tanstack-adapter/tsup.config.ts`
- `packages/tanstack-adapter/vitest.config.ts`
- `packages/tanstack-adapter/README.md`
- `packages/tanstack-adapter/src/index.ts`
- `packages/tanstack-adapter/src/types/enhanced.ts`
- `packages/tanstack-adapter/src/core/createEnhancedTable.ts`
- `packages/tanstack-adapter/src/enhancers/withEvents.ts`
- `packages/tanstack-adapter/src/enhancers/withPerformanceMonitoring.ts`
- `packages/tanstack-adapter/src/enhancers/withValidation.ts`
- `packages/tanstack-adapter/src/react/index.ts`
- `packages/tanstack-adapter/src/__tests__/setup.ts`
- `tasks/phase-enterprise-enhanced/` - Full phase documentation

## Troubleshooting

### Build Issues
- Ensure `@gridkit/core` is built first: `pnpm build -w packages/core`
- Check peer dependency versions match

### Import Issues
- Verify `package.json` exports match actual file structure
- Check TypeScript configuration paths

### Test Issues
- Ensure `vitest` is configured for jsdom environment
- Check test setup file is properly referenced

## Support

For detailed information, see:
- [Architecture Decision](./ARCHITECTURE_DECISION.md)
- [Task List](./TASK_LIST.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
