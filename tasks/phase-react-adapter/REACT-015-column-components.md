---
task_id: REACT-015
epic_id: EPIC-REACT
module: @gridkit/react
file: src/components/Column.tsx
priority: P2
complexity: medium
estimated_tokens: ~7,000
assignable_to_ai: yes
dependencies:
  - REACT-014
---

# Task: Create Column Components (Optional)

## Context

Create declarative Column components for JSX-based column definitions. This is optional for MVP but provides a familiar React API.

## Objectives

- [ ] Create Column component
- [ ] Support all column features
- [ ] Enable JSX column definitions
- [ ] Maintain type safety

---

## Implementation

Create `src/components/Column.tsx`:

```typescript
import type { ReactNode } from 'react';
import type { RowData, ColumnDef } from '@gridkit/core';

export interface ColumnProps<TData extends RowData, TValue = any> {
  id?: string;
  accessorKey?: keyof TData;
  header?: string | ReactNode;
  cell?: (props: { value: TValue; row: TData }) => ReactNode;
  footer?: string | ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * Declarative Column component
 * Note: This is a helper component that doesn't render
 */
export function Column<TData extends RowData, TValue = any>(
  _props: ColumnProps<TData, TValue>
): null {
  return null;
}

/**
 * Extract column definitions from Column components
 */
export function extractColumns<TData extends RowData>(
  children: ReactNode
): ColumnDef<TData>[] {
  const columns: ColumnDef<TData>[] = [];
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === Column) {
      const props = child.props as ColumnProps<TData>;
      
      columns.push({
        id: props.id || String(props.accessorKey),
        accessorKey: props.accessorKey,
        header: props.header,
        cell: props.cell,
        footer: props.footer,
        enableSorting: props.enableSorting,
        enableFiltering: props.enableFiltering,
        size: props.width,
        minSize: props.minWidth,
        maxSize: props.maxWidth,
      } as ColumnDef<TData>);
    }
  });
  
  return columns;
}
```

Update Table component to support Column children:

```typescript
export function Table<TData extends RowData>({
  columns: columnsProp,
  children,
  ...props
}: TableProps<TData> & { children?: ReactNode }) {
  const columns = children
    ? extractColumns<TData>(children)
    : columnsProp;
  
  const { table } = useTable({ ...props, columns });
  
  // ... rest of implementation
}
```

---

## Usage Example

```tsx
<Table data={users}>
  <Column
    accessorKey="name"
    header="Name"
    enableSorting
  />
  <Column
    accessorKey="email"
    header="Email"
  />
  <Column
    accessorKey="age"
    header="Age"
    cell={({ value }) => <strong>{value}</strong>}
  />
</Table>
```

---

## Files to Create

- [ ] `src/components/Column.tsx`
- [ ] Update `src/components/Table.tsx`
- [ ] `src/components/__tests__/Column.test.tsx`
- [ ] Update exports

---

## Success Criteria

- [ ] JSX columns work
- [ ] Type safety maintained
- [ ] All column features supported
- [ ] Tests pass

---

## Notes

Optional for MVP. Can be implemented after core hooks are stable.
