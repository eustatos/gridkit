# TASK-005: Implement Multi-Table Support in DevTools Panel

## Goal
Implement support for viewing and switching between multiple tables in the DevTools extension panel.

## Context
Applications may have multiple GridKit tables on a single page. Developers need to inspect each table independently and compare their states.

## Current State
- `packages/devtools/backend/DevToolsBackend.ts` — supports multiple tables via `Map<string, Table>`
- Extension panel has table selector dropdown (basic implementation)
- No clear isolation between table views
- Events/metrics may be mixed for different tables

## Requirements

### 1. Table Selector
Implement dropdown that:
- Lists all registered tables
- Shows table ID, row count, column count
- Highlights currently selected table
- Updates when tables are registered/unregistered

### 2. Table Isolation
Ensure each view shows data for selected table only:
- Events filtered by `tableId`
- Performance metrics per table
- State inspection per table
- Clear separation in UI

### 3. Table Registration Notifications
- Listen for `TABLE_REGISTERED` events
- Listen for `TABLE_UNREGISTERED` events
- Update table list in real-time
- Show notification when table added/removed

### 4. Empty State Handling
When no tables registered:
- Show helpful message
- Explain how to register table with `useDevToolsTable`
- Provide link to documentation

## Technical Requirements

### TypeScript Best Practices
- **NO `any` types** — use `TableMetadata` interface
- Define `TableInfo` interface with explicit properties
- Use discriminated unions for table states
- Properly type selector events

### React Best Practices
- Use `useContext` for selected table state (or Zustand/Redux if available)
- Use `useEffect` for subscription to registration events
- Memoize table list with `useMemo`
- Proper cleanup on unmount

### Code Quality
- Follow existing component patterns
- Consistent naming: `tableId`, `selectedTableId`
- Handle null/undefined for unselected state
- Max component size: 150 lines

## Implementation Steps

### Step 1: Define Table Interfaces
Create `packages/devtools/extension/panel/types/tables.ts`:
```typescript
export interface TableMetadata {
  id: string;
  rowCount: number;
  columnCount: number;
  registeredAt: number;
  state?: Record<string, unknown>;
}

export interface TableSelectorProps {
  tables: TableMetadata[];
  selectedTableId: string | null;
  onTableSelect: (tableId: string) => void;
}
```

### Step 2: Update Table Selector Component
Create `packages/devtools/extension/panel/components/TableSelector.tsx`:
- Dropdown with table options
- Show metadata (rows, columns)
- Handle selection change
- Disabled state when no tables

### Step 3: Implement Table Registration Hook
Create `packages/devtools/extension/panel/hooks/useTableRegistration.ts`:
- Subscribe to `TABLE_REGISTERED` events
- Subscribe to `TABLE_UNREGISTERED` events
- Maintain table list in state
- Provide select/deselect functions

### Step 4: Update DevToolsPanel
Update `packages/devtools/extension/panel/DevToolsPanel.tsx`:
- Integrate TableSelector in header
- Pass selected table to all sub-components
- Show empty state when no table selected
- Filter all data by selected table

### Step 5: Add Empty State Component
Create `packages/devtools/extension/panel/components/NoTablesEmptyState.tsx`:
- Friendly message
- Instructions for registration
- Visual illustration (optional)

## Success Criteria
- [ ] Table selector shows all registered tables
- [ ] Selecting table updates all views (events, performance, state)
- [ ] New tables appear in selector without refresh
- [ ] Unregistered tables removed from selector
- [ ] Empty state shown when no tables
- [ ] No TypeScript errors or ESLint warnings
- [ ] Works with 10+ tables simultaneously

## Related Files
- `packages/devtools/extension/panel/components/TableSelector.tsx` (new/main)
- `packages/devtools/extension/panel/types/tables.ts` (new)
- `packages/devtools/extension/panel/hooks/useTableRegistration.ts` (new)
- `packages/devtools/extension/panel/components/NoTablesEmptyState.tsx` (new)
- `packages/devtools/extension/panel/DevToolsPanel.tsx` (update)
- `packages/devtools/backend/DevToolsBackend.ts` (reference)

## Example Table Metadata
```typescript
{
  id: "table-abc123",
  rowCount: 50,
  columnCount: 6,
  registeredAt: 1708934400000,
  state: {
    sorting: [{ id: "name", desc: false }],
    pagination: { pageIndex: 0, pageSize: 10 }
  }
}
```

## Notes
- Table ID format: `table-${timestamp}-${random}`
- Sort tables by registration time (newest first)
- Limit visible tables in dropdown (scroll if 10+)
- Show registration time on hover (tooltip)
