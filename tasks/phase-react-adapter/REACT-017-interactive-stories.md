---
task_id: REACT-017
epic_id: EPIC-REACT
module: @gridkit/react
priority: P1
complexity: medium
estimated_tokens: ~12,000
assignable_to_ai: yes
dependencies:
  - REACT-016
  - REACT-005
  - REACT-006
---

# Task: Create Interactive Stories

## Context

Create comprehensive Storybook stories for all hooks and features. These stories serve as both documentation and interactive examples.

## Objectives

- [ ] Create stories for all hooks
- [ ] Add interactive controls
- [ ] Include usage examples
- [ ] Document all features

---

## Implementation

### 1. useTable Stories

Create `src/stories/useTable.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { useTable } from '../hooks/useTable';
import { testUsers, testColumns } from '../__tests__/fixtures';

const meta: Meta = {
  title: 'Hooks/useTable',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Core hook for creating table instances',
      },
    },
  },
};

export default meta;

export const Basic: StoryObj = {
  render: () => {
    const { table } = useTable({
      data: testUsers,
      columns: testColumns,
    });
    
    return (
      <div>
        <h3>Basic Table</h3>
        <pre>{JSON.stringify(table.getState(), null, 2)}</pre>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>{String(header.column.columnDef.header)}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{String(cell.getValue())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};

export const WithSorting: StoryObj = {
  render: () => {
    const { table } = useTable({
      data: testUsers,
      columns: testColumns,
      initialState: {
        sorting: [{ id: 'name', desc: false }],
      },
    });
    
    return (
      <div>
        <h3>Table with Sorting</h3>
        <p>Sorted by name (ascending)</p>
        {/* Render table... */}
      </div>
    );
  },
};

export const WithFiltering: StoryObj = {
  render: () => {
    const { table } = useTable({
      data: testUsers,
      columns: testColumns,
      initialState: {
        filtering: [{ id: 'name', value: 'Alice', operator: 'contains' }],
      },
    });
    
    return (
      <div>
        <h3>Table with Filtering</h3>
        <p>Filtered by name = "Alice"</p>
        {/* Render table... */}
      </div>
    );
  },
};
```

### 2. useSorting Stories

Create `src/stories/useSorting.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { useTable } from '../hooks/useTable';
import { useSorting } from '../hooks/useSorting';
import { testUsers, testColumns } from '../__tests__/fixtures';

const meta: Meta = {
  title: 'Hooks/useSorting',
  tags: ['autodocs'],
};

export default meta;

export const Interactive: StoryObj = {
  render: () => {
    const { table } = useTable({
      data: testUsers,
      columns: testColumns,
    });
    
    const { sorting, toggleSort, clearSorting, getSortDirection } = useSorting(table);
    
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => toggleSort('name')}>
            Toggle Name Sort {getSortDirection('name') && `(${getSortDirection('name')})`}
          </button>
          <button onClick={() => toggleSort('age')}>
            Toggle Age Sort {getSortDirection('age') && `(${getSortDirection('age')})`}
          </button>
          <button onClick={clearSorting}>Clear Sorting</button>
        </div>
        
        <div>
          <strong>Current Sorting:</strong>
          <pre>{JSON.stringify(sorting, null, 2)}</pre>
        </div>
        
        <table>
          {/* Render table with current sorting... */}
        </table>
      </div>
    );
  },
};
```

### 3. useSelection Stories

Create `src/stories/useSelection.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { useTable } from '../hooks/useTable';
import { useSelection } from '../hooks/useSelection';
import { testUsers, testColumns } from '../__tests__/fixtures';

const meta: Meta = {
  title: 'Hooks/useSelection',
  tags: ['autodocs'],
};

export default meta;

export const Interactive: StoryObj = {
  render: () => {
    const { table } = useTable({
      data: testUsers,
      columns: testColumns,
    });
    
    const {
      selectedRows,
      isRowSelected,
      toggleRowSelection,
      selectAll,
      clearSelection,
      selectedCount,
    } = useSelection(table);
    
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={selectAll}>Select All</button>
          <button onClick={clearSelection}>Clear Selection</button>
          <span style={{ marginLeft: '1rem' }}>
            Selected: {selectedCount} / {testUsers.length}
          </span>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                style={{
                  backgroundColor: isRowSelected(row.id) ? '#e3f2fd' : 'transparent',
                }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={isRowSelected(row.id)}
                    onChange={() => toggleRowSelection(row.id)}
                  />
                </td>
                <td>{row.original.name}</td>
                <td>{row.original.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
};
```

### 4. Complete Example Story

Create `src/stories/CompleteExample.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { useTable } from '../hooks/useTable';
import { useSorting } from '../hooks/useSorting';
import { useFiltering } from '../hooks/useFiltering';
import { usePagination } from '../hooks/usePagination';
import { useSelection } from '../hooks/useSelection';
import { generateLargeDataset, testColumns } from '../__tests__/fixtures';

const meta: Meta = {
  title: 'Examples/Complete Table',
  tags: ['autodocs'],
};

export default meta;

export const FullFeatured: StoryObj = {
  render: () => {
    const data = generateLargeDataset(100);
    
    const { table } = useTable({
      data,
      columns: testColumns,
      initialState: {
        pagination: { pageIndex: 0, pageSize: 10 },
      },
    });
    
    const sorting = useSorting(table);
    const filtering = useFiltering(table);
    const pagination = usePagination(table);
    const selection = useSelection(table);
    
    const [searchTerm, setSearchTerm] = useState('');
    
    return (
      <div style={{ padding: '1rem' }}>
        <h2>Full-Featured Table Example</h2>
        
        {/* Controls */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          <input
            placeholder="Search name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              filtering.setColumnFilter('name', e.target.value);
            }}
          />
          
          <button onClick={selection.selectAll}>Select All</button>
          <button onClick={selection.clearSelection}>Clear Selection</button>
          
          <span>Selected: {selection.selectedCount}</span>
        </div>
        
        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selection.selectedCount === data.length}
                  onChange={selection.selectAll}
                />
              </th>
              {table.getAllColumns().map((col) => (
                <th
                  key={col.id}
                  onClick={() => sorting.toggleSort(col.id)}
                  style={{ cursor: 'pointer', padding: '0.5rem' }}
                >
                  {String(col.columnDef.header)}
                  {sorting.getSortDirection(col.id) &&
                    (sorting.getSortDirection(col.id) === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows
              .slice(
                pagination.pageIndex * pagination.pageSize,
                (pagination.pageIndex + 1) * pagination.pageSize
              )
              .map((row) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: selection.isRowSelected(row.id)
                      ? '#e3f2fd'
                      : 'transparent',
                  }}
                >
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={selection.isRowSelected(row.id)}
                      onChange={() => selection.toggleRowSelection(row.id)}
                    />
                  </td>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: '0.5rem' }}>
                      {String(cell.getValue())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={pagination.firstPage}
            disabled={!pagination.canPreviousPage}
          >
            {'<<'}
          </button>
          <button
            onClick={pagination.previousPage}
            disabled={!pagination.canPreviousPage}
          >
            {'<'}
          </button>
          <span>
            Page {pagination.pageIndex + 1} of {pagination.pageCount}
          </span>
          <button
            onClick={pagination.nextPage}
            disabled={!pagination.canNextPage}
          >
            {'>'}
          </button>
          <button
            onClick={pagination.lastPage}
            disabled={!pagination.canNextPage}
          >
            {'>>'}
          </button>
          
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  },
};
```

---

## Files to Create

- [ ] `src/stories/useTable.stories.tsx`
- [ ] `src/stories/useSorting.stories.tsx`
- [ ] `src/stories/useFiltering.stories.tsx`
- [ ] `src/stories/usePagination.stories.tsx`
- [ ] `src/stories/useSelection.stories.tsx`
- [ ] `src/stories/CompleteExample.stories.tsx`

---

## Success Criteria

- [ ] 20+ stories created
- [ ] All hooks documented
- [ ] Interactive controls work
- [ ] Examples are clear
- [ ] Storybook builds successfully

---

## Notes for AI

- Create one story file per hook
- Include interactive examples
- Add controls for all props
- Show real-world use cases
- Include complete example
