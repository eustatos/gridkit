# Column Pinning Guide

## Overview

Column pinning allows you to keep specific columns visible while scrolling horizontally through large tables. This is particularly useful for:

- Keeping action columns (Edit, Delete) always accessible
- Preserving important reference columns (ID, Name) while scrolling
- Maintaining context columns (Status, Date) during horizontal navigation

## Basic Concepts

### Pinned vs Unpinned Columns

- **Left-pinned columns**: Always visible on the left side of the table
- **Right-pinned columns**: Always visible on the right side of the table  
- **Unpinned columns**: Scroll horizontally with the rest of the table

### Order Preservation

When multiple columns are pinned to the same side:
- Pinned columns maintain their relative order among themselves
- Pinned columns appear before unpinned columns
- Pinned columns appear after unpinned columns

## API Reference

### Column Definition Options

```typescript
interface ColumnDef<TData, TValue> {
  // Pin column to the left side
  pinned?: 'left' | 'right';
  
  // Or use helper methods
  pinLeft?: boolean;
  pinRight?: boolean;
}
```

### Column Instance Methods

```typescript
interface ColumnInstance {
  // Check if column is pinned
  isPinned(): boolean;
  
  // Check if pinned to left
  isPinnedLeft(): boolean;
  
  // Check if pinned to right
  isPinnedRight(): boolean;
  
  // Get current pin position
  getPinnedPosition(): 'left' | 'right' | null;
  
  // Toggle pin position
  togglePinned(): void;
  
  // Pin to left
  pinLeft(): void;
  
  // Pin to right  
  pinRight(): void;
  
  // Unpin
  unpin(): void;
}
```

### Column System Methods

```typescript
interface ColumnSystem {
  // Get columns pinned to left (in order)
  getLeftPinnedColumns(): ColumnInstance[];
  
  // Get columns pinned to right (in order)
  getRightPinnedColumns(): ColumnInstance[];
  
  // Get unpinned columns (in order)
  getUnpinnedColumns(): ColumnInstance[];
  
  // Get all columns with pinning applied
  getVisibleColumns(): ColumnInstance[];
}
```

## Usage Examples

### Basic Pinning

```typescript
import { createTable } from '@gridkit/core';

const table = createTable({
  columns: [
    {
      id: 'id',
      header: 'ID',
      pinned: 'left', // Always visible on left
    },
    {
      id: 'name',
      header: 'Name',
    },
    {
      id: 'email',
      header: 'Email',
    },
    {
      id: 'actions',
      header: 'Actions',
      pinned: 'right', // Always visible on right
    },
  ],
  data: sampleData,
});
```

### Programmatic Pinning

```typescript
// Get column instance
const nameColumn = table.columnSystem.getColumn('name');

// Pin to left
nameColumn.pinLeft();

// Pin to right
nameColumn.pinRight();

// Toggle pinning
nameColumn.togglePinned();

// Check pin status
if (nameColumn.isPinnedLeft()) {
  console.log('Column is pinned to left');
}

// Get all pinned columns
const leftColumns = table.columnSystem.getLeftPinnedColumns();
const rightColumns = table.columnSystem.getRightPinnedColumns();

// Unpin column
nameColumn.unpin();
```

### Custom Column Order

```typescript
// Initial setup with pinning
const table = createTable({
  columns: [
    { id: 'id', pinned: 'left' },
    { id: 'name' },
    { id: 'email' },
    { id: 'status' },
    { id: 'actions', pinned: 'right' },
  ],
});

// Reorder within pinned groups
const idColumn = table.columnSystem.getColumn('id');
const nameColumn = table.columnSystem.getColumn('name');

// Move name to left of id in pinned columns
nameColumn.moveBefore(idColumn);

// Move status to right of email
const statusColumn = table.columnSystem.getColumn('status');
const emailColumn = table.columnSystem.getColumn('email');
statusColumn.moveAfter(emailColumn);
```

### React Integration

```tsx
import { Table, Column } from '@gridkit/react';

function MyTable() {
  return (
    <Table data={data}>
      {/* Left-pinned column */}
      <Column 
        id="id" 
        header="ID" 
        pinned="left"
      />
      
      {/* Normal scrollable columns */}
      <Column id="name" header="Name" />
      <Column id="email" header="Email" />
      <Column id="role" header="Role" />
      
      {/* Right-pinned column */}
      <Column 
        id="actions" 
        header="Actions" 
        pinned="right"
      />
    </Table>
  );
}
```

### Using React Hooks

```tsx
import { useColumns, useTableState } from '@gridkit/react';

function MyTableComponent() {
  const [state, setState] = useTableState();
  const columns = useColumns();
  
  // Toggle pinning on click
  const handleTogglePin = (columnId: string) => {
    const column = columns.getColumn(columnId);
    column.togglePinned();
  };
  
  return (
    <Table data={data}>
      {columns.getVisibleColumns().map(column => (
        <Column
          key={column.id}
          id={column.id}
          header={column.header}
          pinned={column.getPinnedPosition()}
          onPinChange={() => handleTogglePin(column.id)}
        />
      ))}
    </Table>
  );
}
```

## Visual Behavior

### CSS Classes Applied

The React component applies these CSS classes based on pinning:

- **Left-pinned**: `sticky left-0 z-10` - Sticks to left edge
- **Right-pinned**: `sticky right-0 z-10` - Sticks to right edge
- **Normal**: `relative` - Scrolls with table

### Z-Index Layering

```css
/* Left-pinned columns */
.sticky.left-0.z-10 {
  position: sticky;
  left: 0;
  z-index: 10;
}

/* Right-pinned columns */
.sticky.right-0.z-10 {
  position: sticky;
  right: 0;
  z-index: 10;
}

/* Normal columns */
.relative {
  position: relative;
}
```

## Best Practices

### 1. Choose Right Columns for Pinning

**Good candidates for left pinning:**
- IDs or identifiers
- Primary reference data (Name, Title)
- Status indicators
- Sorting/filtering triggers

**Good candidates for right pinning:**
- Action buttons (Edit, Delete, View)
- Summary metrics
- Quick actions
- Navigation controls

### 2. Limit Pinning to Essential Columns

```typescript
// ❌ Avoid pinning too many columns
const badColumns = [
  { id: 'col1', pinned: 'left' },
  { id: 'col2', pinned: 'left' },
  { id: 'col3', pinned: 'left' },
  { id: 'col4', pinned: 'left' },
  { id: 'col5', pinned: 'left' },
];

// ✅ Pin only essential columns
const goodColumns = [
  { id: 'id', pinned: 'left' },
  { id: 'name' },
  { id: 'email' },
  { id: 'actions', pinned: 'right' },
];
```

### 3. Consider User Preferences

```typescript
// Save pinning preferences
const savePinningState = (table) => {
  const leftPinned = table.columnSystem
    .getLeftPinnedColumns()
    .map(col => col.id);
    
  const rightPinned = table.columnSystem
    .getRightPinnedColumns()
    .map(col => col.id);
  
  localStorage.setItem('pinningState', JSON.stringify({
    left: leftPinned,
    right: rightPinned,
  }));
};

// Restore pinning preferences
const restorePinningState = (table, savedState) => {
  if (!savedState) return;
  
  savedState.left?.forEach(colId => {
    table.columnSystem.getColumn(colId)?.pinLeft();
  });
  
  savedState.right?.forEach(colId => {
    table.columnSystem.getColumn(colId)?.pinRight();
  });
};
```

### 4. Test with Different Screen Sizes

```typescript
// Responsive pinning example
function useResponsivePinning(table) {
  useEffect(() => {
    const handleResize = () => {
      const isSmallScreen = window.innerWidth < 768;
      
      if (isSmallScreen) {
        // Pin only critical columns on mobile
        table.columnSystem.getColumn('name')?.pinLeft();
        table.columnSystem.getColumn('actions')?.pinRight();
      } else {
        // More columns on desktop
        table.columnSystem.getColumn('id')?.pinLeft();
        table.columnSystem.getColumn('email')?.pinLeft();
        table.columnSystem.getColumn('status')?.pinLeft();
        table.columnSystem.getColumn('actions')?.pinRight();
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [table]);
}
```

## Common Patterns

### Pattern 1: Action Column

```typescript
{
  id: 'actions',
  header: 'Actions',
  pinned: 'right',
  cell: ({ row }) => (
    <div className="flex gap-2">
      <button>Edit</button>
      <button>Delete</button>
    </div>
  ),
}
```

### Pattern 2: Status Indicator

```typescript
{
  id: 'status',
  header: 'Status',
  pinned: 'left',
  cell: ({ value }) => (
    <span className={`status-badge ${value.toLowerCase()}`}>
      {value}
    </span>
  ),
}
```

### Pattern 3: Master Detail Setup

```typescript
const columns = [
  // Always show selection checkbox
  {
    id: 'selection',
    header: '',
    pinned: 'left',
    cell: ({ row }) => (
      <input 
        type="checkbox" 
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  },
  
  // Critical reference data
  { id: 'id', pinned: 'left' },
  { id: 'name', pinned: 'left' },
  
  // Scrollable detail data
  { id: 'description' },
  { id: 'details' },
  { id: 'notes' },
  
  // Always show actions
  { id: 'actions', pinned: 'right' },
];
```

## Troubleshooting

### Issue: Pinned Columns Not Sticky

**Cause**: Missing CSS classes or positioning context

**Solution**:
```css
/* Ensure table container has proper overflow */
.table-container {
  overflow-x: auto;
  position: relative;
}

/* Ensure pinned columns have z-index */
.sticky.left-0.z-10,
.sticky.right-0.z-10 {
  background: white;
  z-index: 10;
}
```

### Issue: Pinned Columns Overlapping

**Cause**: Multiple columns with same z-index

**Solution**:
```typescript
// Ensure proper z-index layering
const columns = [
  { id: 'col1', pinned: 'left', meta: { zIndex: 10 } },
  { id: 'col2', pinned: 'left', meta: { zIndex: 11 } },
  { id: 'col3', pinned: 'left', meta: { zIndex: 12 } },
  { id: 'actions', pinned: 'right', meta: { zIndex: 13 } },
];
```

### Issue: Pinning Not Persisting

**Cause**: State management not saving pinning state

**Solution**:
```typescript
const [pinningState, setPinningState] = useState({
  left: [],
  right: [],
});

// Save on change
const handlePinningChange = (columnId, position) => {
  setPinningState(prev => {
    const newLeft = position === 'left' 
      ? [...prev.left, columnId]
      : prev.left.filter(id => id !== columnId);
    
    const newRight = position === 'right'
      ? [...prev.right, columnId]
      : prev.right.filter(id => id !== columnId);
    
    return { left: newLeft, right: newRight };
  });
};

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem('pinning');
  if (saved) {
    const state = JSON.parse(saved);
    setPinningState(state);
    
    // Apply to table
    state.left.forEach(id => columns.getColumn(id)?.pinLeft());
    state.right.forEach(id => columns.getColumn(id)?.pinRight());
  }
}, []);
```

## See Also

- [Column System Architecture](../architecture/columns.md)
- [Column Types](column-types.md)
- [Column Visibility](column-visibility.md)
- [Column Resizing](column-resizing.md)

## Next Steps

- Experiment with different pinning combinations
- Implement user preferences for pinning
- Add keyboard shortcuts for quick pinning
- Consider responsive pinning strategies
