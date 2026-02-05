# CORE-003: Column System Types & Interfaces

## Task Card

```
task_id: CORE-003
priority: P0
complexity: High
estimated_tokens: ~15,000
ai_ready: true
dependencies: [CORE-001, CORE-002]
requires_review: true (complex type inference)
```

## 🎯 Objective

Define the complete column type system with advanced type inference for data access, rendering, and feature enablement. Columns are the most complex part of GridKit's type system, requiring sophisticated TypeScript patterns for excellent developer experience.

## 📋 Implementation Scope

### **1. Column Definition (User Configuration)**

````typescript
/**
 * Complete column definition with type-safe accessors.
 * Supports both simple key access and complex computed values.
 *
 * @template TData - Row data type
 * @template TValue - Inferred cell value type
 *
 * @example
 * ```typescript
 * // Simple column
 * const col: ColumnDef<User> = {
 *   accessorKey: 'name',
 *   header: 'Name'
 * };
 *
 * // Computed column
 * const col: ColumnDef<User, string> = {
 *   id: 'fullName',
 *   accessorFn: row => `${row.firstName} ${row.lastName}`,
 *   header: 'Full Name'
 * };
 * ```
 */
export interface ColumnDef<TData extends RowData, TValue = unknown> {
  // === Required: Accessor Definition ===

  /**
   * String key for data access (dot notation supported).
   * Mutually exclusive with `accessorFn`.
   *
   * @example 'user.profile.name'
   */
  accessorKey?: AccessorKey<TData>;

  /**
   * Function for computed values.
   * Requires explicit `id` since no key is provided.
   * Mutually exclusive with `accessorKey`.
   */
  accessorFn?: AccessorFn<TData, TValue>;

  /**
   * Unique column ID (auto-generated from accessorKey).
   * Required when using `accessorFn`.
   */
  id?: ColumnId;

  // === Rendering ===

  /**
   * Header content (string or render function).
   */
  header?: string | HeaderRenderer<TData, TValue>;

  /**
   * Cell content renderer.
   * Receives typed context with getValue().
   */
  cell?: CellRenderer<TData, TValue>;

  /**
   * Footer content (string or render function).
   */
  footer?: string | FooterRenderer<TData, TValue>;

  // === Layout & Sizing ===

  /**
   * Initial width in pixels.
   * @default 150
   */
  size?: number;

  /**
   * Minimum width (resizing constraint).
   * @default 50
   */
  minSize?: number;

  /**
   * Maximum width (resizing constraint).
   * @default Infinity
   */
  maxSize?: number;

  // === Feature Flags ===

  /**
   * Enable sorting for this column.
   * @default true
   */
  enableSorting?: boolean;

  /**
   * Enable filtering for this column.
   * @default true
   */
  enableFiltering?: boolean;

  /**
   * Enable column resizing.
   * @default true
   */
  enableResizing?: boolean;

  /**
   * Enable column visibility toggling.
   * @default true
   */
  enableHiding?: boolean;

  /**
   * Enable column reordering.
   * @default true
   */
  enableReordering?: boolean;

  /**
   * Enable column pinning (freeze).
   * @default false
   */
  enablePinning?: boolean;

  // === Advanced Configuration ===

  /**
   * Custom metadata for application use.
   */
  meta?: ColumnMeta;

  /**
   * Custom sort function (overrides default).
   */
  sortFn?: Comparator<TValue>;

  /**
   * Custom filter function (overrides default).
   */
  filterFn?: FilterFn<TData, TValue>;

  /**
   * Aggregation function for grouped data.
   */
  aggregationFn?: AggregationFn<TValue>;

  /**
   * Column grouping ID (for header grouping).
   */
  columnGroupId?: ColumnGroupId;
}
````

### **2. Accessor Types (Type-Safe Data Access)**

```typescript
/**
 * String key for accessing row data.
 * Uses template literal types for dot notation inference.
 *
 * @template TData - Row data type
 */
export type AccessorKey<TData extends RowData> =
  // Extract all string keys
  StringKeys<TData> extends infer K
    ? K extends string
      ? // Handle nested paths recursively
          | K
          | (TData[K] extends RowData ? `${K}.${AccessorKey<TData[K]>}` : never)
      : never
    : never;

/**
 * Function accessor with proper typing.
 *
 * @template TData - Row data type
 * @template TValue - Return type (inferred if possible)
 */
export type AccessorFn<TData extends RowData, TValue = unknown> = (
  row: TData,
  index: number
) => TValue;

/**
 * Extracts value type from accessor definition.
 * Advanced inference for both key and function accessors.
 *
 * @template TDef - ColumnDef type
 */
export type ColumnValue<TDef> =
  TDef extends ColumnDef<infer TData, infer TValue>
    ? TValue
    : TDef extends { accessorKey: infer TKey }
      ? TKey extends string
        ? AccessorValue<TData, TKey>
        : unknown
      : unknown;
```

### **3. Renderer Context Types**

```typescript
/**
 * Context provided to header renderers.
 * Includes column state and utilities.
 */
export interface HeaderContext<TData extends RowData, TValue = unknown> {
  /** Column instance */
  readonly column: Column<TData, TValue>;

  /** Table instance */
  readonly table: Table<TData>;

  /** Header string (if provided) */
  readonly header: string;

  /** Check if column is sorted */
  readonly getIsSorted: () => boolean;

  /** Get sort direction */
  readonly getSortDirection: () => 'asc' | 'desc' | false;

  /** Toggle sorting */
  readonly toggleSorting: (desc?: boolean) => void;
}

/**
 * Rich context for cell renderers with typed value access.
 */
export interface CellContext<TData extends RowData, TValue = unknown> {
  /** Get typed cell value */
  readonly getValue: () => TValue;

  /** Get raw row data */
  readonly getRow: () => Row<TData>;

  /** Get column instance */
  readonly column: Column<TData, TValue>;

  /** Get table instance */
  readonly table: Table<TData>;

  /** Row index in current view */
  readonly rowIndex: number;

  /** Cell index in row */
  readonly cellIndex: number;

  /** Check if cell is selected */
  readonly getIsSelected: () => boolean;

  /** Render default cell content */
  readonly renderValue: () => unknown;

  /** Cell metadata */
  readonly meta: CellMeta;
}

/**
 * Context for footer renderers.
 */
export interface FooterContext<TData extends RowData, TValue = unknown> {
  readonly column: Column<TData, TValue>;
  readonly table: Table<TData>;
  readonly footer: string;
}
```

### **4. Runtime Column Instance**

```typescript
/**
 * Runtime column instance with state and methods.
 * Created from ColumnDef with added runtime capabilities.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 */
export interface Column<TData extends RowData, TValue = unknown> {
  // === Identification ===

  /** Unique column ID */
  readonly id: ColumnId;

  /** Parent table reference */
  readonly table: Table<TData>;

  /** Original column definition */
  readonly columnDef: ColumnDef<TData, TValue>;

  // === State Accessors ===

  /** Get current width */
  readonly getSize: () => number;

  /** Check if visible */
  readonly getIsVisible: () => boolean;

  /** Get display index */
  readonly getIndex: () => number;

  /** Get pinned position */
  readonly getPinnedPosition: () => 'left' | 'right' | false;

  // === State Mutators ===

  /** Toggle visibility */
  readonly toggleVisibility: (visible?: boolean) => void;

  /** Update size */
  readonly setSize: (size: number) => void;

  /** Reset to default size */
  readonly resetSize: () => void;

  /** Toggle pinning */
  readonly togglePinned: (position?: 'left' | 'right' | false) => void;

  // === Feature State ===

  /** Check if sorted */
  readonly getIsSorted: () => boolean;

  /** Get sort direction */
  readonly getSortDirection: () => 'asc' | 'desc' | false;

  /** Toggle sorting */
  readonly toggleSorting: (desc?: boolean) => void;

  /** Check if filtered */
  readonly getIsFiltered: () => boolean;

  /** Get filter value */
  readonly getFilterValue: () => unknown;

  /** Set filter value */
  readonly setFilterValue: (value: unknown) => void;

  // === Metadata ===

  /** Column metadata */
  readonly meta: ColumnMeta;

  /** Custom utilities */
  readonly utils: ColumnUtils<TData, TValue>;
}
```

### **5. Supporting Types**

```typescript
/**
 * Column metadata (extensible).
 */
export interface ColumnMeta {
  /** Display alignment */
  readonly align?: 'left' | 'center' | 'right';

  /** CSS class names */
  readonly className?: string;

  /** Tooltip text */
  readonly tooltip?: string;

  /** Formatting options */
  readonly format?: ColumnFormat;

  /** Custom properties */
  readonly [key: string]: unknown;
}

/**
 * Cell metadata.
 */
export interface CellMeta {
  /** Is cell editable */
  readonly editable?: boolean;

  /** Validation rules */
  readonly validation?: CellValidation;

  /** CSS classes */
  readonly className?: string;

  /** Data type hint */
  readonly type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
}

/**
 * Column utilities for advanced use cases.
 */
export interface ColumnUtils<TData extends RowData, TValue> {
  /** Format value according to column rules */
  readonly formatValue: (value: TValue) => string;

  /** Parse input to value */
  readonly parseValue: (input: string) => TValue;

  /** Validate value */
  readonly validateValue: (value: TValue) => ValidationResult;

  /** Compare two values for sorting */
  readonly compareValues: (a: TValue, b: TValue) => number;

  /** Check if value matches filter */
  readonly matchesFilter: (value: TValue, filter: unknown) => boolean;
}

/**
 * Renderer function types.
 */
export type HeaderRenderer<TData, TValue> = (
  context: HeaderContext<TData, TValue>
) => unknown;

export type CellRenderer<TData, TValue> = (
  context: CellContext<TData, TValue>
) => unknown;

export type FooterRenderer<TData, TValue> = (
  context: FooterContext<TData, TValue>
) => unknown;

/**
 * Specialized function types.
 */
export type FilterFn<TData, TValue> = (
  row: TData,
  value: TValue,
  filterValue: unknown
) => boolean;

export type AggregationFn<TValue> = (values: TValue[]) => TValue;
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No implementation of column methods
- ❌ No state management logic
- ❌ No rendering engine
- ❌ No sorting/filtering algorithms
- ❌ No DOM manipulation or event handling
- ❌ No framework-specific renderers

## 📁 **File Structure**

```
packages/core/src/types/column/
├── ColumnDef.ts        # Column definition types
├── AccessorTypes.ts    # Accessor type utilities
├── RenderContext.ts    # Renderer context types
├── ColumnInstance.ts   # Runtime column interface
├── SupportingTypes.ts  # Meta, utils, etc.
└── index.ts           # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('Column Type System', () => {
  test('AccessorKey infers nested paths', () => {
    interface Data {
      user: {
        profile: { name: string; age: number };
        email: string;
      };
    }

    type Keys = AccessorKey<Data>;
    // Should include: 'user', 'user.profile', 'user.profile.name',
    // 'user.profile.age', 'user.email'
  });

  test('ColumnValue infers from accessorKey', () => {
    interface User {
      name: string;
      age: number;
    }

    type Col1 = ColumnDef<User, string> & { accessorKey: 'name' };
    type Value1 = ColumnValue<Col1>; // Should be string

    type Col2 = ColumnDef<User> & { accessorKey: 'age' };
    type Value2 = ColumnValue<Col2>; // Should be number
  });

  test('Mutually exclusive accessors enforced', () => {
    // @ts-expect-error - Should not allow both
    const invalid: ColumnDef<any> = {
      accessorKey: 'name',
      accessorFn: () => 'test',
    };
  });
});
```

## 💡 **Advanced TypeScript Patterns**

```typescript
// 1. Conditional type inference for accessors
type InferValue<TData, TDef> = TDef extends { accessorFn: infer Fn }
  ? Fn extends AccessorFn<TData, infer V>
    ? V
    : unknown
  : TDef extends { accessorKey: infer Key }
    ? Key extends string
      ? AccessorValue<TData, Key>
      : unknown
    : unknown;

// 2. Distributive conditional types for union handling
type DistributiveKeys<T> = T extends any ? keyof T : never;

// 3. Template literal types for path inference
type NestedKeys<T> = {
  [K in keyof T & string]: T[K] extends object
    ? K | `${K}.${NestedKeys<T[K]>}`
    : K;
}[keyof T & string];
```

## 📊 **Success Metrics**

- ✅ Full type inference for nested property access
- ✅ Mutually exclusive accessors enforced at compile time
- ✅ Renderer contexts provide all necessary utilities
- ✅ Column metadata is fully extensible
- ✅ 100% type test coverage with complex scenarios
- ✅ No `any` types in public interfaces

## 🎯 **AI Implementation Instructions**

1. **Start with `AccessorKey` type** - most complex part
2. **Implement `ColumnDef` interface** - user configuration
3. **Add renderer context types** - typed value access
4. **Create `Column` instance interface** - runtime API
5. **Write comprehensive type tests** - focus on inference

**Critical:** The `AccessorKey` type must correctly infer nested paths with dot notation. This is the core of GridKit's type safety.

---

**Status:** Ready for implementation. Complex type inference required.
