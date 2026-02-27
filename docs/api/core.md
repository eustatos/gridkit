# Core API Reference

The Core API provides the foundation for creating and managing tables in GridKit.

## Installation

```bash
npm install @gridkit/core
```

## Quick Example

```typescript
import { createTable } from '@gridkit/core';
import type { ColumnDef } from '@tanstack/react-table';

interface User {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

const data: User[] = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' },
];

const table = createTable({
  data,
  columns,
});
```

---

## Functions

### createTable<TData>()

Creates a new table instance with the provided configuration.

**Signature:**
```typescript
function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData>;
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `TableOptions<TData>` | Yes | Table configuration options |

**Options:**

```typescript
interface TableOptions<TData> {
  // Required
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  
  // Optional
  getRowId?: (row: TData, index: number, parent?: Row<TData>) => string;
  getSubRows?: (row: TData, index: number) => TData[] | undefined;
  initialState?: Partial<TableState<TData>>;
  debugMode?: boolean;
  onStateChange?: (state: TableState<TData>) => void;
  defaultColumn?: Partial<ColumnDef<TData, unknown>>;
  meta?: Record<string, unknown>;
}
```

**Returns:** `Table<TData>` instance

**Example:**
```typescript
const table = createTable({
  data: users,
  columns,
  getRowId: (row) => row.id.toString(),
  initialState: {
    pagination: { pageIndex: 0, pageSize: 20 },
  },
  debugMode: true,
});
```

---

## Classes

### Table<TData>

The main table class that manages all table functionality.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique table identifier |
| `options` | `TableOptions<TData>` | Table configuration |
| `state` | `TableState<TData>` | Current table state |
| `columns` | `Column<TData>[]` | All columns |
| `visibleColumns` | `Column<TData>[]` | Visible columns |
| `leftColumns` | `Column<TData>[]` | Left-pinned columns |
| `rightColumns` | `Column<TData>[]` | Right-pinned columns |
| `centerColumns` | `Column<TData>[]` | Center (unpinned) columns |
| `allColumns` | `Column<TData>[]` | All columns including hidden |
| `flatColumns` | `Column<TData>[]` | Flattened column hierarchy |
| `flatHeaders` | `Header<TData>[]` | Flattened header hierarchy |

#### Methods

##### getState()

Returns the current table state.

```typescript
getState(): TableState<TData>;
```

**Example:**
```typescript
const state = table.getState();
console.log(state.sorting);
console.log(state.pagination);
```

##### setState()

Updates the table state.

```typescript
setState(
  updater: Updater<Partial<TableState<TData>>>
): void;
```

**Example:**
```typescript
// Direct update
table.setState({
  sorting: [{ id: 'name', desc: false }],
});

// Functional update
table.setState((prev) => ({
  ...prev,
  pagination: { pageIndex: prev.pagination.pageIndex + 1 },
}));
```

##### subscribe()

Subscribes to state changes.

```typescript
subscribe(
  listener: Listener<TableState<TData>>
): Unsubscribe;
```

**Example:**
```typescript
const unsubscribe = table.subscribe((state) => {
  console.log('State changed:', state);
});

// Later, cleanup
unsubscribe();
```

##### getAllColumns()

Returns all columns.

```typescript
getAllColumns(): Column<TData>[];
```

##### getVisibleColumns()

Returns only visible columns.

```typescript
getVisibleColumns(): Column<TData>[];
```

##### getColumn()

Returns a column by its ID.

```typescript
getColumn(id: ColumnId): Column<TData> | undefined;
```

**Example:**
```typescript
const nameColumn = table.getColumn('name');
if (nameColumn) {
  nameColumn.toggleVisibility();
}
```

##### getRowModel()

Returns the current row model.

```typescript
getRowModel(): RowModel<TData>;
```

**Example:**
```typescript
const rows = table.getRowModel().rows;
console.log(`Total rows: ${rows.length}`);
```

##### getRow()

Returns a row by its ID.

```typescript
getRow(id: RowId): Row<TData> | undefined;
```

##### reset()

Resets the table to its initial state.

```typescript
reset(): void;
```

##### destroy()

Destroys the table and cleans up resources.

```typescript
destroy(): void;
```

---

## Interfaces

### TableState<TData>

Represents the complete state of a table.

```typescript
interface TableState<TData> {
  // Data
  data: TData[];
  
  // Column state
  columnVisibility: Record<ColumnId, boolean>;
  columnOrder: ColumnId[];
  columnSizing: Record<ColumnId, number>;
  columnPinning: {
    left: ColumnId[];
    right: ColumnId[];
  };
  
  // Row state
  rowSelection: Record<RowId, boolean>;
  expanded: Record<RowId, boolean>;
  
  // Feature state
  sorting: SortingState;
  filtering: FilteringState;
  grouping: GroupingState;
  pagination: PaginationState;
  
  // Plugin state (extensible)
  [key: string]: unknown;
}
```

### ColumnDef<TData, TValue>

Defines a column configuration.

```typescript
interface ColumnDef<TData, TValue> {
  // Identification
  accessorKey?: keyof TData;
  accessorFn?: (originalRow: TData, index: number) => TValue;
  id?: string;
  
  // Display
  header?: string | ((props: HeaderProps<TData, TValue>) => ReactNode);
  cell?: (props: CellContext<TData, TValue>) => ReactNode;
  footer?: string | ((props: FooterProps<TData, TValue>) => ReactNode);
  
  // Sizing
  size?: number;
  minSize?: number;
  maxSize?: number;
  
  // Features
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableHiding?: boolean;
  enablePinning?: boolean;
  enableResizing?: boolean;
  enableGrouping?: boolean;
  enableColumnFilter?: boolean;
  
  // Aggregation
  aggregateFn?: AggregationFn<TData>;
  aggregatedCell?: (props: CellContext<TData, TValue>) => ReactNode;
  
  // Metadata
  meta?: Record<string, unknown>;
}
```

### Column<TData>

Represents a column instance.

```typescript
interface Column<TData> {
  // Properties
  id: ColumnId;
  columnDef: ColumnDef<TData, unknown>;
  parent: Column<TData> | null;
  columns: Column<TData>[];
  depth: number;
  
  // State
  getIsVisible(): boolean;
  getIsSorted(): false | 'asc' | 'desc';
  getIsFiltered(): boolean;
  getIsPinned(): false | 'left' | 'right';
  getIsResizing(): boolean;
  getSize(): number;
  
  // Actions
  toggleVisibility(): void;
  toggleSorting(descFirst?: boolean): void;
  clearSorting(): void;
  pin(position?: 'left' | 'right'): void;
  unpin(): void;
  setSize(size: number): void;
  
  // Navigation
  getFirstVisibleLeafColumn(): Column<TData>;
  getLeafColumns(): Column<TData>[];
}
```

### Row<TData>

Represents a row instance.

```typescript
interface Row<TData> {
  // Properties
  id: RowId;
  original: TData;
  index: number;
  depth: number;
  subRows: Row<TData>[];
  parent: Row<TData> | null;
  
  // State
  getIsSelected(): boolean;
  getIsExpanded(): boolean;
  getIsAllParentsSelected(): boolean;
  getIsSomeSelected(): boolean;
  
  // Actions
  toggleSelected(value?: boolean): void;
  toggleExpanded(value?: boolean): void;
  pinRow(position?: 'left' | 'right'): void;
  
  // Data access
  getValue(columnId: ColumnId): unknown;
  getAllCells(): Cell<TData, unknown>[];
  getVisibleCells(): Cell<TData, unknown>[];
  
  // Rendering
  renderValue(columnId: ColumnId): unknown;
}
```

### RowModel<TData>

Represents a row model.

```typescript
interface RowModel<TData> {
  rows: Row<TData>[];
  flatRows: Row<TData>[];
  rowsById: Record<RowId, Row<TData>>;
}
```

### Cell<TData, TValue>

Represents a cell instance.

```typescript
interface Cell<TData, TValue> {
  id: CellId;
  row: Row<TData>;
  column: Column<TData>;
  getValue(): TValue;
  renderCell(): ReactNode;
  getContext(): CellContext<TData, TValue>;
}
```

---

## Type Aliases

### Updater<T>

A value or function that produces a new value.

```typescript
type Updater<T> = T | ((previous: T) => T);
```

### Listener<T>

A callback function for state changes.

```typescript
type Listener<T> = (state: T) => void;
```

### Unsubscribe

A function to unsubscribe from events.

```typescript
type Unsubscribe = () => void;
```

### RowId

Unique identifier for a row.

```typescript
type RowId = string;
```

### ColumnId

Unique identifier for a column.

```typescript
type ColumnId = string;
```

### CellId

Unique identifier for a cell.

```typescript
type CellId = string;
```

---

## Constants

### VERSION

The current version of GridKit Core.

```typescript
const VERSION: string;
```

**Example:**
```typescript
import { VERSION } from '@gridkit/core';
console.log(`GridKit version: ${VERSION}`);
```

---

## Error Classes

### GridKitError

Base error class for GridKit errors.

```typescript
class GridKitError extends Error {
  code: ErrorCode;
  context: Record<string, unknown>;
  
  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>);
}
```

**Example:**
```typescript
try {
  // Some operation
} catch (error) {
  if (error instanceof GridKitError) {
    console.error(`Error ${error.code}: ${error.message}`);
  }
}
```

### ValidationError

Error thrown during validation.

```typescript
class ValidationError extends GridKitError {
  field?: string;
  value?: unknown;
}
```

---

## Utility Functions

### createColumnDef()

Helper function to create column definitions.

```typescript
function createColumnDef<TData, TValue>(
  accessorKey: keyof TData,
  options?: Partial<ColumnDef<TData, TValue>>
): ColumnDef<TData, TValue>;
```

**Example:**
```typescript
const nameColumn = createColumnDef('name', {
  header: 'Full Name',
  enableSorting: true,
});
```

### createTableState()

Helper function to create initial table state.

```typescript
function createTableState<TData>(
  data: TData[],
  columns: ColumnDef<TData, unknown>[],
  initialState?: Partial<TableState<TData>>
): TableState<TData>;
```

---

## Examples

### Basic Table

```typescript
import { createTable } from '@gridkit/core';

const table = createTable({
  data: [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' },
  ],
  columns: [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
  ],
});

console.log(table.getRowModel().rows.length); // 2
```

### Table with Sorting

```typescript
const table = createTable({
  data: users,
  columns: [
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    { accessorKey: 'email', header: 'Email', enableSorting: true },
  ],
  initialState: {
    sorting: [{ id: 'name', desc: false }],
  },
});

// Toggle sorting
const nameColumn = table.getColumn('name');
nameColumn?.toggleSorting();
```

### Table with Selection

```typescript
const table = createTable({
  data: users,
  columns: [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    { accessorKey: 'name', header: 'Name' },
  ],
});

// Get selected rows
const selectedRows = table
  .getRowModel()
  .rows.filter((row) => row.getIsSelected());
```

### Table with Pagination

```typescript
const table = createTable({
  data: users,
  columns,
  initialState: {
    pagination: { pageIndex: 0, pageSize: 20 },
  },
});

// Navigate pages
table.previousPage();
table.nextPage();
table.setPageIndex(5);
table.setPageSize(50);

// Get pagination info
const { pageIndex, pageSize } = table.getState().pagination;
const pageCount = table.getPageCount();
const canPreviousPage = table.getCanPreviousPage();
const canNextPage = table.getCanNextPage();
```

### State Subscription

```typescript
const table = createTable({ data, columns });

// Subscribe to all changes
const unsubscribe = table.subscribe((state) => {
  console.log('State changed:', state);
});

// Subscribe to specific changes
let lastSorting = table.getState().sorting;

const unsubscribeSorting = table.subscribe((state) => {
  if (state.sorting !== lastSorting) {
    console.log('Sorting changed:', state.sorting);
    lastSorting = state.sorting;
  }
});

// Cleanup
unsubscribe();
unsubscribeSorting();
```

---

## See Also

- [Events API](events.md) - Event system and middleware
- [Plugin API](plugin.md) - Plugin development
- [Getting Started](../guides/getting-started.md) - Quick start guide
- [Basic Table](../guides/basic-table.md) - Table fundamentals
