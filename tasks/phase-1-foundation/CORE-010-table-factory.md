---
task_id: CORE-010
epic_id: EPIC-001
module: @gridkit/core
file: src/core/table/create-table.ts
priority: P0
complexity: high
estimated_tokens: ~20,000
assignable_to_ai: with-review
dependencies:
  - CORE-001
  - CORE-002
  - CORE-003
  - CORE-004
  - CORE-011
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
  - docs/architecture/ARCHITECTURE.md
  - docs/patterns/factory-pattern.md
---

# Task: Implement Table Factory Function

## Context

Implement the `createTable` factory function - the primary entry point for creating table instances. This is a **critical** function that:
- Validates configuration
- Initializes state
- Creates column/row instances
- Sets up the table API
- Manages lifecycle

**⚠️ This task requires careful review - it's the core of the library.**

## Guidelines Reference

- `.github/AI_GUIDELINES.md` - Factory pattern, error handling, performance
- `CONTRIBUTING.md` - Code organization
- `docs/architecture/ARCHITECTURE.md` - Table architecture
- `docs/patterns/factory-pattern.md` - Factory pattern implementation

## Objectives

- [ ] Implement `createTable<TData>()` factory function
- [ ] Validate table options (columns required, etc.)
- [ ] Initialize table state
- [ ] Create column instances from definitions
- [ ] Create row instances from data
- [ ] Implement all Table interface methods
- [ ] Add proper error handling with GridKitError
- [ ] Add comprehensive tests

---

## Implementation Requirements

### 1. Main Factory Function

**File: `src/core/table/create-table.ts`**

```typescript
import type { RowData, RowId } from '../types/base';
import type { Table, TableOptions, TableState } from '../types/table';
import type { Column } from '../types/column';
import type { Row, RowModel } from '../types/row';
import { GridKitError } from '../errors';
import { createStore } from '../state/create-store';
import { createColumn } from '../column/create-column';
import { createRow } from '../row/create-row';
import { buildRowModel } from '../row/build-row-model';

/**
 * Creates a new table instance.
 * 
 * @template TData - The row data type extending RowData
 * 
 * @param options - Table configuration options
 * @returns A fully initialized table instance
 * 
 * @throws {GridKitError} TABLE_NO_COLUMNS - When columns array is empty
 * @throws {GridKitError} TABLE_INVALID_OPTIONS - When options are invalid
 * 
 * @example
 * Basic usage:
 * ```typescript
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 * 
 * const table = createTable<User>({
 *   columns: [
 *     { accessorKey: 'name', header: 'Name' },
 *     { accessorKey: 'email', header: 'Email' },
 *   ],
 *   data: users,
 * });
 * ```
 * 
 * @example
 * With custom row ID:
 * ```typescript
 * const table = createTable<User>({
 *   columns,
 *   data: users,
 *   getRowId: (row) => row.id.toString(),
 * });
 * ```
 * 
 * @example
 * With state management:
 * ```typescript
 * const table = createTable<User>({
 *   columns,
 *   data: users,
 *   onStateChange: (state) => {
 *     console.log('State updated:', state);
 *   },
 *   initialState: {
 *     columnVisibility: { email: false },
 *   },
 * });
 * ```
 * 
 * @public
 */
export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // 1. Validate options
  validateOptions(options);
  
  // 2. Normalize options with defaults
  const normalizedOptions = normalizeOptions(options);
  
  // 3. Create state store
  const initialState = buildInitialState(normalizedOptions);
  const store = createStore(initialState);
  
  // 4. Create columns
  const columns = createColumns(normalizedOptions, tableInstance);
  
  // 5. Build row model
  let rowModel = buildRowModel({
    data: normalizedOptions.data || [],
    columns,
    getRowId: normalizedOptions.getRowId!,
    table: tableInstance,
  });
  
  // 6. Create table instance
  const tableInstance: Table<TData> = {
    options: normalizedOptions,
    
    getState: () => store.getState(),
    
    setState: (updater) => {
      store.setState(updater);
      
      // Trigger onStateChange callback
      if (normalizedOptions.onStateChange) {
        normalizedOptions.onStateChange(store.getState());
      }
      
      // Debug logging
      if (normalizedOptions.debugMode) {
        console.log('[GridKit] State updated:', store.getState());
      }
    },
    
    subscribe: (listener) => store.subscribe(listener),
    
    getAllColumns: () => columns,
    
    getVisibleColumns: () => {
      const state = store.getState();
      return columns.filter(col => 
        state.columnVisibility[col.id] !== false
      );
    },
    
    getColumn: (id) => {
      return columns.find(col => col.id === id);
    },
    
    getRowModel: () => rowModel,
    
    getRow: (id) => {
      return rowModel.rowsById.get(id);
    },
    
    reset: () => {
      store.setState(buildInitialState(normalizedOptions));
    },
    
    destroy: () => {
      store.destroy();
      // Clear references
      columns.length = 0;
      rowModel.rows.length = 0;
      rowModel.flatRows.length = 0;
      rowModel.rowsById.clear();
    },
  };
  
  // 7. Subscribe to state changes to rebuild row model
  store.subscribe((state) => {
    rowModel = buildRowModel({
      data: state.data,
      columns,
      getRowId: normalizedOptions.getRowId!,
      table: tableInstance,
      // Pass state for filtering/sorting (when implemented)
    });
  });
  
  return tableInstance;
}

/**
 * Validates table options.
 * @throws {GridKitError} if options are invalid
 */
function validateOptions<TData extends RowData>(
  options: TableOptions<TData>
): void {
  if (!options) {
    throw new GridKitError(
      'TABLE_INVALID_OPTIONS',
      'Table options are required',
      { options }
    );
  }
  
  if (!Array.isArray(options.columns)) {
    throw new GridKitError(
      'TABLE_INVALID_OPTIONS',
      'columns must be an array',
      { columns: options.columns }
    );
  }
  
  if (options.columns.length === 0) {
    throw new GridKitError(
      'TABLE_NO_COLUMNS',
      'At least one column is required',
      { providedColumns: options.columns }
    );
  }
}

/**
 * Normalizes options with defaults.
 */
function normalizeOptions<TData extends RowData>(
  options: TableOptions<TData>
): Required<TableOptions<TData>> {
  return {
    columns: options.columns,
    data: options.data || [],
    getRowId: options.getRowId || ((row, index) => index),
    initialState: options.initialState || {},
    debugMode: options.debugMode || false,
    onStateChange: options.onStateChange || undefined,
    defaultColumn: options.defaultColumn || {},
    meta: options.meta || {},
  } as Required<TableOptions<TData>>;
}

/**
 * Builds initial table state.
 */
function buildInitialState<TData extends RowData>(
  options: Required<TableOptions<TData>>
): TableState<TData> {
  const baseState: TableState<TData> = {
    data: options.data,
    columnVisibility: {},
    columnOrder: options.columns.map(col => col.id || col.accessorKey || ''),
    columnSizing: {},
    rowSelection: {},
    expanded: {},
  };
  
  // Merge with initial state from options
  return {
    ...baseState,
    ...options.initialState,
  };
}

/**
 * Creates column instances from definitions.
 */
function createColumns<TData extends RowData>(
  options: Required<TableOptions<TData>>,
  table: Table<TData>
): Column<TData>[] {
  return options.columns.map(columnDef => 
    createColumn({
      columnDef: {
        ...options.defaultColumn,
        ...columnDef,
      },
      table,
    })
  );
}
```

---

## Test Requirements

**File: `src/core/table/__tests__/create-table.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createTable } from '../create-table';
import { GridKitError } from '../../errors';
import type { RowData } from '../../types';

describe('createTable', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
  }
  
  const users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];
  
  const columns = [
    { accessorKey: 'name' as const, header: 'Name' },
    { accessorKey: 'email' as const, header: 'Email' },
  ];

  describe('validation', () => {
    it('should throw when options is null/undefined', () => {
      expect(() => createTable(null as any)).toThrow(GridKitError);
      expect(() => createTable(undefined as any)).toThrow('TABLE_INVALID_OPTIONS');
    });

    it('should throw when columns is not an array', () => {
      expect(() => createTable({ columns: 'invalid' as any })).toThrow(GridKitError);
    });

    it('should throw when columns array is empty', () => {
      expect(() => createTable<User>({ columns: [] })).toThrow('TABLE_NO_COLUMNS');
    });
  });

  describe('initialization', () => {
    it('should create table with valid options', () => {
      const table = createTable<User>({
        columns,
        data: users,
      });
      
      expect(table).toBeDefined();
      expect(table.getState).toBeDefined();
      expect(table.getAllColumns).toBeDefined();
    });

    it('should use default empty data when not provided', () => {
      const table = createTable<User>({ columns });
      
      expect(table.getState().data).toEqual([]);
    });

    it('should apply initial state', () => {
      const table = createTable<User>({
        columns,
        data: users,
        initialState: {
          columnVisibility: { email: false },
        },
      });
      
      expect(table.getState().columnVisibility).toEqual({ email: false });
    });
  });

  describe('state management', () => {
    it('should get current state', () => {
      const table = createTable<User>({ columns, data: users });
      const state = table.getState();
      
      expect(state.data).toEqual(users);
      expect(state.columnVisibility).toBeDefined();
    });

    it('should update state immutably', () => {
      const table = createTable<User>({ columns, data: users });
      const oldState = table.getState();
      
      table.setState(prev => ({
        ...prev,
        rowSelection: { '1': true },
      }));
      
      const newState = table.getState();
      expect(newState).not.toBe(oldState);
      expect(newState.rowSelection).toEqual({ '1': true });
    });

    it('should call onStateChange callback', () => {
      const onStateChange = vi.fn();
      const table = createTable<User>({
        columns,
        data: users,
        onStateChange,
      });
      
      table.setState(prev => ({ ...prev, rowSelection: {} }));
      
      expect(onStateChange).toHaveBeenCalled();
    });

    it('should support subscriptions', () => {
      const table = createTable<User>({ columns, data: users });
      const listener = vi.fn();
      
      const unsubscribe = table.subscribe(listener);
      
      table.setState(prev => ({ ...prev, rowSelection: {} }));
      
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
      table.setState(prev => ({ ...prev, rowSelection: {} }));
      
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('columns', () => {
    it('should create all columns', () => {
      const table = createTable<User>({ columns, data: users });
      const allColumns = table.getAllColumns();
      
      expect(allColumns).toHaveLength(2);
    });

    it('should apply default column options', () => {
      const table = createTable<User>({
        columns,
        data: users,
        defaultColumn: {
          size: 200,
          enableSorting: false,
        },
      });
      
      const column = table.getColumn('name');
      expect(column?.getSize()).toBe(200);
    });
  });

  describe('lifecycle', () => {
    it('should reset to initial state', () => {
      const table = createTable<User>({
        columns,
        data: users,
        initialState: {
          rowSelection: { '1': true },
        },
      });
      
      table.setState(prev => ({ ...prev, rowSelection: {} }));
      expect(table.getState().rowSelection).toEqual({});
      
      table.reset();
      expect(table.getState().rowSelection).toEqual({ '1': true });
    });

    it('should cleanup on destroy', () => {
      const table = createTable<User>({ columns, data: users });
      
      table.destroy();
      
      // Should not throw, but state is cleared
      expect(table.getAllColumns()).toEqual([]);
    });
  });

  describe('performance', () => {
    it('should handle 1000 rows efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));
      
      const start = performance.now();
      const table = createTable<User>({ columns, data: largeData });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50); // < 50ms
      expect(table.getRowModel().rows).toHaveLength(1000);
    });
  });
});
```

---

## Edge Cases

- [ ] Empty data array
- [ ] Missing optional options
- [ ] Invalid getRowId function
- [ ] Duplicate column IDs
- [ ] State updates while destroyed
- [ ] Large datasets (1000+ rows)

---

## Performance Requirements

- Table creation with 1000 rows: **< 50ms**
- State update: **< 5ms**
- No memory leaks on destroy

---

## Files to Create/Modify

- [ ] `src/core/table/create-table.ts` - Implementation
- [ ] `src/core/table/__tests__/create-table.test.ts` - Tests
- [ ] `src/core/table/index.ts` - Exports
- [ ] `src/core/index.ts` - Re-export createTable

---

## Success Criteria

- [ ] All tests pass with 100% coverage
- [ ] TypeScript compiles without errors
- [ ] Performance benchmarks met
- [ ] Error handling comprehensive
- [ ] Follows factory pattern from AI_GUIDELINES.md

---

## Related Tasks

- **Depends on:** CORE-001 through CORE-004, CORE-011 (state store)
- **Blocks:** All feature implementations

---

## Notes for AI

- This is the CORE of the library - be extra careful
- Test thoroughly with edge cases
- Performance is critical - profile if needed
- Error messages should be helpful
- Consider future extensibility (plugins, etc.)