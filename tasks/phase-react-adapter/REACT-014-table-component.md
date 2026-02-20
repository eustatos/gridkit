---
task_id: REACT-014
epic_id: EPIC-REACT
module: @gridkit/react
file: src/components/Table.tsx
priority: P2
complexity: medium
estimated_tokens: ~8,000
assignable_to_ai: yes
dependencies:
  - REACT-005
  - REACT-008
  - REACT-009
---

# Task: Create Table Component (Optional)

## Context

Create an optional Table component wrapper that provides a quick start for basic tables. This is optional for MVP but useful for developers who want a component-based API.

## Objectives

- [ ] Create basic Table component
- [ ] Support all table features
- [ ] Provide customization options
- [ ] Keep it lightweight

---

## Implementation

Create `src/components/Table.tsx`:

```typescript
import React from 'react';
import type { RowData, ColumnDef } from '@gridkit/core';
import { useTable } from '../hooks/useTable';
import type { UseTableOptions } from '../types';

export interface TableProps<TData extends RowData>
  extends UseTableOptions<TData> {
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string;
}

export function Table<TData extends RowData>({
  className,
  headerClassName,
  rowClassName,
  cellClassName,
  ...tableOptions
}: TableProps<TData>) {
  const { table } = useTable(tableOptions);
  
  return (
    <table className={className}>
      <thead className={headerClassName}>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : header.renderHeader()}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className={
              typeof rowClassName === 'function'
                ? rowClassName(row.original)
                : rowClassName
            }
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={cellClassName}>
                {cell.renderCell()}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table } from '../Table';
import { testUsers, testColumns } from '../../__tests__/fixtures';

describe('Table', () => {
  it('should render table', () => {
    render(<Table data={testUsers} columns={testColumns} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  
  it('should render data', () => {
    render(<Table data={testUsers} columns={testColumns} />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

---

## Files to Create

- [ ] `src/components/Table.tsx`
- [ ] `src/components/__tests__/Table.test.tsx`
- [ ] `src/components/index.ts`
- [ ] Update main exports

---

## Success Criteria

- [ ] Component renders correctly
- [ ] All features work
- [ ] Tests pass
- [ ] TypeScript types work

---

## Notes

This is optional for MVP. Can be skipped if focusing on hooks-first approach.
