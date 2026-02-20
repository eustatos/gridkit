---
task_id: REACT-018
epic_id: EPIC-REACT
module: @gridkit/react
priority: P1
complexity: high
estimated_tokens: ~16,000
assignable_to_ai: with-review
dependencies:
  - REACT-016
  - REACT-017
---

# Task: Create Example Applications

## Context

Create comprehensive example applications demonstrating real-world usage of GridKit React. These examples serve as templates and learning resources.

## Objectives

- [ ] Create basic CRUD example
- [ ] Create advanced features example
- [ ] Create performance demo
- [ ] Create styling examples
- [ ] Provide migration guide

---

## Implementation

### 1. Basic CRUD Example

Create `examples/basic-crud/App.tsx`:

```tsx
import React, { useState } from 'react';
import { useTable, useSorting, useSelection } from '@gridkit/react';
import type { RowData } from '@gridkit/core';

interface User extends RowData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function BasicCRUDExample() {
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    { id: '2', name: 'Bob', email: 'bob@example.com', role: 'User' },
  ]);
  
  const columns = [
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'email', accessorKey: 'email', header: 'Email' },
    { id: 'role', accessorKey: 'role', header: 'Role' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button onClick={() => handleDelete(row.id)}>Delete</button>
      ),
    },
  ];
  
  const { table } = useTable({ data: users, columns });
  const sorting = useSorting(table);
  const selection = useSelection(table);
  
  const handleDelete = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };
  
  const handleAdd = () => {
    const newUser: User = {
      id: String(Date.now()),
      name: 'New User',
      email: 'new@example.com',
      role: 'User',
    };
    setUsers([...users, newUser]);
  };
  
  return (
    <div className="crud-example">
      <h1>Basic CRUD Example</h1>
      
      <div className="toolbar">
        <button onClick={handleAdd}>Add User</button>
        <button
          onClick={() => {
            selection.selectedRows.forEach(handleDelete);
            selection.clearSelection();
          }}
          disabled={selection.selectedCount === 0}
        >
          Delete Selected ({selection.selectedCount})
        </button>
      </div>
      
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              <th>
                <input
                  type="checkbox"
                  checked={selection.selectedCount === users.length}
                  onChange={() => {
                    if (selection.selectedCount === users.length) {
                      selection.clearSelection();
                    } else {
                      selection.selectAll();
                    }
                  }}
                />
              </th>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={() => sorting.toggleSort(header.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {String(header.column.columnDef.header)}
                  {sorting.getSortDirection(header.id) &&
                    (sorting.getSortDirection(header.id) === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selection.isRowSelected(row.id)}
                  onChange={() => selection.toggleRowSelection(row.id)}
                />
              </td>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>{cell.renderCell()}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 2. Advanced Features Example

Create `examples/advanced-features/App.tsx`:

```tsx
import React, { useState } from 'react';
import {
  useTable,
  useSorting,
  useFiltering,
  usePagination,
  useSelection,
} from '@gridkit/react';

export function AdvancedFeaturesExample() {
  // Large dataset
  const data = generateLargeDataset(1000);
  
  const columns = [
    { id: 'id', accessorKey: 'id', header: 'ID' },
    { id: 'name', accessorKey: 'name', header: 'Name', enableSorting: true },
    { id: 'email', accessorKey: 'email', header: 'Email', enableFiltering: true },
    { id: 'age', accessorKey: 'age', header: 'Age', enableSorting: true },
    { id: 'status', accessorKey: 'status', header: 'Status' },
  ];
  
  const { table } = useTable({
    data,
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });
  
  const sorting = useSorting(table);
  const filtering = useFiltering(table);
  const pagination = usePagination(table);
  const selection = useSelection(table);
  
  const [globalFilter, setGlobalFilter] = useState('');
  
  return (
    <div className="advanced-example">
      <h1>Advanced Features Example</h1>
      
      {/* Global Search */}
      <div className="search">
        <input
          type="text"
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            // Apply to multiple columns
            filtering.setColumnFilter('name', e.target.value);
            filtering.setColumnFilter('email', e.target.value);
          }}
        />
      </div>
      
      {/* Stats */}
      <div className="stats">
        <span>Total: {data.length} rows</span>
        <span>Filtered: {table.getRowModel().rows.length} rows</span>
        <span>Selected: {selection.selectedCount} rows</span>
        <span>Page: {pagination.pageIndex + 1} / {pagination.pageCount}</span>
      </div>
      
      {/* Table with all features */}
      <table>
        {/* Header with sorting */}
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  <div onClick={() => sorting.toggleSort(header.id)}>
                    {String(header.column.columnDef.header)}
                    {sorting.getSortDirection(header.id) &&
                      (sorting.getSortDirection(header.id) === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                  
                  {/* Column filter */}
                  {header.column.columnDef.enableFiltering && (
                    <input
                      type="text"
                      value={filtering.getColumnFilter(header.id) || ''}
                      onChange={(e) =>
                        filtering.setColumnFilter(header.id, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Filter..."
                    />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        
        {/* Body */}
        <tbody>
          {table.getRowModel().rows
            .slice(
              pagination.pageIndex * pagination.pageSize,
              (pagination.pageIndex + 1) * pagination.pageSize
            )
            .map(row => (
              <tr
                key={row.id}
                className={selection.isRowSelected(row.id) ? 'selected' : ''}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{String(cell.getValue())}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      
      {/* Pagination controls */}
      <div className="pagination">
        <button
          onClick={pagination.firstPage}
          disabled={!pagination.canPreviousPage}
        >
          First
        </button>
        <button
          onClick={pagination.previousPage}
          disabled={!pagination.canPreviousPage}
        >
          Previous
        </button>
        
        <span>
          Page{' '}
          <input
            type="number"
            value={pagination.pageIndex + 1}
            onChange={(e) => {
              const page = Number(e.target.value) - 1;
              pagination.setPageIndex(page);
            }}
            style={{ width: '50px' }}
          />
          {' '}of {pagination.pageCount}
        </span>
        
        <button
          onClick={pagination.nextPage}
          disabled={!pagination.canNextPage}
        >
          Next
        </button>
        <button
          onClick={pagination.lastPage}
          disabled={!pagination.canNextPage}
        >
          Last
        </button>
        
        <select
          value={pagination.pageSize}
          onChange={(e) => pagination.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map(size => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function generateLargeDataset(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
    status: i % 2 === 0 ? 'Active' : 'Inactive',
  }));
}
```

### 3. Performance Demo

Create `examples/performance/App.tsx`:

```tsx
import React, { useMemo } from 'react';
import { useTable } from '@gridkit/react';

export function PerformanceDemo() {
  // Generate 10,000 rows
  const data = useMemo(() => generateLargeDataset(10000), []);
  
  const columns = [
    { id: 'id', accessorKey: 'id', header: 'ID' },
    { id: 'name', accessorKey: 'name', header: 'Name' },
    { id: 'value', accessorKey: 'value', header: 'Value' },
  ];
  
  const { table } = useTable({
    data,
    columns,
    debug: true, // Enable performance logging
  });
  
  return (
    <div>
      <h1>Performance Demo - 10,000 Rows</h1>
      <p>Check console for performance metrics</p>
      
      {/* Virtualized rendering would go here */}
      <div style={{ height: '600px', overflow: 'auto' }}>
        <table>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id}>{String(h.column.columnDef.header)}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {/* Show only first 100 for demo */}
            {table.getRowModel().rows.slice(0, 100).map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{String(cell.getValue())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 4. Migration Guide

Create `examples/migration/README.md`:

```markdown
# Migration Guide

## From TanStack Table

```tsx
// Before (TanStack Table)
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});

// After (GridKit React)
import { useTable } from '@gridkit/react';

const { table } = useTable({
  data,
  columns,
});
```

## From AG Grid React

```tsx
// Before (AG Grid)
import { AgGridReact } from 'ag-grid-react';

<AgGridReact
  rowData={data}
  columnDefs={columns}
/>

// After (GridKit React)
import { useTable } from '@gridkit/react';

const { table } = useTable({ data, columns });
// Render table manually or use Table component
```

## From React Table v7

```tsx
// Before (React Table v7)
import { useTable, useSortBy } from 'react-table';

const table = useTable(
  { columns, data },
  useSortBy
);

// After (GridKit React)
import { useTable, useSorting } from '@gridkit/react';

const { table } = useTable({ data, columns });
const sorting = useSorting(table);
```
```

---

## Files to Create

- [ ] `examples/basic-crud/App.tsx`
- [ ] `examples/basic-crud/package.json`
- [ ] `examples/advanced-features/App.tsx`
- [ ] `examples/advanced-features/package.json`
- [ ] `examples/performance/App.tsx`
- [ ] `examples/performance/package.json`
- [ ] `examples/styling/App.tsx`
- [ ] `examples/migration/README.md`
- [ ] `examples/README.md` - Overview of all examples

---

## Success Criteria

- [ ] 5+ working examples
- [ ] All examples run independently
- [ ] Migration guide complete
- [ ] Examples are documented
- [ ] Code is clean and commented

---

## Notes for AI

- Create realistic, production-like examples
- Include comments explaining key concepts
- Provide package.json for each example
- Examples should be copy-paste ready
- Cover common use cases
- Include styling examples
- ⚠️ Request human review before finalizing
