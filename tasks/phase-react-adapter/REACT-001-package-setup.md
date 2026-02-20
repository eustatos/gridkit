---
task_id: REACT-001
epic_id: EPIC-REACT
module: @gridkit/react
priority: P0
complexity: low
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies: []
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Create @gridkit/react Package Structure

## Context

Create the foundational package structure for `@gridkit/react`, the React adapter for GridKit. This package will provide React-specific hooks and utilities for using GridKit in React applications.

## Guidelines Reference

Before implementing, review:
- `.github/AI_GUIDELINES.md` - Code standards for AI
- `CONTRIBUTING.md` - General contributing rules  
- `pnpm-workspace.yaml` - Workspace configuration
- `packages/core/package.json` - Reference package structure

## Objectives

- [ ] Create package directory structure
- [ ] Setup package.json with correct dependencies
- [ ] Create initial TypeScript files with exports
- [ ] Setup README with basic usage
- [ ] Add to workspace configuration

---

## Implementation Requirements

### 1. Directory Structure

Create the following structure:

```
packages/react/
├── src/
│   ├── hooks/
│   │   └── index.ts          # Hook exports (empty for now)
│   ├── context/
│   │   └── index.ts          # Context exports (empty for now)
│   ├── types/
│   │   └── index.ts          # React-specific types
│   └── index.ts              # Main exports
├── package.json
├── tsconfig.json
├── README.md
└── .eslintrc.json
```

### 2. package.json Configuration

```json
{
  "name": "@gridkit/react",
  "version": "0.0.1",
  "description": "React adapter for GridKit table library",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./hooks": {
      "types": "./dist/hooks/index.d.ts",
      "import": "./dist/hooks/index.js",
      "require": "./dist/hooks/index.cjs"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .turbo node_modules"
  },
  "keywords": [
    "react",
    "table",
    "grid",
    "datagrid",
    "typescript",
    "hooks"
  ],
  "author": "GridKit Team",
  "license": "MIT",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "@gridkit/core": "workspace:*"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/react-hooks": "^8.0.1",
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.2.1"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 3. src/index.ts - Main Exports

```typescript
/**
 * @gridkit/react - React adapter for GridKit
 * @packageDocumentation
 */

// Re-export core types that are useful in React
export type {
  Table,
  TableOptions,
  TableState,
  Column,
  ColumnDef,
  Row,
  Cell,
  RowData,
} from '@gridkit/core';

// Hook exports (to be implemented in future tasks)
export * from './hooks';

// Context exports (to be implemented in future tasks)
export * from './context';

// React-specific types
export * from './types';
```

### 4. src/types/index.ts - React-Specific Types

```typescript
/**
 * React-specific types for GridKit
 */

import type { Table, TableOptions, RowData } from '@gridkit/core';
import type { DependencyList } from 'react';

/**
 * Options for useTable hook
 */
export interface UseTableOptions<TData extends RowData> extends TableOptions<TData> {
  /**
   * Dependencies array for React useEffect
   * If provided, table will be recreated when dependencies change
   */
  deps?: DependencyList;
  
  /**
   * Enable debug mode (logs re-renders and updates)
   */
  debug?: boolean;
}

/**
 * Return type for useTable hook
 */
export interface UseTableResult<TData extends RowData> {
  /**
   * The table instance
   */
  table: Table<TData>;
  
  /**
   * Loading state (useful for async data)
   */
  isLoading: boolean;
  
  /**
   * Error state (if table creation fails)
   */
  error: Error | null;
}

/**
 * Options for event subscription hooks
 */
export interface UseEventOptions {
  /**
   * Enable/disable the subscription
   */
  enabled?: boolean;
  
  /**
   * Debounce delay in milliseconds
   */
  debounce?: number;
  
  /**
   * Throttle delay in milliseconds
   */
  throttle?: number;
}
```

### 5. src/hooks/index.ts - Hook Exports Placeholder

```typescript
/**
 * React hooks for GridKit
 * 
 * Hooks will be implemented in subsequent tasks:
 * - REACT-005: useTable
 * - REACT-006: useTableState
 * - REACT-007: useTableEvents
 * - REACT-008: useColumns
 * - REACT-009: useRows
 * - REACT-010: useSelection
 * - REACT-011: useSorting
 * - REACT-012: useFiltering
 * - REACT-013: usePagination
 */

// Placeholder - hooks will be added in future tasks
export {};
```

### 6. src/context/index.ts - Context Exports Placeholder

```typescript
/**
 * React context for GridKit
 * 
 * Context providers will be implemented in future tasks if needed
 */

// Placeholder - context will be added if needed
export {};
```

### 7. README.md

```markdown
# @gridkit/react

React adapter for GridKit table library.

## Installation

\`\`\`bash
npm install @gridkit/react @gridkit/core react react-dom
# or
pnpm add @gridkit/react @gridkit/core react react-dom
# or
yarn add @gridkit/react @gridkit/core react react-dom
\`\`\`

## Quick Start

\`\`\`tsx
import { useTable } from '@gridkit/react';

function MyTable() {
  const table = useTable({
    data: myData,
    columns: myColumns,
  });
  
  // Render your table using the table instance
  return (
    <table>
      {/* Your table implementation */}
    </table>
  );
}
\`\`\`

## Features

- 🎣 **React Hooks** - Modern hooks API for table management
- 🔄 **Reactive State** - Automatic re-renders on state changes
- 📦 **Type-Safe** - Full TypeScript support with generics
- ⚡ **Performance** - Optimized for minimal re-renders
- 🧩 **Composable** - Build complex tables with simple hooks

## Documentation

Full documentation coming soon.

## License

MIT
\`\`\`

### 8. tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals", "node", "@testing-library/jest-dom"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"],
  "references": [
    {
      "path": "../core"
    }
  ]
}
```

### 9. .eslintrc.json

```json
{
  "extends": ["../../.eslintrc.json"],
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  "plugins": ["react", "react-hooks"]
}
```

---

## Test Requirements

No tests needed for this task (structure setup only).

---

## Files to Create/Modify

- [ ] `packages/react/src/index.ts` - Main exports
- [ ] `packages/react/src/types/index.ts` - React types
- [ ] `packages/react/src/hooks/index.ts` - Hook exports placeholder
- [ ] `packages/react/src/context/index.ts` - Context exports placeholder
- [ ] `packages/react/package.json` - Package configuration
- [ ] `packages/react/tsconfig.json` - TypeScript configuration
- [ ] `packages/react/README.md` - Package documentation
- [ ] `packages/react/.eslintrc.json` - ESLint configuration
- [ ] `pnpm-workspace.yaml` - Add react package (if not present)

---

## Success Criteria

- [ ] Package structure created correctly
- [ ] TypeScript compiles without errors (`pnpm run type-check`)
- [ ] Package can be built (`pnpm run build`)
- [ ] ESLint passes (`pnpm run lint`)
- [ ] Package exports are correct (check dist/ after build)
- [ ] README is clear and informative
- [ ] Workspace recognizes the new package

---

## Validation Steps

After completion, run these commands from project root:

```bash
# Install dependencies
pnpm install

# Check if workspace recognizes the package
pnpm list --filter @gridkit/react

# Build the package
pnpm --filter @gridkit/react build

# Type check
pnpm --filter @gridkit/react type-check

# Lint
pnpm --filter @gridkit/react lint

# Verify exports
node -e "console.log(require('./packages/react/package.json').exports)"
```

---

## Self-Check

- [ ] All files created in correct locations
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Package builds successfully
- [ ] Exports are properly configured
- [ ] Dependencies are correct (peer vs regular)
- [ ] README follows project standards
- [ ] tsconfig extends base configuration

---

## Notes for AI

- Follow exact structure shown above
- Use workspace protocol for @gridkit/core dependency (`workspace:*`)
- Ensure React 18+ compatibility
- Use named exports only (no default exports)
- Keep README concise (detailed docs will be in Storybook)
- tsconfig.json should extend base config from root
- Include proper JSDoc comments on type definitions
