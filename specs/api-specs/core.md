# API Specification: @gridkit/core

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** January 2024

---

## Overview

The `@gridkit/core` module provides the foundational types, interfaces, and logic for GridKit. It is **framework-agnostic** and has **zero dependencies**.

**Key Features:**
- Type-safe table management
- Immutable state management
- Column system with type inference
- Row model with efficient lookups
- Extensible architecture

**Bundle Size:** < 15kb gzipped

---

## Installation

```bash
npm install @gridkit/core
# or
pnpm add @gridkit/core
# or
yarn add @gridkit/core
```

---

## Module Exports

```typescript
// Factory functions
export { createTable } from './table';
export { createColumnHelper } from './column';

// Type exports
export type {
  // Base types
  RowData,
  ColumnId,
  RowId,
  Updater,
  Listener,
  Unsubscribe,
  
  // Table types
  Table,
  TableOptions,
  TableState,
  TableMeta,
  
  // Column types
  ColumnDef,
  Column,
  ColumnHelper,
  AccessorFn,
  HeaderContext,
  CellContext,
  FooterContext,
  
  // Row types
  Row,
  RowModel,
  Cell,
} from './types';

// Error types
export { GridKitError } from './errors';
export type { ErrorCode } from './errors';
```

---

## Quick Start

```typescript
import { createTable, createColumnHelper } from '@gridkit/core';

// 1. Define your data type
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// 2. Create column helper for type safety
const columnHelper = createColumnHelper<User>();

// 3. Define columns
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
  columnHelper.accessor('age', {
    header: 'Age',
  }),
];

// 4. Create table
const table = createTable<User>({
  columns,
  data: users,
});

// 5. Use table
const rows = table.getRowModel().rows;
const columns = table.getVisibleColumns();
```

---

## API Reference

### createTable<TData>()

**Signature:**
```typescript
function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData>
```

**Description:**  
Creates a new table instance with the provided configuration.

**Type Parameters:**
- `TData` - The row data type (must extend `RowData`)

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | `TableOptions<TData>` | Yes | Table configuration |
| options.columns | `ColumnDef<TData>[]` | Yes | Column definitions (min 1 required) |
| options.data | `TData[]` | No | Initial data (default: `[]`) |
| options.getRowId | `(row, index) => RowId` | No | Custom row ID function |
| options.initialState | `Partial<TableState<TData>>` | No | Initial state |
| options.debugMode | `boolean` | No | Enable debug logging |
| options.onStateChange | `(state) => void` | No | State change callback |
| options.defaultColumn | `Partial<ColumnDef>` | No | Default column options |
| options.meta | `TableMeta` | No | Custom metadata |

**Returns:**  
`Table<TData>` - Fully initialized table instance

**Throws:**
- `GridKitError('TABLE_NO_COLUMNS')` - When columns array is empty
- `GridKitError('TABLE_INVALID_OPTIONS')` - When options are invalid

**Examples:**

```typescript
// Basic usage
const table = createTable<User>({
  columns: [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
  ],
  data: users,
});

// With custom row ID
const table = createTable<User>({
  columns,
  data: users,
  getRowId: (row) => row.id.toString(),
});

// With initial state
const table = createTable<User>({
  columns,
  data: users,
  initialState: {
    columnVisibility: { email: false },
    rowSelection: { '1': true },
  },
});

// With state callback
const table = createTable<User>({
  columns,
  data: users,
  onStateChange: (state) => {
    localStorage.setItem('tableState', JSON.stringify(state));
  },
});
```

---

### createColumnHelper<TData>()

**Signature:**
```typescript
function createColumnHelper<TData extends RowData>(): ColumnHelper<TData>
```

**Description:**  
Creates a column helper with full type inference for the specified data type.

**Type Parameters:**
- `TData` - The row data type

**Returns:**  
`ColumnHelper<TData>` - Column helper instance with accessor methods

**Examples:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  profile: {
    avatar: string;
  };
}

const helper = createColumnHelper<User>();

// String accessor (type inferred)
const nameColumn = helper.accessor('name', {
  header: 'Name',
});

// Nested accessor
const avatarColumn = helper.accessor('profile.avatar', {
  header: 'Avatar',
});

// Function accessor
const fullInfoColumn = helper.accessor(
  (row) => `${row.name} (${row.email})`,
  {
    id: 'fullInfo',
    header: 'Full Information',
  }
);

// Display column (no data)
const actionsColumn = helper.display({
  id: 'actions',
  header: 'Actions',
  cell: ({ row }) => (
    <button onClick={() => deleteUser(row.original.id)}>
      Delete
    </button>
  ),
});
```

---

## Table Interface

### getState()

**Signature:**
```typescript
getState(): TableState<TData>
```

**Description:**  
Get current table state (immutable).

**Returns:**  
Current state object

**Example:**
```typescript
const state = table.getState();
console.log(state.data);
console.log(state.rowSelection);
```

---

### setState()

**Signature:**
```typescript
setState(updater: Updater<TableState<TData>>): void
```

**Description:**  
Update table state immutably.

**Parameters:**
- `updater` - New state or updater function

**Example:**
```typescript
// Direct state
table.setState({
  ...table.getState(),
  rowSelection: { '1': true },
});

// Updater function (recommended)
table.setState(prev => ({
  ...prev,
  rowSelection: { '1': true },
}));
```

---

### subscribe()

**Signature:**
```typescript
subscribe(listener: (state: TableState<TData>) => void): () => void
```

**Description:**  
Subscribe to state changes.

**Parameters:**
- `listener` - Callback function called on state changes

**Returns:**  
Unsubscribe function

**Example:**
```typescript
const unsubscribe = table.subscribe((state) => {
  console.log('State updated:', state);
});

// Later: stop listening
unsubscribe();
```

---

### getAllColumns()

**Signature:**
```typescript
getAllColumns(): Column<TData>[]
```

**Description:**  
Get all columns including hidden ones.

**Returns:**  
Array of all column instances

---

### getVisibleColumns()

**Signature:**
```typescript
getVisibleColumns(): Column<TData>[]
```

**Description:**  
Get only visible columns (respects columnVisibility state).

**Returns:**  
Array of visible column instances

---

### getColumn()

**Signature:**
```typescript
getColumn(id: ColumnId): Column<TData> | undefined
```

**Description:**  
Get column by ID.

**Parameters:**
- `id` - Column identifier

**Returns:**  
Column instance or undefined if not found

---

### getRowModel()

**Signature:**
```typescript
getRowModel(): RowModel<TData>
```

**Description:**  
Get current row model (all rows with current filtering/sorting applied).

**Returns:**  
Row model containing rows and metadata

**Example:**
```typescript
const rowModel = table.getRowModel();

console.log(rowModel.rows.length); // Number of rows
console.log(rowModel.flatRows.length); // Including nested

// Iterate rows
rowModel.rows.forEach(row => {
  console.log(row.original); // Original data
  console.log(row.getValue('name')); // Cell value
});
```

---

### reset()

**Signature:**
```typescript
reset(): void
```

**Description:**  
Reset table to initial state.

**Example:**
```typescript
// Make changes
table.setState(prev => ({ ...prev, rowSelection: {} }));

// Reset to initial
table.reset();
```

---

### destroy()

**Signature:**
```typescript
destroy(): void
```

**Description:**  
Destroy table instance and cleanup resources. Table cannot be used after this.

**Example:**
```typescript
table.destroy();
// table is now unusable
```

---

## Row Interface

### getValue<TValue>()

**Signature:**
```typescript
getValue<TValue = unknown>(columnId: ColumnId): TValue
```

**Description:**  
Get value for a specific column.

**Type Parameters:**
- `TValue` - Expected value type (for type safety)

**Parameters:**
- `columnId` - Column identifier

**Returns:**  
Cell value

**Example:**
```typescript
const row = table.getRowModel().rows[0];

const name = row.getValue<string>('name');
const age = row.getValue<number>('age');
```

---

### toggleSelected()

**Signature:**
```typescript
toggleSelected(value?: boolean): void
```

**Description:**  
Toggle row selection.

**Parameters:**
- `value` - New selection state (toggles if undefined)

**Example:**
```typescript
row.toggleSelected(); // Toggle
row.toggleSelected(true); // Select
row.toggleSelected(false); // Deselect
```

---

## Types

### RowData

```typescript
type RowData = Record<string, unknown>;
```

Base constraint for row data. All data types must extend this.

---

### TableState<TData>

```typescript
interface TableState<TData extends RowData> {
  data: TData[];
  columnVisibility: Record<ColumnId, boolean>;
  columnOrder: ColumnId[];
  columnSizing: Record<ColumnId, number>;
  rowSelection: Record<RowId, boolean>;
  expanded: Record<RowId, boolean>;
}
```

Complete table state (immutable).

---

## Error Handling

### GridKitError

```typescript
class GridKitError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: Record<string, unknown>
  );
}
```

**Error Codes:**

| Code | Description | Recovery |
|------|-------------|----------|
| `TABLE_INVALID_OPTIONS` | Invalid table options | Fix options object |
| `TABLE_NO_COLUMNS` | Empty columns array | Add at least one column |
| `COLUMN_INVALID_ACCESSOR` | Invalid accessor config | Provide accessorKey or accessorFn |
| `COLUMN_DUPLICATE_ID` | Duplicate column IDs | Ensure unique IDs |

**Example:**

```typescript
try {
  const table = createTable({ columns: [] });
} catch (error) {
  if (error instanceof GridKitError) {
    console.log(error.code); // 'TABLE_NO_COLUMNS'
    console.log(error.message); // Human-readable
    console.log(error.context); // Additional info
  }
}
```

---

## Performance

### Benchmarks

| Operation | Target | Maximum |
|-----------|--------|----------|
| createTable (1k rows) | < 50ms | < 100ms |
| setState | < 5ms | < 10ms |
| getRowModel | < 1ms | < 5ms |
| Row lookup by ID | < 1ms | < 2ms |

### Optimization Tips

```typescript
// ✅ Use updater function
table.setState(prev => ({ ...prev, rowSelection: {} }));

// ❌ Don't do this (creates new state object)
table.setState({ ...table.getState(), rowSelection: {} });

// ✅ Provide getRowId for efficient lookups
const table = createTable({
  columns,
  data,
  getRowId: (row) => row.id.toString(), // O(1) lookup
});

// ❌ Default uses index (slower for dynamic data)
```

---

## TypeScript Support

### Type Inference

GridKit provides excellent type inference:

```typescript
const helper = createColumnHelper<User>();

const column = helper.accessor('name', {
  cell: ({ getValue }) => {
    const value = getValue(); // Type: string (inferred!)
    return value.toUpperCase();
  },
});
```

### Generic Constraints

```typescript
// ✅ Valid
interface User extends RowData {
  name: string;
}

// ❌ Invalid
interface Invalid {
  name: string; // Must extend RowData
}
```

---

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Requires ES2020 support

---

## Migration Guide

See `/docs/migrations/` for version-specific guides.

---

## Examples

See `/examples/core/` for complete working examples:

- `basic-table.ts` - Minimal table setup
- `custom-columns.ts` - Advanced column configuration
- `state-management.ts` - State persistence
- `type-safety.ts` - TypeScript patterns

---

## Support

- **Documentation:** https://gridkit.dev/docs
- **API Reference:** https://gridkit.dev/api/core
- **GitHub Issues:** https://github.com/gridkit/gridkit/issues
- **Discord:** https://discord.gg/gridkit