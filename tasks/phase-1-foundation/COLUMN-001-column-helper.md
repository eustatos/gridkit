---
task_id: COLUMN-001
epic_id: EPIC-001
module: @gridkit/core
file: src/core/column/create-column-helper.ts
priority: P0
complexity: medium
estimated_tokens: ~12,000
assignable_to_ai: yes
dependencies:
  - CORE-003
guidelines:
  - .github/AI_GUIDELINES.md
  - CONTRIBUTING.md
---

# Task: Implement Column Helper

## Context

Implement `createColumnHelper<TData>()` - a type-safe builder for column definitions. This provides excellent DX by inferring types from accessors.

## Objectives

- [ ] Implement `createColumnHelper<TData>()` factory
- [ ] Implement `accessor()` method (string and function overloads)
- [ ] Implement `display()` method (for non-data columns)
- [ ] Implement `group()` method (for grouped columns)
- [ ] Add comprehensive tests
- [ ] Ensure perfect type inference

## Implementation

**File: `src/core/column/create-column-helper.ts`**

```typescript
import type { RowData, AccessorValue } from '../types/base';
import type { ColumnDef, AccessorFn } from '../types/column';

/**
 * Creates a type-safe column helper.
 * Provides methods for creating column definitions with full type inference.
 */
export function createColumnHelper<TData extends RowData>() {
  return {
    accessor: createAccessorColumn<TData>,
    display: createDisplayColumn<TData>,
    group: createGroupColumn<TData>,
  };
}

function createAccessorColumn<TData extends RowData>(
  accessor: string | AccessorFn<TData, any>,
  column: Partial<ColumnDef<TData>>
): ColumnDef<TData> {
  if (typeof accessor === 'string') {
    return {
      ...column,
      accessorKey: accessor,
    };
  }
  
  if (!column.id) {
    throw new GridKitError(
      'COLUMN_INVALID_ACCESSOR',
      'id is required when using accessorFn'
    );
  }
  
  return {
    ...column,
    accessorFn: accessor,
  };
}

function createDisplayColumn<TData extends RowData>(
  column: Partial<ColumnDef<TData>> & { id: string; cell: any }
): ColumnDef<TData> {
  return column;
}

function createGroupColumn<TData extends RowData>(
  column: Partial<ColumnDef<TData>> & { id: string }
): ColumnDef<TData> {
  return column;
}
```

## Tests

Test type inference, both overloads, error cases.

## Success Criteria

- [ ] Perfect type inference in IDE
- [ ] Both accessor overloads work
- [ ] Error handling for missing id
- [ ] 100% test coverage

## Related Tasks

- **Depends on:** CORE-003
- **Blocks:** Example usage, documentation