---
task_id: REACT-002
epic_id: EPIC-REACT
module: @gridkit/react
priority: P0
complexity: low
estimated_tokens: ~5,000
assignable_to_ai: yes
dependencies:
  - REACT-001
guidelines:
  - .github/AI_GUIDELINES.md
  - packages/core/tsconfig.json
---

# Task: Setup TypeScript Configuration for React

## Context

Configure TypeScript for optimal React development with strict type checking, proper JSX handling, and integration with the core package.

## Objectives

- [ ] Verify tsconfig.json is properly configured for React
- [ ] Add path aliases for clean imports
- [ ] Configure type checking for React hooks
- [ ] Setup composite project references
- [ ] Add type definitions for tests

---

## Implementation Requirements

### 1. Verify/Update tsconfig.json

Ensure `packages/react/tsconfig.json` has all necessary React configurations:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    // Output
    "outDir": "./dist",
    "rootDir": "./src",
    
    // React specific
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    
    // Library
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    
    // Module resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    
    // Type checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    
    // Types
    "types": ["vitest/globals", "node", "@testing-library/jest-dom"],
    
    // Path aliases (optional, for cleaner imports)
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/context/*": ["./src/context/*"]
    }
  },
  "include": [
    "src/**/*",
    "src/**/*.tsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ],
  "references": [
    {
      "path": "../core"
    }
  ]
}
```

### 2. Create tsconfig.build.json (for production builds)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "declarationMap": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/__tests__/**"
  ]
}
```

### 3. Create tsconfig.test.json (for tests)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vitest/globals", "node", "@testing-library/jest-dom"],
    "jsx": "react-jsx"
  },
  "include": [
    "src/**/*",
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/__tests__/**"
  ]
}
```

### 4. Update package.json scripts

Ensure the build and type-check scripts use correct config:

```json
{
  "scripts": {
    "build": "tsup && tsc --project tsconfig.build.json --emitDeclarationOnly --outDir dist",
    "type-check": "tsc --noEmit",
    "type-check:test": "tsc --project tsconfig.test.json --noEmit"
  }
}
```

### 5. Create type declaration file for module augmentation

Create `src/types/global.d.ts`:

```typescript
/**
 * Global type declarations for @gridkit/react
 */

/// <reference types="react" />
/// <reference types="react-dom" />

declare module '@gridkit/react' {
  // Module augmentations will be added here as needed
}

// Ensure this file is treated as a module
export {};
```

### 6. Create types for React-specific utilities

Update `src/types/index.ts` to include utility types:

```typescript
/**
 * React-specific utility types
 */

import type { Table, TableOptions, RowData } from '@gridkit/core';
import type { DependencyList, MutableRefObject } from 'react';

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
  
  /**
   * Initial table state
   */
  initialState?: Partial<TableOptions<TData>['initialState']>;
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
  
  /**
   * Ref to the table instance (for imperative operations)
   */
  ref: MutableRefObject<Table<TData> | null>;
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

/**
 * Hook result type helper
 */
export type HookResult<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * Extract table data type from table instance
 */
export type InferTableData<T> = T extends Table<infer TData> ? TData : never;
```

---

## Test Requirements

Create `src/__tests__/types.test.ts` to verify type correctness:

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type { UseTableOptions, UseTableResult, RowData } from '../types';
import type { Table } from '@gridkit/core';

interface TestData extends RowData {
  id: string;
  name: string;
  age: number;
}

describe('Type Tests', () => {
  it('should have correct UseTableOptions type', () => {
    const options: UseTableOptions<TestData> = {
      data: [],
      columns: [],
      deps: [],
      debug: true,
    };
    
    expectTypeOf(options).toMatchTypeOf<UseTableOptions<TestData>>();
  });
  
  it('should have correct UseTableResult type', () => {
    type Result = UseTableResult<TestData>;
    
    expectTypeOf<Result>().toHaveProperty('table');
    expectTypeOf<Result>().toHaveProperty('isLoading');
    expectTypeOf<Result>().toHaveProperty('error');
    expectTypeOf<Result>().toHaveProperty('ref');
  });
  
  it('should correctly infer table data type', () => {
    type TableInstance = Table<TestData>;
    type InferredData = TableInstance extends Table<infer TData> ? TData : never;
    
    expectTypeOf<InferredData>().toEqualTypeOf<TestData>();
  });
});
```

---

## Files to Create/Modify

- [ ] `packages/react/tsconfig.json` - Update with React config
- [ ] `packages/react/tsconfig.build.json` - Create for production builds
- [ ] `packages/react/tsconfig.test.json` - Create for test config
- [ ] `packages/react/src/types/global.d.ts` - Global type declarations
- [ ] `packages/react/src/types/index.ts` - Update with utility types
- [ ] `packages/react/src/__tests__/types.test.ts` - Type tests
- [ ] `packages/react/package.json` - Update scripts

---

## Success Criteria

- [ ] TypeScript compiles without errors
- [ ] Type tests pass
- [ ] Path aliases work correctly
- [ ] React JSX transforms correctly
- [ ] Project references work with core package
- [ ] Strict mode enabled with no errors
- [ ] Type inference works for generics

---

## Validation Steps

```bash
# Type check
pnpm --filter @gridkit/react type-check

# Type check tests
pnpm --filter @gridkit/react type-check:test

# Run type tests
pnpm --filter @gridkit/react test src/__tests__/types.test.ts

# Build to verify declaration files
pnpm --filter @gridkit/react build

# Verify declaration files exist
ls packages/react/dist/*.d.ts
```

---

## Self-Check

- [ ] All tsconfig files created
- [ ] No TypeScript errors
- [ ] Type tests pass
- [ ] Declaration files generated correctly
- [ ] Path aliases work
- [ ] Composite project references configured
- [ ] React types recognized
- [ ] Strict mode enabled

---

## Notes for AI

- Ensure all paths are relative to packages/react/
- Use strict TypeScript settings
- Include proper JSDoc comments
- Test type inference with expectTypeOf
- Path aliases are optional but recommended
- Composite project must reference @gridkit/core
