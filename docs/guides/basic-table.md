# Basic Table Fundamentals

Learn the core concepts of GridKit tables. This guide covers the fundamental building blocks you need to understand.

## What You'll Learn

- Table instance and lifecycle
- Column definitions
- Row models
- State management
- Basic configuration

## Prerequisites

- Completed [Installation](installation.md)
- Completed [Getting Started](getting-started.md)

---

## 1. Table Instance

The table instance is the central object in GridKit. It manages all table functionality.

### Creating a Table

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

### Table Lifecycle

```typescript
// Create table
const table = createTable({ data, columns });

// Access state
const state = table.getState();

// Update state
table.setState((prev) => ({
  ...prev,
  pagination: { pageIndex: 1, pageSize: 20 },
}));

// Subscribe to changes
const unsubscribe = table.subscribe((newState) => {
  console.log('State changed:', newState);
});

// Cleanup
table.destroy();
unsubscribe();
```

### Table Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getState()` | Get current table state | `TableState` |
| `setState(updater)` | Update table state | `void` |
| `subscribe(listener)` | Subscribe to state changes | `Unsubscribe` |
| `getAllColumns()` | Get all columns | `Column[]` |
| `getVisibleColumns()` | Get visible columns | `Column[]` |
| `getColumn(id)` | Get column by ID | `Column \| undefined` |
| `getRowModel()` | Get row model | `RowModel` |
| `getRow(id)` | Get row by ID | `Row \| undefined` |
| `reset()` | Reset to initial state | `void` |
| `destroy()` | Cleanup and destroy | `void` |

---

## 2. Column Definitions

Columns define the structure and behavior of your table.

### Basic Column

```typescript
import type { ColumnDef } from '@tanstack/react-table';

const column: ColumnDef<User> = {
  accessorKey: 'name',
  header: 'Full Name',
};
```

### Column with Custom Header

```typescript
const column: ColumnDef<User> = {
  accessorKey: 'email',
  header: ({ column }) => (
    <div className="flex items-center gap-2">
      <span>Email Address</span>
      {column.getIsSorted() && (
        <span>{column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
      )}
    </div>
  ),
};
```

### Column with Custom Cell

```typescript
const column: ColumnDef<User> = {
  accessorKey: 'email',
  cell: ({ row, getValue }) => {
    const user = row.original;
    return (
      <a href={`mailto:${getValue()}`}>
        {user.name}: {getValue()}
      </a>
    );
  },
};
```

### Column with Formatting

```typescript
const column: ColumnDef<User> = {
  accessorKey: 'createdAt',
  cell: ({ getValue }) => {
    const date = new Date(getValue<string>());
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
};
```

### Column Options

```typescript
const column: ColumnDef<User> = {
  // Required
  accessorKey: 'name',
  header: 'Name',
  
  // Optional
  id: 'custom-id', // Override column ID
  size: 150, // Column width
  minSize: 100, // Minimum width
  maxSize: 300, // Maximum width
  
  // Features
  enableSorting: true,
  enableFiltering: true,
  enableHiding: true,
  enablePinning: true,
  enableResizing: true,
  
  // Aggregation
  aggregateFn: 'count',
  
  // Metadata
  meta: {
    description: 'User full name',
    tooltip: 'Click to sort',
  },
};
```

---

## 3. Row Model

The row model manages how data is processed and displayed.

### Accessing Rows

```typescript
// Get all rows
const allRows = table.getRowModel().rows;

// Get filtered rows
const filteredRows = table.getFilteredRowModel().rows;

// Get paginated rows
const paginatedRows = table.getPaginatedRowModel().rows;

// Get specific row
const row = table.getRow('row-id');
```

### Row Properties

```typescript
const row = table.getRowModel().rows[0];

// Row data
row.id;           // Unique row ID
row.original;     // Original data object
row.index;        // Index in current model
row.depth;        // Nesting depth (for tree data)

// Row state
row.getIsSelected();
row.getIsExpanded();
row.getIsAllParentsSelected();

// Row actions
row.toggleSelected();
row.toggleExpanded();
row.pinRow('left');
```

### Row Cells

```typescript
const row = table.getRowModel().rows[0];

// Get all cells
const cells = row.getAllCells();

// Get visible cells
const visibleCells = row.getVisibleCells();

// Access cell
const nameCell = row.getValue('name');

// Render cell
cells.forEach((cell) => {
  const content = cell.renderCell();
});
```

---

## 4. State Management

GridKit uses immutable state management with a pub/sub pattern.

### State Structure

```typescript
interface TableState {
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
  
  // Plugin state
  [key: string]: unknown;
}
```

### Reading State

```typescript
// Get full state
const state = table.getState();

// Get specific state slices
const sorting = table.getState().sorting;
const pagination = table.getState().pagination;
const columnVisibility = table.getState().columnVisibility;
```

### Updating State

```typescript
// Direct update
table.setState((prev) => ({
  ...prev,
  sorting: [{ id: 'name', desc: false }],
}));

// Update pagination
table.setState((prev) => ({
  ...prev,
  pagination: { pageIndex: 2, pageSize: 50 },
}));

// Update column visibility
table.setState((prev) => ({
  ...prev,
  columnVisibility: {
    ...prev.columnVisibility,
    email: false,
  },
}));
```

### Subscribing to Changes

```typescript
// Subscribe to all state changes
const unsubscribe = table.subscribe((state) => {
  console.log('State changed:', state);
});

// Subscribe to specific changes
let previousSorting = table.getState().sorting;

const unsubscribe = table.subscribe((state) => {
  if (state.sorting !== previousSorting) {
    console.log('Sorting changed:', state.sorting);
    previousSorting = state.sorting;
  }
});

// Cleanup
unsubscribe();
```

---

## 5. Basic Configuration

### Table Options

```typescript
const table = createTable({
  // Required
  data,
  columns,
  
  // Optional
  getRowId: (row, index) => row.id.toString(),
  getSubRows: (row) => row.children,
  
  // Initial state
  initialState: {
    pagination: { pageIndex: 0, pageSize: 20 },
    sorting: [{ id: 'name', desc: false }],
    columnVisibility: { email: true },
  },
  
  // Debug mode
  debugMode: true,
  
  // State change handler
  onStateChange: (state) => {
    console.log('State changed:', state);
  },
  
  // Default column options
  defaultColumn: {
    size: 150,
    minSize: 100,
    maxSize: 300,
  },
  
  // Custom metadata
  meta: {
    tableName: 'users',
  },
});
```

### Feature Flags

```typescript
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter';

const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    // Enable features
    events: true,
    performance: true,
    validation: true,
    debug: true,
    
    // Or configure
    events: {
      middleware: [debounceMiddleware],
    },
    performance: {
      budgets: {
        rowModelBuild: 16,
        sorting: 50,
      },
    },
  },
});
```

---

## 6. Common Patterns

### Pattern 1: Basic Read-Only Table

```typescript
function ReadOnlyTable({ data }: { data: User[] }) {
  const table = useGridEnhancedTable({
    data,
    columns: [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
    ],
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id}>{header.renderHeader()}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{cell.renderCell()}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Pattern 2: Selectable Rows

```typescript
function SelectableTable({ data }: { data: User[] }) {
  const table = useGridEnhancedTable({
    data,
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
      { accessorKey: 'email', header: 'Email' },
    ],
  });

  return (
    <>
      <div>
        Selected: {Object.keys(table.getState().rowSelection).length}
      </div>
      <table>{/* ... */}</table>
    </>
  );
}
```

### Pattern 3: Sortable Columns

```typescript
function SortableTable({ data }: { data: User[] }) {
  const table = useGridEnhancedTable({
    data,
    columns: [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <div
            onClick={column.getToggleSortingHandler()}
            style={{ cursor: 'pointer' }}
          >
            Name
            {{ asc: ' ↑', desc: ' ↓' }[column.getIsSorted() as string] ?? ''}
          </div>
        ),
        enableSorting: true,
      },
      { accessorKey: 'email', header: 'Email', enableSorting: true },
    ],
  });

  return <table>{/* ... */}</table>;
}
```

### Pattern 4: Pagination

```typescript
function PaginatedTable({ data }: { data: User[] }) {
  const table = useGridEnhancedTable({
    data,
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <>
      <table>{/* ... */}</table>
      <div className="pagination">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          First
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page {table.getState().pagination?.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          Last
        </button>
        <select
          value={table.getState().pagination?.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
```

---

## 7. Best Practices

### 1. Use Stable Row IDs

```typescript
// ✅ Good - using unique ID
const table = createTable({
  data,
  columns,
  getRowId: (row) => row.id.toString(),
});

// ❌ Bad - using index (causes issues with sorting/filtering)
const table = createTable({
  data,
  columns,
  getRowId: (row, index) => index.toString(),
});
```

### 2. Memoize Column Definitions

```typescript
// ✅ Good - memoized columns
const columns = useMemo<ColumnDef<User>[]>(() => [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
], []);

// ❌ Bad - columns recreated every render
const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];
```

### 3. Cleanup Subscriptions

```typescript
useEffect(() => {
  const unsubscribe = table.subscribe((state) => {
    console.log('State changed:', state);
  });

  return () => unsubscribe(); // Cleanup on unmount
}, [table]);
```

### 4. Use Initial State for Defaults

```typescript
// ✅ Good - set defaults in initialState
const table = useGridEnhancedTable({
  data,
  columns,
  initialState: {
    pagination: { pageIndex: 0, pageSize: 20 },
    sorting: [{ id: 'name', desc: false }],
  },
});

// ❌ Bad - manually setting state after creation
const table = useGridEnhancedTable({ data, columns });
table.setState({ pagination: { pageIndex: 0, pageSize: 20 } });
```

---

## 8. Troubleshooting

### Table doesn't render

**Check:**
- Data array is not empty
- Columns are properly defined
- Table component is in the render tree

```typescript
console.log('Data:', data);
console.log('Columns:', columns);
console.log('Rows:', table.getRowModel().rows.length);
```

### Columns not showing

**Check:**
- Column `accessorKey` matches data property
- Column visibility is not set to `false`
- `getVisibleColumns()` is used for rendering

```typescript
// Debug column visibility
console.log('All columns:', table.getAllColumns());
console.log('Visible columns:', table.getVisibleColumns());
console.log('Visibility state:', table.getState().columnVisibility);
```

### State not updating

**Check:**
- Using immutable updates (spread operator)
- Not mutating state directly
- Subscription cleanup is correct

```typescript
// ✅ Correct
table.setState((prev) => ({ ...prev, sorting: newSorting }));

// ❌ Wrong
table.getState().sorting = newSorting;
```

---

## Next Steps

- [Column Pinning](column-pinning.md) - Keep columns visible while scrolling
- [Event System](../api/events.md) - Listen to table events
- [Plugin System](../plugin-system.md) - Extend functionality

---

**Related Resources**

- [API Reference](../api/core.md) - Complete API documentation
- [Architecture](../architecture/ARCHITECTURE.md) - Deep dive into architecture
- [Examples](https://github.com/gridkit/gridkit/tree/main/examples) - Code examples
