# Getting Started with GridKit

Get up and running with GridKit in 5 minutes. This guide will help you create your first table with basic functionality.

## What You'll Learn

- Install GridKit packages
- Create a basic table
- Add columns and data
- Enable sorting and filtering
- Use the event system

## Prerequisites

- Node.js >= 16.0.0
- Basic knowledge of TypeScript
- A React project (for this guide)

**Time to complete:** 5 minutes

---

## Step 1: Install Dependencies

Install the required packages:

```bash
npm install @gridkit/core @gridkit/tanstack-adapter @tanstack/react-table
```

## Step 2: Define Your Data

Create a TypeScript interface for your data and some sample data:

```typescript
// types.ts
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// sample-data.ts
export const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', createdAt: '2024-02-20' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive', createdAt: '2024-03-10' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Manager', status: 'active', createdAt: '2024-04-05' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'active', createdAt: '2024-05-12' },
];
```

## Step 3: Define Columns

Create column definitions for your table:

```typescript
// columns.ts
import type { ColumnDef } from '@tanstack/react-table';
import type { User } from './types';

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    filterFn: 'equals',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue<'active' | 'inactive'>();
      return (
        <span style={{
          color: status === 'active' ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {status.toUpperCase()}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
  },
];
```

## Step 4: Create the Table Component

Create a React component that uses GridKit:

```tsx
// UserTable.tsx
import React from 'react';
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter';
import type { User } from './types';
import { columns } from './columns';

interface UserTableProps {
  data: User[];
}

export function UserTable({ data }: UserTableProps) {
  const table = useGridEnhancedTable({
    data,
    columns,
    features: {
      events: true,
      performance: true,
      validation: true,
    },
  });

  // Subscribe to row selection events
  table.on('row:select', (event) => {
    console.log('Row selected:', event.payload.rowId);
  });

  return (
    <div className="table-container">
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  {header.isPlaceholder
                    ? null
                    : header.renderHeader()}
                  {{
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => row.toggleSelected()}
              style={{
                backgroundColor: row.getIsSelected() ? '#e3f2fd' : undefined,
                cursor: 'pointer',
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {cell.renderCell()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
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
      </div>
    </div>
  );
}
```

## Step 5: Use the Table in Your App

Use the table component in your main application:

```tsx
// App.tsx
import React from 'react';
import { UserTable } from './UserTable';
import { users } from './sample-data';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>User Management</h1>
      <UserTable data={users} />
    </div>
  );
}

export default App;
```

## Step 6: Add Basic Styling

Add some CSS to make the table look presentable:

```css
/* styles.css */
.table-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
  user-select: none;
}

tr:hover {
  background-color: #f9f9f9;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: #f5f5f5;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background-color: #f0f0f0;
}
```

## Step 7: Run Your Application

Start your development server:

```bash
npm run dev
```

Open your browser and you should see a fully functional table with:
- ✅ Sortable columns (click on headers)
- ✅ Row selection (click on rows)
- ✅ Pagination
- ✅ Event logging in console

---

## What's Next?

Now that you have a basic table working, explore these topics:

### Learn More
- [Basic Table](basic-table.md) - Deep dive into table fundamentals
- [Column Pinning](column-pinning.md) - Keep columns visible while scrolling
- [Installation](installation.md) - Complete installation guide

### Advanced Features
- [Event System](../api/events.md) - Listen to table events
- [Plugin System](../plugin-system.md) - Extend with plugins
- [Performance Monitoring](../packages/core/src/performance/README.md) - Track performance

### Examples
- [Data Providers](guides/data-providers.md) - Work with APIs
- [Validation](guides/validation.md) - Add form validation
- [Export](guides/export.md) - Export to CSV/Excel

---

## Common Issues

### Table doesn't render
- Check that data and columns are properly defined
- Ensure you're using the correct import paths
- Verify React DevTools shows the component is rendering

### Sorting doesn't work
- Ensure `enableSorting: true` is set on columns
- Check that `features.events` is enabled
- Verify the column has a valid `accessorKey`

### Events not firing
- Ensure `features.events` is set to `true`
- Check browser console for errors
- Verify event handler signatures match the expected types

---

## Complete Example

Here's the complete code in one file for reference:

```tsx
import React from 'react';
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter';
import type { ColumnDef } from '@tanstack/react-table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const data: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive' },
];

const columns: ColumnDef<User>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email', enableSorting: true },
  { accessorKey: 'role', header: 'Role' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <span style={{ color: getValue() === 'active' ? 'green' : 'red' }}>
        {getValue()}
      </span>
    ),
  },
];

export function UserTable() {
  const table = useGridEnhancedTable({
    data,
    columns,
    features: { events: true },
  });

  table.on('row:select', (event) => {
    console.log('Selected:', event.payload.rowId);
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                {header.renderHeader()}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} onClick={() => row.toggleSelected()}>
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

---

**Need Help?**

- Check the [API Reference](../api/core.md) for detailed documentation
- Read the [Architecture](../architecture/ARCHITECTURE.md) for deep understanding
- Open an issue on [GitHub](https://github.com/gridkit/gridkit/issues)
