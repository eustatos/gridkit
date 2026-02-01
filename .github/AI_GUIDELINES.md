# AI Agent Development Guidelines for GridKit

> 🤖 Optimized instructions for AI agents working on GridKit
> **MUST READ** before writing any code

---

## Quick Start Checklist

Before writing ANY code:

- [ ] Read this entire document
- [ ] Check `CONTRIBUTING.md` for project standards
- [ ] Review relevant files in `src/[module]/`
- [ ] Check `docs/patterns/` for established patterns
- [ ] Read the task file completely
- [ ] Understand dependencies from other modules

---

## Critical Rules (Non-negotiable)

### 1. TypeScript Strict Mode

```typescript
// ✅ ALWAYS: Explicit types for public API
export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // Implementation
}

// ❌ NEVER: Implicit any or missing generics
export function createTable(options) {
  // NO!
}

// ✅ ALWAYS: Explicit return types for public functions
export function getRowModel<TData>(): RowModel<TData> {
  return rowModel;
}

// ❌ NEVER: Inferred returns for public API
export function getRowModel() {
  return rowModel; // NO!
}
```

---

### 2. No `any` Type (Zero tolerance)

```typescript
// ❌ NEVER
function processData(data: any) { }

// ✅ Use unknown and type guards
function processData(data: unknown): ProcessedData {
  if (!isValidData(data)) {
    throw new GridKitError(
      'INVALID_DATA',
      'Data validation failed',
      { received: data }
    );
  }
  return process(data);
}

// ✅ Or use generics
function processData<T extends BaseData>(data: T): Processed<T> {
  return process(data);
}

// ✅ For truly unknown types, document why
/**
 * Processes external data of unknown structure.
 * @param data - External data (validated at runtime)
 */
function processExternal(data: unknown): Result {
  // Runtime validation required
  if (typeof data !== 'object' || data === null) {
    throw new GridKitError('INVALID_INPUT', 'Expected object');
  }
  // Now safe to use
}
```

---

### 3. Error Handling Pattern

```typescript
// ✅ ALWAYS: Use GridKitError with error codes
export class GridKitError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GridKitError';
  }
}

// ✅ Usage in code
if (!columns.length) {
  throw new GridKitError(
    'TABLE_NO_COLUMNS',
    'At least one column is required',
    { providedColumns: columns }
  );
}

if (column.id === existingColumn.id) {
  throw new GridKitError(
    'COLUMN_DUPLICATE_ID',
    `Column ID "${column.id}" is already in use`,
    { 
      newColumn: column, 
      existingColumn 
    }
  );
}

// ❌ NEVER: Generic errors
throw new Error('Something went wrong'); // NO!
throw new Error('Invalid input'); // NO!
```

**Standard Error Codes:**
```typescript
export type ErrorCode =
  // Table errors
  | 'TABLE_INVALID_OPTIONS'
  | 'TABLE_NO_COLUMNS'
  | 'TABLE_DESTROYED'
  // Column errors
  | 'COLUMN_INVALID_ACCESSOR'
  | 'COLUMN_DUPLICATE_ID'
  | 'COLUMN_NOT_FOUND'
  // Row errors
  | 'ROW_INVALID_ID'
  | 'ROW_NOT_FOUND'
  // State errors
  | 'STATE_UPDATE_FAILED'
  | 'STATE_INVALID'
  // Data errors
  | 'DATA_LOAD_FAILED'
  | 'DATA_INVALID_RESPONSE'
  // Plugin errors
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_REGISTRATION_FAILED';
```

---

### 4. Performance-First Code

```typescript
// ✅ ALWAYS: Memoize expensive computations
const sortedData = useMemo(
  () => applySorting(data, sortState),
  [data, sortState]
);

// ❌ NEVER: Compute in hot paths
function Component() {
  // This runs EVERY render!
  const sorted = applySorting(data, sortState); // NO!
  return <div>{sorted.map(...)}</div>;
}

// ✅ ALWAYS: Avoid allocations in loops
function filterRows<TData>(rows: Row<TData>[], predicate: Predicate<TData>): Row<TData>[] {
  const result: Row<TData>[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (predicate(rows[i])) {
      result.push(rows[i]); // Single allocation
    }
  }
  return result;
}

// ❌ NEVER: Create objects in loops unnecessarily
for (const item of items) {
  const obj = { ...item, extra: value }; // New object EVERY iteration!
  process(obj);
}

// ✅ BETTER: Reuse or minimize allocations
const processedItems = items.map(item => ({
  ...item,
  extra: value
})); // Single map operation
```

**Performance Budget:**
- Virtual scroll frame: **< 16ms** (60fps)
- Sort 10k rows: **< 100ms**
- Filter 10k rows: **< 50ms**
- State update: **< 5ms**
- Hot path functions: **No allocations**

---

### 5. Immutability Pattern

```typescript
// ✅ ALWAYS: Immutable updates
function updateColumn<TData>(
  columns: Column<TData>[],
  id: string,
  updates: Partial<Column<TData>>
): Column<TData>[] {
  return columns.map(col =>
    col.id === id ? { ...col, ...updates } : col
  );
}

// ❌ NEVER: Mutate parameters or state
function updateColumn(columns, id, updates) {
  const col = columns.find(c => c.id === id);
  Object.assign(col, updates); // MUTATION!
  return columns; // Same reference!
}

// ✅ For complex updates, use helper
import { produce } from 'immer'; // If needed

function updateState<T>(state: T, updater: (draft: T) => void): T {
  return produce(state, updater);
}

// Usage
const newState = updateState(state, draft => {
  draft.sorting.push(newSort);
  draft.pagination.pageIndex = 0;
});
```

---

## Testing Requirements

### Test Structure (Mandatory)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { expectTypeOf } from 'vitest';

describe('FeatureName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear state
    vi.clearAllMocks();
  });
  
  describe('functionName', () => {
    // 1. HAPPY PATH (REQUIRED)
    it('should work with valid input', () => {
      const result = functionName(validInput);
      expect(result).toEqual(expectedOutput);
    });
    
    // 2. EDGE CASES (REQUIRED)
    describe('edge cases', () => {
      it('should handle empty input', () => {
        expect(functionName([])).toEqual([]);
      });
      
      it('should handle null', () => {
        expect(() => functionName(null)).toThrow(GridKitError);
        expect(() => functionName(null)).toThrow('INVALID_INPUT');
      });
      
      it('should handle undefined', () => {
        expect(() => functionName(undefined)).toThrow(GridKitError);
      });
    });
    
    // 3. TYPE TESTS (REQUIRED for public API with generics)
    describe('type inference', () => {
      it('should infer correct types', () => {
        const result = functionName<User>(userData);
        expectTypeOf(result).toMatchTypeOf<Result<User>>();
      });
      
      it('should enforce type constraints', () => {
        // @ts-expect-error - should not accept invalid type
        functionName<string>('invalid');
      });
    });
    
    // 4. PERFORMANCE TESTS (REQUIRED for data operations)
    describe('performance', () => {
      it('should handle large datasets efficiently', () => {
        const largeData = Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          value: `item-${i}`
        }));
        
        const start = performance.now();
        const result = functionName(largeData);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(100); // Budget: 100ms
        expect(result).toHaveLength(10000);
      });
      
      it('should not leak memory', () => {
        const initialMemory = (performance as any).memory?.usedJSHeapSize;
        
        for (let i = 0; i < 1000; i++) {
          functionName(testData);
        }
        
        const finalMemory = (performance as any).memory?.usedJSHeapSize;
        const leakage = finalMemory - initialMemory;
        
        expect(leakage).toBeLessThan(1000000); // < 1MB
      });
    });
  });
});
```

### Coverage Requirements

- **Public API:** 100% coverage (no exceptions)
- **Internal utilities:** 90%+ coverage
- **Edge cases:** ALL documented edge cases MUST have tests
- **Error paths:** ALL error throws MUST be tested

---

## Documentation Requirements

### JSDoc Format (Mandatory for ALL exports)

```typescript
/**
 * Creates a type-safe column helper for the specified data type.
 * 
 * The column helper provides methods for creating column definitions
 * with full TypeScript inference, eliminating the need for manual
 * type annotations.
 * 
 * @template TData - The shape of the row data. Must extend RowData.
 * 
 * @returns A column helper instance with type-safe accessor methods
 * 
 * @example
 * Basic usage with simple accessors:
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 * 
 * const helper = createColumnHelper<User>();
 * 
 * const columns = [
 *   helper.accessor('name', {
 *     header: 'Full Name',
 *     cell: info => info.getValue().toUpperCase(),
 *   }),
 *   helper.accessor('email', {
 *     header: 'Email Address',
 *   }),
 * ];
 * ```
 * 
 * @example
 * With custom accessor function:
 * ```typescript
 * const column = helper.accessor(
 *   row => `${row.firstName} ${row.lastName}`,
 *   {
 *     id: 'fullName',
 *     header: 'Name',
 *   }
 * );
 * ```
 * 
 * @example
 * With nested property access:
 * ```typescript
 * const column = helper.accessor('user.profile.avatar', {
 *   header: 'Avatar',
 *   cell: info => <img src={info.getValue()} />,
 * });
 * ```
 * 
 * @see {@link ColumnDef} for available column options
 * @see {@link https://gridkit.dev/docs/columns} for detailed documentation
 * 
 * @throws {GridKitError} Never throws - this is a pure factory function
 * 
 * @public
 */
export function createColumnHelper<TData extends RowData>(): ColumnHelper<TData> {
  return {
    accessor: createAccessorColumn<TData>,
    display: createDisplayColumn<TData>,
    group: createGroupColumn<TData>,
  };
}
```

**JSDoc Requirements:**
- Description (what it does)
- Template parameters (with constraints)
- Parameters (with descriptions)
- Returns (what it returns)
- At least 2 examples (basic + advanced)
- Links to related types/docs
- Throws (even if it doesn't throw)
- @public, @internal, or @alpha tags

---

## File Organization

### Directory Structure

```
src/features/[feature-name]/
├── index.ts                    # Public exports ONLY
├── [feature-name].ts          # Main implementation
├── [feature-name].test.ts     # Tests (100% coverage)
├── [feature-name]-utils.ts    # Internal utilities
├── [feature-name]-utils.test.ts
├── types.ts                   # Local types
└── constants.ts               # Constants (if needed)
```

### Import Order (Enforced by ESLint)

```typescript
// 1. External dependencies (alphabetical)
import { useMemo, useCallback } from 'react';
import { produce } from 'immer';

// 2. Internal types (type-only imports)
import type { Table, Column, Row } from '@/types';
import type { SortingState } from '@/features/sorting/types';

// 3. Internal utilities
import { memo, deepEqual } from '@/utils';
import { createStore } from '@/core/state';

// 4. Relative imports
import { applySorting } from './sorting-utils';
import type { SortingOptions } from './types';
import { DEFAULT_SORT_DIRECTION } from './constants';

// 5. CSS/Assets (if any)
import './styles.css';
```

### Export Strategy

```typescript
// ✅ feature.ts - Implementation
export function createFeature<TData>() { }
export type { FeatureOptions, FeatureInstance };

// ✅ index.ts - Re-exports only (public API)
export { createFeature } from './feature';
export type { FeatureOptions, FeatureInstance } from './feature';

// Internal utilities - NOT exported from index
export { helperFunction } from './utils'; // Only in utils.ts

// ❌ NEVER use default exports
export default createFeature; // NO!
```

---

## Common Patterns in GridKit

### 1. Factory Functions (Primary pattern)

```typescript
/**
 * Factory function for creating instances with closures.
 * Preferred over classes for better tree-shaking.
 */
export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener<T>>();
  
  return {
    getState: () => state,
    
    setState: (updater: Updater<T>) => {
      const newState = typeof updater === 'function'
        ? updater(state)
        : updater;
      
      if (newState !== state) {
        state = newState;
        listeners.forEach(listener => listener(state));
      }
    },
    
    subscribe: (listener: Listener<T>) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    
    destroy: () => {
      listeners.clear();
    },
  };
}
```

### 2. Builder Pattern (For configuration)

```typescript
/**
 * Builder pattern for complex configurations.
 */
export function createColumnBuilder<TData>() {
  const config: Partial<ColumnDef<TData>> = {};
  
  return {
    accessor(key: keyof TData) {
      config.accessorKey = key as string;
      return this;
    },
    
    header(text: string) {
      config.header = text;
      return this;
    },
    
    size(width: number) {
      config.size = width;
      return this;
    },
    
    build(): ColumnDef<TData> {
      if (!config.accessorKey && !config.accessorFn) {
        throw new GridKitError(
          'COLUMN_INVALID_ACCESSOR',
          'Column must have either accessorKey or accessorFn'
        );
      }
      return config as ColumnDef<TData>;
    },
  };
}
```

### 3. Plugin Pattern

```typescript
/**
 * Plugin system for extensibility.
 */
export interface Plugin<TContext = any> {
  id: string;
  version: string;
  dependencies?: string[];
  
  onInit?(context: TContext): void | Promise<void>;
  onMount?(context: TContext): void | Promise<void>;
  onUnmount?(context: TContext): void | Promise<void>;
}

export function createPlugin<TContext>(
  config: PluginConfig<TContext>
): Plugin<TContext> {
  return {
    id: config.id,
    version: config.version || '1.0.0',
    dependencies: config.dependencies || [],
    
    onInit: config.onInit,
    onMount: config.onMount,
    onUnmount: config.onUnmount,
  };
}
```

---

## Prohibited Patterns (Auto-reject in review)

### ❌ Never Use These

```typescript
// 1. any type
function process(data: any) { } // NO!

// 2. @ts-ignore (use @ts-expect-error with explanation)
// @ts-ignore
const value = obj.prop; // NO!

// 3. Default exports
export default MyComponent; // NO!

// 4. Mutating parameters
function update(obj: Config) {
  obj.value = newValue; // MUTATION! NO!
}

// 5. console.log (use logger utility)
console.log('Debug info'); // NO!

// 6. Synchronous blocking operations
const data = fs.readFileSync('file.json'); // NO!

// 7. Non-descriptive variable names
const x = getData(); // NO!
const tmp = process(x); // NO!
const arr = []; // NO!

// 8. Magic numbers
if (items.length > 100) { } // NO!
// Use named constants:
const MAX_ITEMS = 100;
if (items.length > MAX_ITEMS) { } // YES!
```

### ✅ Use These Instead

```typescript
// 1. unknown + type guards
function process(data: unknown) {
  if (isValidData(data)) {
    // data is now properly typed
  }
}

// 2. @ts-expect-error with explanation
// @ts-expect-error - TODO: Update type definition in v2.0
const value = obj.prop;

// 3. Named exports
export { MyComponent };

// 4. Immutable updates
function update(obj: Config): Config {
  return { ...obj, value: newValue };
}

// 5. Logger utility
import { logger } from '@/utils/logger';
logger.debug('Debug info', { context });

// 6. Async operations
const data = await fs.promises.readFile('file.json');

// 7. Descriptive names
const userData = getUserData();
const processedUserData = processUserData(userData);
const filteredItems = items.filter(predicate);
```

---

## Performance Budgets

### Runtime Performance

| Operation | Target | Maximum | Measurement |
|-----------|--------|---------|-------------|
| Table init (1k rows) | 10ms | 50ms | performance.now() |
| Virtual scroll frame | 8ms | 16ms | RAF callback |
| Sort 10k rows | 50ms | 100ms | performance.now() |
| Filter 10k rows | 30ms | 50ms | performance.now() |
| State update | 2ms | 5ms | performance.now() |
| Column resize | 8ms | 16ms | RAF callback |

### Bundle Size

| Package | Target | Maximum |
|---------|--------|----------|
| @gridkit/core | 15kb | 20kb |
| @gridkit/react | 8kb | 12kb |
| Per feature module | 5kb | 10kb |

### Memory Usage

| Scenario | Target | Maximum |
|----------|--------|----------|
| 1k rows | 5MB | 10MB |
| 10k rows | 20MB | 40MB |
| 100k rows (virtual) | 50MB | 100MB |

---

## Code Review Self-Check

Before submitting, verify:

### TypeScript
- [ ] Strict mode passes with zero errors
- [ ] No `any` types (search for `: any`)
- [ ] All public APIs have explicit return types
- [ ] Generics are properly constrained
- [ ] Type inference works in IDE

### Exports
- [ ] All exports are named (no `export default`)
- [ ] Only public API exported from `index.ts`
- [ ] Types exported separately with `export type`

### Testing
- [ ] Tests written for ALL code paths
- [ ] 100% coverage for public API
- [ ] Edge cases tested (null, undefined, empty, large datasets)
- [ ] Error cases tested (all throws)
- [ ] Type tests for complex generics
- [ ] Performance tests for data operations

### Documentation
- [ ] JSDoc complete for all exports
- [ ] At least 2 examples in JSDoc
- [ ] Links to related types/docs
- [ ] README updated (if new feature)

### Code Quality
- [ ] Follows existing patterns in module
- [ ] No prohibited patterns used
- [ ] ESLint passes with zero warnings
- [ ] Prettier formatted
- [ ] Import order correct

### Performance
- [ ] No allocations in hot paths
- [ ] Performance benchmarks met
- [ ] No memory leaks (tested)
- [ ] Bundle size within budget

### Error Handling
- [ ] Uses GridKitError with proper codes
- [ ] Helpful error messages
- [ ] Context provided in errors
- [ ] All error paths tested

---

## When You're Unsure

### Ask for Clarification

**Don't guess!** If unsure about:
- Implementation approach → Provide 2-3 options with trade-offs
- API design → Request human architect review
- Performance implications → Flag for performance review
- Breaking changes → Explicitly state and request approval
- Security concerns → Flag for security review

### Provide Options

```markdown
## Implementation Options

### Option 1: Factory Function (Recommended)
**Pros:** Better tree-shaking, simpler testing
**Cons:** No inheritance
**Code:**
```typescript
export function createFeature() { }
```

### Option 2: Class-based
**Pros:** Familiar OOP pattern, inheritance
**Cons:** Larger bundle, harder to tree-shake
**Code:**
```typescript
export class Feature { }
```

### Recommendation
Option 1 aligns with GridKit patterns and performance goals.
```

---

## Quick Reference Card

```
✅ DO:
- Explicit types everywhere
- Named exports only
- Immutable updates
- Test everything (100% for public API)
- Document all exports (JSDoc)
- Handle all edge cases
- Meet performance budgets
- Follow existing patterns
- Use GridKitError for errors
- Write descriptive variable names

❌ DON'T:
- Use any type
- Use default exports
- Mutate parameters
- Skip tests
- Ignore edge cases
- Block the main thread
- Use console.log
- Violate performance budgets
- Use magic numbers
- Use non-descriptive names

⚠️ PERFORMANCE:
- < 16ms for 60fps operations
- < 100ms for data operations
- < 20kb per module (gzipped)
- No memory leaks
- Optimize hot paths

📝 TESTING:
- 100% coverage for public API
- Happy path + edge cases + errors
- Type tests for generics
- Performance tests for data ops

📚 DOCS:
- JSDoc for all exports
- 2+ examples per function
- Links to related docs
- Explain WHY, not just WHAT
```

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Next Review:** After Phase 1 completion
