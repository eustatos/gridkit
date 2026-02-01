---
task_id: CORE-004
epic_id: EPIC-001
module: @gridkit/core
file: src/core/types/row.ts
priority: P0
complexity: low
estimated_tokens: ~10,000
assignable_to_ai: yes
dependencies:
  - CORE-001
  - CORE-002
  - CORE-003
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Define Row Interfaces

## Context

Define the row type system. Rows represent individual data records in the table. The type system must support:
- Access to original data
- Access to cells
- Selection state
- Expansion state (for grouped/tree data)
- Parent/child relationships (for tree data)

## Guidelines Reference

- `.github/AI_GUIDELINES.md` - TypeScript standards
- `CONTRIBUTING.md` - Naming conventions
- `docs/architecture/ARCHITECTURE.md` - Row model design

## Objectives

- [ ] Define `Row<TData>` interface (runtime row instance)
- [ ] Define `RowModel<TData>` interface (collection of rows)
- [ ] Define `Cell<TData, TValue>` interface
- [ ] Add comprehensive JSDoc

---

## Implementation Requirements

**File: `src/core/types/row.ts`**

### 1. Cell Interface

```typescript
import type { RowData, ColumnId } from './base';
import type { Table } from './table';
import type { Column } from './column';

/**
 * Represents a single table cell.
 * 
 * @template TData - Row data type
 * @template TValue - Cell value type
 * 
 * @public
 */
export interface Cell<TData extends RowData, TValue = unknown> {
  /**
   * Unique cell identifier.
   * Format: `{rowId}_{columnId}`
   */
  readonly id: string;
  
  /**
   * Parent row instance.
   */
  readonly row: Row<TData>;
  
  /**
   * Parent column instance.
   */
  readonly column: Column<TData, TValue>;
  
  /**
   * Get cell value.
   * Uses accessor defined in column.
   * 
   * @returns Cell value
   */
  getValue(): TValue;
  
  /**
   * Render cell using column's cell renderer.
   * 
   * @returns Rendered cell content
   */
  renderValue(): unknown;
}
```

### 2. Row Interface

```typescript
import type { RowId } from './base';

/**
 * Runtime row instance.
 * Represents a single row in the table.
 * 
 * @template TData - Row data type
 * 
 * @example
 * ```typescript
 * const row = table.getRowModel().rows[0];
 * console.log(row.original); // Original data
 * console.log(row.getValue('name')); // Get specific cell value
 * ```
 * 
 * @public
 */
export interface Row<TData extends RowData> {
  /**
   * Unique row identifier.
   * Determined by `getRowId` option or defaults to index.
   */
  readonly id: RowId;
  
  /**
   * Reference to parent table.
   */
  readonly table: Table<TData>;
  
  /**
   * Original row data.
   * Immutable reference to source data.
   */
  readonly original: TData;
  
  /**
   * Row index in current view.
   * Changes based on sorting/filtering.
   */
  readonly index: number;
  
  /**
   * Nesting depth for tree data.
   * 0 for top-level rows.
   */
  readonly depth: number;
  
  /**
   * Get all cells for this row.
   * Includes hidden columns.
   * 
   * @returns Array of all cells
   */
  getAllCells(): Cell<TData>[];
  
  /**
   * Get only visible cells.
   * Respects column visibility state.
   * 
   * @returns Array of visible cells
   */
  getVisibleCells(): Cell<TData>[];
  
  /**
   * Get cell by column ID.
   * 
   * @param columnId - Column identifier
   * @returns Cell instance or undefined if not found
   */
  getCell(columnId: ColumnId): Cell<TData> | undefined;
  
  /**
   * Get value for a specific column.
   * Shorthand for getCell(id)?.getValue().
   * 
   * @template TValue - Expected value type
   * @param columnId - Column identifier
   * @returns Cell value
   * 
   * @example
   * ```typescript
   * const name = row.getValue<string>('name');
   * const age = row.getValue<number>('age');
   * ```
   */
  getValue<TValue = unknown>(columnId: ColumnId): TValue;
  
  /**
   * Check if row is selected.
   * 
   * @returns True if selected
   */
  getIsSelected(): boolean;
  
  /**
   * Toggle row selection.
   * 
   * @param value - New selection state (toggles if undefined)
   * 
   * @example
   * ```typescript
   * row.toggleSelected(); // Toggle
   * row.toggleSelected(true); // Select
   * row.toggleSelected(false); // Deselect
   * ```
   */
  toggleSelected(value?: boolean): void;
  
  /**
   * Check if row is expanded.
   * Only relevant for grouped or tree data.
   * 
   * @returns True if expanded
   */
  getIsExpanded(): boolean;
  
  /**
   * Toggle row expansion.
   * Only relevant for grouped or tree data.
   * 
   * @param value - New expansion state (toggles if undefined)
   */
  toggleExpanded(value?: boolean): void;
  
  /**
   * Parent row for tree data.
   * Undefined for top-level rows.
   */
  parentRow?: Row<TData>;
  
  /**
   * Child rows for tree/grouped data.
   * Empty array if no children.
   */
  subRows: Row<TData>[];
  
  /**
   * Get all parent rows (ancestors).
   * Returns empty array for top-level rows.
   * 
   * @returns Array of parent rows from immediate to root
   */
  getParentRows(): Row<TData>[];
  
  /**
   * Get all descendant rows (recursively).
   * Returns empty array if no children.
   * 
   * @returns Flattened array of all descendants
   */
  getLeafRows(): Row<TData>[];
}
```

### 3. Row Model Interface

```typescript
/**
 * Collection of rows with metadata.
 * Represents current table view after sorting/filtering/pagination.
 * 
 * @template TData - Row data type
 * 
 * @example
 * ```typescript
 * const rowModel = table.getRowModel();
 * console.log(rowModel.rows.length); // Number of rows
 * console.log(rowModel.flatRows.length); // Including nested
 * ```
 * 
 * @public
 */
export interface RowModel<TData extends RowData> {
  /**
   * Top-level rows in current view.
   * Does not include nested rows.
   */
  rows: Row<TData>[];
  
  /**
   * All rows including nested (flattened).
   * Useful for total count.
   */
  flatRows: Row<TData>[];
  
  /**
   * Map of row ID to row instance.
   * For O(1) lookup by ID.
   */
  rowsById: Map<RowId, Row<TData>>;
}
```

---

## Test Requirements

**File: `src/core/types/__tests__/row.test.ts`**

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import type {
  Row,
  RowModel,
  Cell,
} from '../row';
import type { RowData } from '../base';

describe('Row Types', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
  }

  describe('Row', () => {
    it('should have correct interface', () => {
      type RowInstance = Row<User>;
      
      expectTypeOf<RowInstance['id']>().toMatchTypeOf<string | number>();
      expectTypeOf<RowInstance['original']>().toMatchTypeOf<User>();
      expectTypeOf<RowInstance['index']>().toBeNumber();
      expectTypeOf<RowInstance['depth']>().toBeNumber();
    });

    it('should have correct method signatures', () => {
      type RowInstance = Row<User>;
      
      expectTypeOf<RowInstance['getAllCells']>().returns.toBeArray();
      expectTypeOf<RowInstance['getVisibleCells']>().returns.toBeArray();
      expectTypeOf<RowInstance['getValue']>().toBeFunction();
      expectTypeOf<RowInstance['getIsSelected']>().returns.toBeBoolean();
      expectTypeOf<RowInstance['toggleSelected']>().toBeFunction();
    });

    it('should support getValue with type parameter', () => {
      type RowInstance = Row<User>;
      
      expectTypeOf<RowInstance['getValue']<string>>().returns.toBeString();
      expectTypeOf<RowInstance['getValue']<number>>().returns.toBeNumber();
    });

    it('should support tree data properties', () => {
      type RowInstance = Row<User>;
      
      expectTypeOf<RowInstance['parentRow']>().toMatchTypeOf<Row<User> | undefined>();
      expectTypeOf<RowInstance['subRows']>().toMatchTypeOf<Row<User>[]>();
      expectTypeOf<RowInstance['getParentRows']>().returns.toMatchTypeOf<Row<User>[]>();
      expectTypeOf<RowInstance['getLeafRows']>().returns.toMatchTypeOf<Row<User>[]>();
    });
  });

  describe('Cell', () => {
    it('should have correct interface', () => {
      type CellInstance = Cell<User, string>;
      
      expectTypeOf<CellInstance['id']>().toBeString();
      expectTypeOf<CellInstance['row']>().toMatchTypeOf<Row<User>>();
      expectTypeOf<CellInstance['getValue']>().returns.toBeString();
    });
  });

  describe('RowModel', () => {
    it('should have correct structure', () => {
      type Model = RowModel<User>;
      
      expectTypeOf<Model['rows']>().toMatchTypeOf<Row<User>[]>();
      expectTypeOf<Model['flatRows']>().toMatchTypeOf<Row<User>[]>();
      expectTypeOf<Model['rowsById']>().toMatchTypeOf<Map<string | number, Row<User>>>();
    });
  });
});
```

---

## Edge Cases

- [ ] Generic type inference works
- [ ] Tree data properties are optional/present correctly
- [ ] getValue generic parameter works
- [ ] Readonly fields cannot be modified

---

## Files to Create/Modify

- [ ] `src/core/types/row.ts` - Row type definitions
- [ ] `src/core/types/__tests__/row.test.ts` - Type tests
- [ ] `src/core/types/index.ts` - Add exports

**Update `src/core/types/index.ts`:**
```typescript
export type {
  Row,
  RowModel,
  Cell,
} from './row';
```

---

## Success Criteria

- [ ] All type tests pass
- [ ] TypeScript compiles with strict mode
- [ ] JSDoc complete with examples
- [ ] No `any` types
- [ ] Follows AI_GUIDELINES.md

---

## Related Tasks

- **Depends on:** CORE-001, CORE-002, CORE-003
- **Blocks:** ROW-001 (row implementation)

---

## Notes for AI

- Row interface is user-facing - good DX is critical
- Tree data support should be elegant
- getValue<T> type parameter is important for type safety