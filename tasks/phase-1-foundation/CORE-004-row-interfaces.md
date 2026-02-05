# CORE-004: Row & Cell Type System

## Task Card

```
task_id: CORE-004
priority: P0
complexity: Medium
estimated_tokens: ~10,000
ai_ready: true
dependencies: [CORE-001, CORE-002, CORE-003]
requires_review: true (tree data structures)
```

## 🎯 Objective

Define the row and cell type system for representing individual data records and their UI components. Support hierarchical data (tree/grouped rows) with type-safe parent-child relationships and efficient data access patterns.

## 📋 Implementation Scope

### **1. Cell Interface (Data + UI Unit)**

````typescript
/**
 * Represents a single table cell with data and UI state.
 * Immutable by design - all methods return new values.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type (inferred from column)
 *
 * @example
 * ```typescript
 * const cell = row.getCell('name');
 * const value = cell.getValue(); // Typed as string
 * const rendered = cell.renderValue(); // Rendered content
 * ```
 */
export interface Cell<TData extends RowData, TValue = unknown> {
  // === Identification ===

  /**
   * Unique cell identifier: `${rowId}_${columnId}`
   * Used for O(1) lookups and focus management.
   */
  readonly id: CellId;

  /**
   * Parent row instance.
   */
  readonly row: Row<TData>;

  /**
   * Parent column instance with typed accessor.
   */
  readonly column: Column<TData, TValue>;

  // === Data Access ===

  /**
   * Get typed cell value.
   * Uses column's accessor (key or function).
   *
   * @returns The cell value with correct type
   */
  getValue(): TValue;

  /**
   * Render cell using column's cell renderer.
   * Returns framework-agnostic representation.
   *
   * @returns Rendered cell content
   */
  renderValue(): unknown;

  // === State ===

  /**
   * Check if cell is currently focused.
   * For keyboard navigation and editing.
   */
  getIsFocused(): boolean;

  /**
   * Check if cell is currently selected.
   * Part of range selection.
   */
  getIsSelected(): boolean;

  /**
   * Check if cell is editable.
   * Based on column configuration and row state.
   */
  getIsEditable(): boolean;

  // === Metadata ===

  /**
   * Cell metadata from column definition.
   */
  readonly meta: CellMeta;

  /**
   * Cell index in row (0-based).
   */
  readonly index: number;

  /**
   * Absolute position in table (for virtualization).
   */
  readonly position?: CellPosition;
}

/**
 * Cell position information for virtualization.
 */
export interface CellPosition {
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}
````

### **2. Row Interface (Data Record Representation)**

````typescript
/**
 * Runtime row instance representing a data record.
 * Supports hierarchical data with parent-child relationships.
 *
 * @template TData - Row data type
 *
 * @example
 * ```typescript
 * const row = table.getRow('user-123');
 * const name = row.getValue<string>('name');
 * const cells = row.getVisibleCells();
 * ```
 */
export interface Row<TData extends RowData> {
  // === Core Properties ===

  /**
   * Unique row identifier.
   * From getRowId option or array index.
   */
  readonly id: RowId;

  /**
   * Parent table reference.
   */
  readonly table: Table<TData>;

  /**
   * Original row data (immutable).
   * Direct access to source data.
   */
  readonly original: Readonly<TData>;

  /**
   * Row index in current view (after sorting/filtering).
   * Changes as data is manipulated.
   */
  readonly index: number;

  /**
   * Original data index (from source array).
   * Stable regardless of sorting/filtering.
   */
  readonly originalIndex: number;

  // === Hierarchical Data Support ===

  /**
   * Nesting depth for tree/grouped data.
   * 0 = top-level, 1 = first child level, etc.
   */
  readonly depth: number;

  /**
   * Parent row for nested data.
   * undefined for top-level rows.
   */
  readonly parentRow?: Row<TData>;

  /**
   * Immediate child rows.
   * Empty array for leaf rows.
   */
  readonly subRows: readonly Row<TData>[];

  /**
   * Check if row has children.
   */
  readonly hasChildren: boolean;

  /**
   * Check if children are currently expanded.
   */
  readonly isExpanded: boolean;

  // === Data Access Methods ===

  /**
   * Get all cells (including hidden columns).
   */
  getAllCells(): readonly Cell<TData>[];

  /**
   * Get only visible cells in display order.
   */
  getVisibleCells(): readonly Cell<TData>[];

  /**
   * Get cell by column ID.
   * O(1) lookup via internal index.
   */
  getCell(columnId: ColumnId): Cell<TData> | undefined;

  /**
   * Get typed value for a column.
   * Shorthand for getCell(id)?.getValue() with type safety.
   *
   * @template TValue - Expected value type
   * @param columnId - Column identifier
   * @returns Cell value with specified type
   */
  getValue<TValue = unknown>(columnId: ColumnId): TValue;

  /**
   * Get raw data value (bypasses column accessor).
   * Useful for custom operations.
   */
  getOriginalValue(columnId: ColumnId): unknown;

  // === State Management ===

  /**
   * Check if row is selected.
   */
  getIsSelected(): boolean;

  /**
   * Toggle row selection.
   *
   * @param selected - Optional force state (toggles if undefined)
   * @param options - Selection options (range, multi, etc.)
   */
  toggleSelected(selected?: boolean, options?: SelectionOptions): void;

  /**
   * Check if row is expanded (tree data).
   */
  getIsExpanded(): boolean;

  /**
   * Toggle row expansion.
   *
   * @param expanded - Optional force state (toggles if undefined)
   */
  toggleExpanded(expanded?: boolean): void;

  // === Tree Data Utilities ===

  /**
   * Get all parent rows (ancestors).
   * Returns empty array for top-level rows.
   */
  getParentRows(): readonly Row<TData>[];

  /**
   * Get all descendant rows (recursive).
   * Returns empty array for leaf rows.
   */
  getLeafRows(): readonly Row<TData>[];

  /**
   * Get path from root to this row.
   * Array of row IDs representing the hierarchy.
   */
  getPath(): readonly RowId[];

  /**
   * Check if this row is ancestor of another row.
   */
  isAncestorOf(row: Row<TData>): boolean;

  /**
   * Check if this row is descendant of another row.
   */
  isDescendantOf(row: Row<TData>): boolean;

  // === Metadata ===

  /**
   * Row-level metadata.
   */
  readonly meta: RowMeta;

  /**
   * Check if row is currently visible.
   * Affected by filtering, pagination, and expansion state.
   */
  readonly isVisible: boolean;
}

/**
 * Selection options for row operations.
 */
export interface SelectionOptions {
  /** Allow multiple selection */
  readonly multi?: boolean;

  /** Select range from last selection */
  readonly range?: boolean;

  /** Clear existing selection first */
  readonly clearOthers?: boolean;
}
````

### **3. Row Model Interface (Collection Management)**

````typescript
/**
 * Collection of rows with efficient access patterns.
 * Represents the current view after all transformations.
 *
 * @template TData - Row data type
 *
 * @example
 * ```typescript
 * const model = table.getRowModel();
 * const rows = model.rows; // Top-level rows
 * const allRows = model.flatRows; // All rows (flattened)
 * const row = model.getRow('user-123'); // Fast lookup
 * ```
 */
export interface RowModel<TData extends RowData> {
  // === Row Collections ===

  /**
   * Top-level rows in current view.
   * Does not include nested rows.
   */
  readonly rows: readonly Row<TData>[];

  /**
   * All rows including nested (flattened).
   * Maintains expansion state - only shows expanded rows.
   */
  readonly flatRows: readonly Row<TData>[];

  /**
   * All rows regardless of expansion state.
   * Full hierarchical data representation.
   */
  readonly allRows: readonly Row<TData>[];

  // === Efficient Lookups ===

  /**
   * Map for O(1) row lookup by ID.
   */
  readonly rowsById: ReadonlyMap<RowId, Row<TData>>;

  /**
   * Get row by ID.
   * Uses internal map for fast access.
   */
  getRow(id: RowId): Row<TData> | undefined;

  /**
   * Get row by original data index.
   */
  getRowByOriginalIndex(index: number): Row<TData> | undefined;

  // === Statistics ===

  /**
   * Total number of top-level rows.
   */
  readonly totalRowCount: number;

  /**
   * Total number of all rows (including nested).
   */
  readonly totalFlatRowCount: number;

  /**
   * Number of selected rows.
   */
  readonly selectedRowCount: number;

  /**
   * Number of expanded rows.
   */
  readonly expandedRowCount: number;

  // === Bulk Operations ===

  /**
   * Get all selected rows.
   */
  getSelectedRows(): readonly Row<TData>[];

  /**
   * Get all expanded rows.
   */
  getExpandedRows(): readonly Row<TData>[];

  /**
   * Get rows matching a predicate.
   */
  filterRows(predicate: RowPredicate<TData>): readonly Row<TData>[];

  /**
   * Find first row matching predicate.
   */
  findRow(predicate: RowPredicate<TData>): Row<TData> | undefined;

  // === Metadata ===

  /**
   * Model metadata and statistics.
   */
  readonly meta: RowModelMeta;
}

/**
 * Predicate function for row filtering.
 */
export type RowPredicate<TData> = (
  row: Row<TData>,
  index: number,
  array: readonly Row<TData>[]
) => boolean;
````

### **4. Supporting Metadata Types**

```typescript
/**
 * Row-level metadata.
 */
export interface RowMeta {
  /** CSS class names */
  readonly className?: string;

  /** Inline styles */
  readonly style?: Record<string, string>;

  /** Row height override */
  readonly height?: number;

  /** Is row disabled */
  readonly disabled?: boolean;

  /** Custom properties */
  readonly [key: string]: unknown;
}

/**
 * Row model metadata and statistics.
 */
export interface RowModelMeta {
  /** Total processing time */
  readonly processingTime: number;

  /** Memory usage estimate */
  readonly memoryUsage: number;

  /** Cache hit rates */
  readonly cacheStats: CacheStats;

  /** Custom statistics */
  readonly [key: string]: unknown;
}

/**
 * Cell metadata from column configuration.
 */
export interface CellMeta {
  /** Is cell editable */
  readonly editable?: boolean;

  /** Validation rules */
  readonly validation?: CellValidation;

  /** CSS classes */
  readonly className?: string;

  /** Inline styles */
  readonly style?: Record<string, string>;

  /** Data type for formatting */
  readonly type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';

  /** Formatting options */
  readonly format?: CellFormat;

  /** Tooltip content */
  readonly tooltip?: string;

  /** Custom properties */
  readonly [key: string]: unknown;
}

/**
 * Cell validation rules.
 */
export interface CellValidation {
  /** Required field */
  readonly required?: boolean;

  /** Minimum value (numbers/dates) */
  readonly min?: number | Date;

  /** Maximum value (numbers/dates) */
  readonly max?: number | Date;

  /** Pattern for strings */
  readonly pattern?: RegExp;

  /** Custom validation function */
  readonly validate?: (value: unknown) => ValidationResult;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly message?: string;
  readonly errors?: ValidationError[];
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No tree traversal algorithms
- ❌ No selection logic implementation
- ❌ No filtering/sorting logic
- ❌ No DOM rendering or virtualization
- ❌ No event handling
- ❌ No state management implementation

## 📁 **File Structure**

```
packages/core/src/types/row/
├── Cell.ts            # Cell interface
├── Row.ts            # Row interface
├── RowModel.ts       # Row model interface
├── Metadata.ts       # Supporting metadata types
└── index.ts         # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('Row & Cell Types', () => {
  test('Row supports hierarchical data', () => {
    interface OrgData {
      id: string;
      name: string;
      children?: OrgData[];
    }

    type RowType = Row<OrgData>;

    // Should support parent-child relationships
    expectTypeOf<RowType['parentRow']>().toMatchTypeOf<
      Row<OrgData> | undefined
    >();

    expectTypeOf<RowType['subRows']>().toMatchTypeOf<readonly Row<OrgData>[]>();
  });

  test('Cell provides typed value access', () => {
    interface User {
      name: string;
      age: number;
    }

    type CellType = Cell<User, string>;

    // getValue() should return correct type
    expectTypeOf<CellType['getValue']>().returns.toBeString();
  });

  test('RowModel provides efficient lookups', () => {
    type Model = RowModel<any>;

    // Should have map for O(1) lookups
    expectTypeOf<Model['rowsById']>().toMatchTypeOf<
      ReadonlyMap<RowId, Row<any>>
    >();

    // Should have fast lookup method
    expectTypeOf<Model['getRow']>().returns.toMatchTypeOf<
      Row<any> | undefined
    >();
  });
});
```

## 💡 **Key Design Patterns**

```typescript
// 1. Immutable collections for React/Vue compatibility
type ReadonlyCellArray = readonly Cell<TData>[];
type ReadonlyRowArray = readonly Row<TData>[];

// 2. Hierarchical data with parent references
interface TreeNode<T> {
  readonly data: T;
  readonly parent?: TreeNode<T>;
  readonly children: readonly TreeNode<T>[];
}

// 3. Efficient lookup patterns
interface IndexedCollection<T> {
  readonly items: readonly T[];
  readonly byId: ReadonlyMap<string, T>;
  readonly byIndex: ReadonlyMap<number, T>;
}
```

## 📊 **Success Metrics**

- ✅ Full hierarchical data support with type safety
- ✅ Efficient O(1) lookups for rows and cells
- ✅ Immutable interfaces for framework compatibility
- ✅ Comprehensive metadata system
- ✅ 100% type test coverage for tree operations
- ✅ Clear separation between data and UI state

## 🎯 **AI Implementation Instructions**

1. **Start with `Cell` interface** - basic data unit
2. **Implement `Row` interface** - with hierarchical support
3. **Add `RowModel` interface** - collection management
4. **Create metadata types** - for extensibility
5. **Write type tests** - focus on tree operations and type safety

**Critical:** The hierarchical data support must be type-safe and efficient. Parent-child relationships should be clear in the type system.

---

**Status:** Ready for implementation. Tree data structures require careful typing.
