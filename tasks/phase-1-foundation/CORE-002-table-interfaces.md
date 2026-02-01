---
task_id: CORE-002
epic_id: EPIC-001
module: @gridkit/core
file: src/core/types/table.ts
priority: P0
complexity: medium
estimated_tokens: ~12,000
assignable_to_ai: yes
dependencies:
  - CORE-001
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
  - specs/api-specs/core.md
---

# Task: Define Table Interfaces

## Context

Define the core Table interfaces that represent the main table instance and its configuration. These interfaces are the foundation for the entire library - they define what a table IS and how it's configured.

## Guidelines Reference

- `.github/AI_GUIDELINES.md` - TypeScript standards
- `CONTRIBUTING.md` - Naming conventions
- `specs/api-specs/core.md` - API specification (reference for interface design)
- `docs/architecture/ARCHITECTURE.md` - Understand table architecture

## Objectives

- [ ] Define `Table<TData>` interface (main table instance)
- [ ] Define `TableOptions<TData>` interface (configuration)
- [ ] Define `TableState<TData>` interface (internal state)
- [ ] Define `TableMeta` type (custom metadata)
- [ ] Add comprehensive JSDoc

---

## Implementation Requirements

### 1. Table Instance Interface

**File: `src/core/types/table.ts`**

```typescript
import type { RowData, RowId, ColumnId, Updater, Listener, Unsubscribe } from './base';
import type { Column } from './column';
import type { Row, RowModel } from './row';

/**
 * Main table instance interface.
 * Provides access to all table functionality.
 * 
 * @template TData - The row data type extending RowData
 * 
 * @example
 * ```typescript
 * const table = createTable<User>({
 *   columns,
 *   data,
 * });
 * 
 * // Access table methods
 * const state = table.getState();
 * const rows = table.getRowModel();
 * ```
 * 
 * @public
 */
export interface Table<TData extends RowData> {
  /**
   * Get current table state.
   * State is immutable - returns a new object on each call.
   * 
   * @returns Current table state
   */
  getState(): TableState<TData>;
  
  /**
   * Update table state immutably.
   * 
   * @param updater - New state or updater function
   * 
   * @example
   * ```typescript
   * // Direct state
   * table.setState(newState);
   * 
   * // Updater function
   * table.setState(prev => ({ ...prev, sorting: newSorting }));
   * ```
   */
  setState(updater: Updater<TableState<TData>>): void;
  
  /**
   * Subscribe to state changes.
   * Listener is called whenever state updates.
   * 
   * @param listener - Callback function
   * @returns Unsubscribe function
   * 
   * @example
   * ```typescript
   * const unsubscribe = table.subscribe((state) => {
   *   console.log('State updated:', state);
   * });
   * 
   * // Later: stop listening
   * unsubscribe();
   * ```
   */
  subscribe(listener: Listener<TableState<TData>>): Unsubscribe;
  
  /**
   * Get all columns (including hidden).
   * 
   * @returns Array of all column instances
   */
  getAllColumns(): Column<TData>[];
  
  /**
   * Get only visible columns.
   * 
   * @returns Array of visible column instances
   */
  getVisibleColumns(): Column<TData>[];
  
  /**
   * Get column by ID.
   * 
   * @param id - Column identifier
   * @returns Column instance or undefined if not found
   */
  getColumn(id: ColumnId): Column<TData> | undefined;
  
  /**
   * Get current row model.
   * Row model contains all rows with current filtering/sorting applied.
   * 
   * @returns Current row model
   */
  getRowModel(): RowModel<TData>;
  
  /**
   * Get row by ID.
   * 
   * @param id - Row identifier
   * @returns Row instance or undefined if not found
   */
  getRow(id: RowId): Row<TData> | undefined;
  
  /**
   * Reset table to initial state.
   * Useful for clearing filters, sorting, etc.
   */
  reset(): void;
  
  /**
   * Destroy table instance and cleanup.
   * Removes all listeners and frees resources.
   * Table cannot be used after calling this method.
   */
  destroy(): void;
  
  /**
   * Original options used to create the table.
   * Read-only reference to initial configuration.
   */
  readonly options: TableOptions<TData>;
}
```

### 2. Table Options Interface

```typescript
import type { ColumnDef } from './column';

/**
 * Configuration options for creating a table.
 * 
 * @template TData - The row data type
 * 
 * @example
 * ```typescript
 * const options: TableOptions<User> = {
 *   columns: [
 *     { accessorKey: 'name', header: 'Name' },
 *     { accessorKey: 'email', header: 'Email' },
 *   ],
 *   data: users,
 *   getRowId: (row) => row.id.toString(),
 * };
 * ```
 * 
 * @public
 */
export interface TableOptions<TData extends RowData> {
  /**
   * Column definitions.
   * At least one column is required.
   */
  columns: ColumnDef<TData>[];
  
  /**
   * Initial data for the table.
   * 
   * @default []
   */
  data?: TData[];
  
  /**
   * Function to get unique row ID.
   * Used for row selection, expansion, and internal tracking.
   * 
   * @param row - Row data
   * @param index - Row index in data array
   * @returns Unique row identifier
   * 
   * @default (row, index) => index
   * 
   * @example
   * ```typescript
   * getRowId: (row) => row.id.toString()
   * ```
   */
  getRowId?: (row: TData, index: number) => RowId;
  
  /**
   * Initial table state.
   * Partial state - unspecified fields use defaults.
   * 
   * @default {}
   * 
   * @example
   * ```typescript
   * initialState: {
   *   sorting: [{ id: 'name', desc: false }],
   *   pagination: { pageIndex: 0, pageSize: 10 },
   * }
   * ```
   */
  initialState?: Partial<TableState<TData>>;
  
  /**
   * Enable debug mode.
   * Logs state changes and performance metrics to console.
   * 
   * @default false
   */
  debugMode?: boolean;
  
  /**
   * Callback when state changes.
   * Called after state is updated and listeners are notified.
   * 
   * @param state - New state
   * 
   * @example
   * ```typescript
   * onStateChange: (state) => {
   *   console.log('State changed:', state);
   *   localStorage.setItem('tableState', JSON.stringify(state));
   * }
   * ```
   */
  onStateChange?: (state: TableState<TData>) => void;
  
  /**
   * Default column options.
   * Applied to all columns unless overridden in column definition.
   * 
   * @example
   * ```typescript
   * defaultColumn: {
   *   size: 150,
   *   minSize: 50,
   *   enableSorting: true,
   * }
   * ```
   */
  defaultColumn?: Partial<ColumnDef<TData>>;
  
  /**
   * Custom metadata for application use.
   * Not used by GridKit internally.
   * 
   * @example
   * ```typescript
   * meta: {
   *   tableName: 'users',
   *   permissions: ['read', 'write'],
   * }
   * ```
   */
  meta?: TableMeta;
}
```

### 3. Table State Interface

```typescript
/**
 * Complete table state.
 * All state is immutable - updates create new state objects.
 * 
 * @template TData - The row data type
 * 
 * @public
 */
export interface TableState<TData extends RowData> {
  /**
   * Current data array.
   */
  data: TData[];
  
  /**
   * Column visibility state.
   * Maps column ID to visibility boolean.
   * 
   * @example
   * ```typescript
   * columnVisibility: {
   *   'name': true,
   *   'email': false, // hidden
   * }
   * ```
   */
  columnVisibility: Record<ColumnId, boolean>;
  
  /**
   * Column order.
   * Array of column IDs in display order.
   * 
   * @example
   * ```typescript
   * columnOrder: ['name', 'email', 'age']
   * ```
   */
  columnOrder: ColumnId[];
  
  /**
   * Column sizing state.
   * Maps column ID to width in pixels.
   * 
   * @example
   * ```typescript
   * columnSizing: {
   *   'name': 200,
   *   'email': 300,
   * }
   * ```
   */
  columnSizing: Record<ColumnId, number>;
  
  /**
   * Row selection state.
   * Maps row ID to selection boolean.
   * 
   * @example
   * ```typescript
   * rowSelection: {
   *   'user-1': true,
   *   'user-3': true,
   * }
   * ```
   */
  rowSelection: Record<RowId, boolean>;
  
  /**
   * Expanded state for grouped/tree data.
   * Maps row ID to expansion boolean.
   */
  expanded: Record<RowId, boolean>;
}

/**
 * Custom metadata type.
 * Can be extended by users for application-specific data.
 * 
 * @example
 * ```typescript
 * interface CustomMeta extends TableMeta {
   *   tableName: string;
   *   permissions: string[];
   * }
   * ```
 * 
 * @public
 */
export type TableMeta = Record<string, unknown>;
```

---

## Test Requirements

**File: `src/core/types/__tests__/table.test.ts`**

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type {
  Table,
  TableOptions,
  TableState,
  TableMeta,
} from '../table';
import type { RowData } from '../base';

describe('Table Types', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
  }

  describe('Table', () => {
    it('should have correct method signatures', () => {
      type TableInstance = Table<User>;
      
      expectTypeOf<TableInstance['getState']>().toBeFunction();
      expectTypeOf<TableInstance['getState']>().returns.toMatchTypeOf<TableState<User>>();
      
      expectTypeOf<TableInstance['setState']>().toBeFunction();
      expectTypeOf<TableInstance['setState']>().parameter(0).toMatchTypeOf<TableState<User> | ((prev: TableState<User>) => TableState<User>)>();
      
      expectTypeOf<TableInstance['getAllColumns']>().returns.toBeArray();
      expectTypeOf<TableInstance['getRowModel']>().toBeFunction();
    });
  });

  describe('TableOptions', () => {
    it('should accept valid options', () => {
      const options: TableOptions<User> = {
        columns: [
          { accessorKey: 'name', header: 'Name' },
        ],
        data: [],
      };
      
      expectTypeOf(options).toMatchTypeOf<TableOptions<User>>();
    });

    it('should make columns required', () => {
      // @ts-expect-error - columns is required
      const invalid: TableOptions<User> = {
        data: [],
      };
    });

    it('should allow optional fields', () => {
      const options: TableOptions<User> = {
        columns: [],
        // All other fields are optional
      };
      
      expectTypeOf(options).toMatchTypeOf<TableOptions<User>>();
    });
  });

  describe('TableState', () => {
    it('should have correct structure', () => {
      const state: TableState<User> = {
        data: [],
        columnVisibility: {},
        columnOrder: [],
        columnSizing: {},
        rowSelection: {},
        expanded: {},
      };
      
      expectTypeOf(state.data).toMatchTypeOf<User[]>();
      expectTypeOf(state.columnVisibility).toMatchTypeOf<Record<string, boolean>>();
      expectTypeOf(state.rowSelection).toMatchTypeOf<Record<string | number, boolean>>();
    });
  });

  describe('TableMeta', () => {
    it('should allow any key-value pairs', () => {
      const meta: TableMeta = {
        tableName: 'users',
        permissions: ['read', 'write'],
        customField: { nested: true },
      };
      
      expectTypeOf(meta).toMatchTypeOf<Record<string, unknown>>();
    });

    it('should be extensible', () => {
      interface CustomMeta extends TableMeta {
        tableName: string;
        permissions: string[];
      }
      
      const meta: CustomMeta = {
        tableName: 'users',
        permissions: ['read'],
      };
      
      expectTypeOf(meta).toMatchTypeOf<TableMeta>();
    });
  });
});
```

---

## Edge Cases

- [ ] Generic type inference works correctly
- [ ] Optional fields are properly typed
- [ ] State updater accepts both direct value and function
- [ ] Readonly fields cannot be modified
- [ ] Custom metadata is extensible

---

## Files to Create/Modify

- [ ] `src/core/types/table.ts` - Table type definitions
- [ ] `src/core/types/__tests__/table.test.ts` - Type tests
- [ ] `src/core/types/index.ts` - Add exports

**Update `src/core/types/index.ts`:**
```typescript
export type {
  Table,
  TableOptions,
  TableState,
  TableMeta,
} from './table';
```

---

## Success Criteria

- [ ] All type tests pass
- [ ] TypeScript compiles with strict mode
- [ ] JSDoc complete for all exports
- [ ] No `any` types
- [ ] Types work with generic constraints
- [ ] Follows AI_GUIDELINES.md patterns

---

## Related Tasks

- **Depends on:** CORE-001 (base types)
- **Blocks:** CORE-010 (table factory implementation)

---

## Notes for AI

- These interfaces define the PUBLIC API - be careful with design
- Ensure all methods are documented with examples
- State should be immutable - make sure types reflect this
- Consider forward compatibility (can we add fields later?)