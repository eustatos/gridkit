# CORE-013: Row System Implementation

## Task Card

```
task_id: CORE-013
priority: P0
complexity: Medium
estimated_tokens: ~12,000
ai_ready: yes (with hierarchical focus)
dependencies: [CORE-001, CORE-002, CORE-003, CORE-004, CORE-012]
requires_validation: true (tree data algorithms)
```

## 🎯 **Objective**

Implement runtime row system that creates row instances from data, manages hierarchical relationships, and provides efficient data access patterns. Supports both flat and tree data structures with memory-efficient indexing.

## 📋 **Implementation Scope**

### **1. Row Factory & Model Builder**

```typescript
/**
 * Creates a complete row model from data and columns.
 * Handles hierarchical data, indexing, and efficient lookups.
 */
export function buildRowModel<TData extends RowData>(
  options: BuildRowModelOptions<TData>
): RowModel<TData> {
  const {
    data,
    columns,
    getRowId,
    table,
    parentRow,
    depth = 0,
    path = [],
  } = options;

  // 1. Create row instances
  const rows: Row<TData>[] = [];
  const flatRows: Row<TData>[] = [];
  const rowsById = new Map<RowId, Row<TData>>();

  // 2. Process each data item
  data.forEach((originalData, originalIndex) => {
    const row = createRowInstance({
      originalData,
      originalIndex,
      columns,
      getRowId,
      table,
      parentRow,
      depth,
      path,
    });

    rows.push(row);
    flatRows.push(row);
    rowsById.set(row.id, row);

    // 3. Handle hierarchical data recursively
    if (hasSubRows(originalData)) {
      const subRows = buildRowModel({
        data: getSubRows(originalData),
        columns,
        getRowId,
        table,
        parentRow: row,
        depth: depth + 1,
        path: [...path, row.id],
      });

      // Wire up parent-child relationships
      (row as any).subRows = subRows.rows;
      (row as any).hasChildren = true;

      // Add subRows to flatRows
      flatRows.push(...subRows.flatRows);

      // Add to ID map
      subRows.rowsById.forEach((subRow, id) => {
        rowsById.set(id, subRow);
      });
    }
  });

  // 4. Create model instance
  const model: RowModel<TData> = {
    rows,
    flatRows,
    rowsById,

    // Computed properties
    totalRowCount: rows.length,
    totalFlatRowCount: flatRows.length,

    // Methods
    getRow: (id) => rowsById.get(id),
    getRowByOriginalIndex: (index) => {
      return rows.find((row) => row.originalIndex === index);
    },

    getSelectedRows: () => {
      const state = table.getState();
      return flatRows.filter((row) => state.rowSelection[row.id]);
    },

    getExpandedRows: () => {
      const state = table.getState();
      return flatRows.filter((row) => state.expanded[row.id]);
    },

    filterRows: (predicate) => {
      return flatRows.filter((row, index, array) =>
        predicate(row, index, array)
      );
    },

    findRow: (predicate) => {
      return flatRows.find((row, index, array) => predicate(row, index, array));
    },

    // Metadata
    meta: {
      depth,
      path,
      processingTime: 0, // Will be measured
      hasHierarchicalData: depth > 0 || rows.some((row) => row.hasChildren),
    },
  };

  return model;
}
```

### **2. Row Instance Creation**

```typescript
/**
 * Creates a single row instance with all methods and state.
 */
function createRowInstance<TData extends RowData>(
  options: CreateRowOptions<TData>
): Row<TData> {
  const {
    originalData,
    originalIndex,
    columns,
    getRowId,
    table,
    parentRow,
    depth,
    path,
  } = options;

  // Generate row ID
  const id = getRowId(originalData, originalIndex);

  // Create cell cache for performance
  const cellCache = new Map<ColumnId, Cell<TData>>();

  // Build row methods
  const methods = buildRowMethods({
    id,
    originalData,
    table,
    columns,
    cellCache,
    parentRow,
    depth,
    path,
  });

  // Create row instance
  const row: Row<TData> = {
    // Core properties
    id,
    table,
    original: Object.freeze(originalData),
    originalIndex,
    index: originalIndex, // Will be updated by row model

    // Hierarchical properties
    depth,
    parentRow,
    subRows: [],
    hasChildren: false,

    // Methods
    getAllCells: methods.getAllCells,
    getVisibleCells: methods.getVisibleCells,
    getCell: methods.getCell,
    getValue: methods.getValue,
    getOriginalValue: methods.getOriginalValue,

    getIsSelected: methods.getIsSelected,
    toggleSelected: methods.toggleSelected,

    getIsExpanded: methods.getIsExpanded,
    toggleExpanded: methods.toggleExpanded,

    getParentRows: methods.getParentRows,
    getLeafRows: methods.getLeafRows,
    getPath: methods.getPath,
    isAncestorOf: methods.isAncestorOf,
    isDescendantOf: methods.isDescendantOf,

    // Metadata
    meta: {},
    isVisible: true, // Will be updated by filtering/pagination
  };

  // Initialize cell cache
  initializeCellCache(row, columns, cellCache);

  return row;
}
```

### **3. Row Methods Implementation**

```typescript
/**
 * Builds all runtime methods for a row instance.
 */
function buildRowMethods<TData>(
  options: BuildRowMethodsOptions<TData>
): RowMethods<TData> {
  const { id, table, columns, cellCache, parentRow, depth, path } = options;

  return {
    // Cell access methods
    getAllCells: () => {
      const cells: Cell<TData>[] = [];
      columns.forEach((column) => {
        const cell = cellCache.get(column.id);
        if (cell) cells.push(cell);
      });
      return cells;
    },

    getVisibleCells: () => {
      const state = table.getState();
      const cells: Cell<TData>[] = [];

      columns.forEach((column) => {
        if (state.columnVisibility[column.id] !== false) {
          const cell = cellCache.get(column.id);
          if (cell) cells.push(cell);
        }
      });

      return cells;
    },

    getCell: (columnId) => {
      return cellCache.get(columnId);
    },

    getValue: <TValue = unknown>(columnId: ColumnId): TValue => {
      const cell = cellCache.get(columnId);
      if (!cell) {
        throw new GridError('CELL_NOT_FOUND', `Cell not found: ${columnId}`, {
          rowId: id,
          columnId,
        });
      }
      return cell.getValue() as TValue;
    },

    getOriginalValue: (columnId) => {
      // Direct access without column accessor
      const path = columnId.split('.');
      let value: any = options.originalData;

      for (const key of path) {
        if (value == null) return undefined;
        value = value[key];
      }

      return value;
    },

    // Selection methods
    getIsSelected: () => {
      const state = table.getState();
      return !!state.rowSelection[id];
    },

    toggleSelected: (
      selected?: boolean,
      selectionOptions?: SelectionOptions
    ) => {
      const state = table.getState();
      const current = !!state.rowSelection[id];
      const next = selected ?? !current;

      table.setState((prev) => {
        const nextSelection = { ...prev.rowSelection };

        if (next) {
          nextSelection[id] = true;
        } else {
          delete nextSelection[id];
        }

        // Apply selection options
        if (selectionOptions?.clearOthers && next) {
          // Clear all other selections
          Object.keys(nextSelection).forEach((key) => {
            if (key !== id) delete nextSelection[key];
          });
        }

        return { ...prev, rowSelection: nextSelection };
      });
    },

    // Expansion methods (for hierarchical data)
    getIsExpanded: () => {
      const state = table.getState();
      return !!state.expanded[id];
    },

    toggleExpanded: (expanded?: boolean) => {
      if (!options.hasChildren) return;

      const state = table.getState();
      const current = !!state.expanded[id];
      const next = expanded ?? !current;

      table.setState((prev) => ({
        ...prev,
        expanded: {
          ...prev.expanded,
          [id]: next,
        },
      }));
    },

    // Tree data utilities
    getParentRows: () => {
      const parents: Row<TData>[] = [];
      let current: Row<TData> | undefined = parentRow;

      while (current) {
        parents.unshift(current);
        current = current.parentRow;
      }

      return parents;
    },

    getLeafRows: () => {
      const leaves: Row<TData>[] = [];
      const collectLeaves = (row: Row<TData>) => {
        if (row.subRows.length === 0) {
          leaves.push(row);
        } else {
          row.subRows.forEach(collectLeaves);
        }
      };

      collectLeaves(rowRef);
      return leaves;
    },

    getPath: () => {
      return [...path, id];
    },

    isAncestorOf: (otherRow) => {
      let current = otherRow.parentRow;
      while (current) {
        if (current.id === id) return true;
        current = current.parentRow;
      }
      return false;
    },

    isDescendantOf: (otherRow) => {
      return otherRow.isAncestorOf(rowRef);
    },
  };
}
```

### **4. Cell Factory & Caching**

```typescript
/**
 * Creates a cell instance for a specific row and column.
 */
function createCell<TData, TValue>(
  row: Row<TData>,
  column: Column<TData, TValue>
): Cell<TData, TValue> {
  const cellId = createCellId(row.id, column.id);

  return {
    id: cellId,
    row,
    column,

    getValue: () => {
      const accessor = (column as any)._internal?.accessor;
      if (!accessor) {
        throw new GridError(
          'NO_ACCESSOR',
          `No accessor for column ${column.id}`
        );
      }

      return accessor.getValue(row.original, row.originalIndex);
    },

    renderValue: () => {
      const value = cell.getValue();
      const cellRenderer = column.columnDef.cell;

      if (cellRenderer) {
        const context: CellContext<TData, TValue> = {
          getValue: () => value,
          getRow: () => row,
          column,
          table: row.table,
          rowIndex: row.index,
          cellIndex: column.getIndex(),
          getIsSelected: () => row.getIsSelected(),
          renderValue: () => value, // Default render
          meta: column.columnDef.meta?.cell || {},
        };

        return cellRenderer(context);
      }

      return value;
    },

    getIsFocused: () => {
      const state = row.table.getState();
      return (
        state.focusedCell?.rowId === row.id &&
        state.focusedCell?.columnId === column.id
      );
    },

    getIsSelected: () => {
      return row.getIsSelected();
    },

    getIsEditable: () => {
      const meta = column.columnDef.meta?.cell;
      return meta?.editable === true;
    },

    meta: column.columnDef.meta?.cell || {},
    index: column.getIndex(),

    // Position (for virtualization)
    get position(): CellPosition | undefined {
      // Will be set by virtualization system
      return undefined;
    },
  };
}

/**
 * Initializes cell cache for a row.
 */
function initializeCellCache<TData>(
  row: Row<TData>,
  columns: Column<TData>[],
  cache: Map<ColumnId, Cell<TData>>
): void {
  columns.forEach((column) => {
    const cell = createCell(row, column);
    cache.set(column.id, cell);
  });
}
```

### **5. Hierarchical Data Support**

```typescript
/**
 * Detects if data item has sub-rows.
 */
function hasSubRows<TData>(data: TData): boolean {
  // Check for common hierarchical data patterns
  if (data && typeof data === 'object') {
    return 'children' in data || 'subRows' in data || 'items' in data;
  }
  return false;
}

/**
 * Extracts sub-rows from hierarchical data.
 */
function getSubRows<TData>(data: TData): TData[] {
  if (!data || typeof data !== 'object') return [];

  // Try common property names
  const candidates = ['children', 'subRows', 'items', 'rows'];

  for (const prop of candidates) {
    if (prop in data && Array.isArray((data as any)[prop])) {
      return (data as any)[prop];
    }
  }

  return [];
}

/**
 * Flattens hierarchical data for efficient processing.
 */
function flattenHierarchicalData<TData>(
  data: TData[],
  getRowId: (row: TData, index: number) => RowId,
  maxDepth = 20
): Array<{ data: TData; depth: number; path: RowId[] }> {
  const result: Array<{ data: TData; depth: number; path: RowId[] }> = [];

  const processLevel = (items: TData[], depth: number, parentPath: RowId[]) => {
    if (depth > maxDepth) {
      console.warn(`Max depth ${maxDepth} exceeded in hierarchical data`);
      return;
    }

    items.forEach((item, index) => {
      const itemId = getRowId(item, index);
      const path = [...parentPath, itemId];

      result.push({ data: item, depth, path });

      if (hasSubRows(item)) {
        processLevel(getSubRows(item), depth + 1, path);
      }
    });
  };

  processLevel(data, 0, []);
  return result;
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No DOM rendering or UI virtualization
- ❌ No sorting/filtering algorithms (plugins)
- ❌ No complex data transformations
- ❌ No framework-specific cell renderers
- ❌ No event handling beyond state updates
- ❌ No persistence or serialization

## 📁 **File Structure**

```
packages/core/src/row/
├── factory/
│   ├── build-row-model.ts      # Main model builder
│   ├── create-row.ts           # Single row creation
│   └── row-registry.ts         # Row indexing
├── methods/
│   ├── cell-methods.ts         # Cell access methods
│   ├── selection-methods.ts    # Selection logic
│   ├── expansion-methods.ts    # Tree expansion
│   └── tree-methods.ts         # Hierarchical utilities
├── cell/
│   ├── create-cell.ts          # Cell factory
│   └── cell-cache.ts           # Cell caching system
├── hierarchy/
│   ├── tree-utils.ts           # Tree data utilities
│   └── flatten-data.ts         # Data flattening
└── index.ts                    # Exports
```

## 🧪 **Test Requirements**

```typescript
describe('Row System', () => {
  test('creates row model from flat data', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    const model = buildRowModel({
      data,
      columns: [mockColumn('name')],
      getRowId: (row) => row.id,
      table: mockTable(),
    });

    expect(model.rows).toHaveLength(2);
    expect(model.flatRows).toHaveLength(2);
    expect(model.rowsById.size).toBe(2);
  });

  test('handles hierarchical data', () => {
    const data = [
      {
        id: 1,
        name: 'Parent',
        children: [
          { id: 2, name: 'Child 1' },
          { id: 3, name: 'Child 2' },
        ],
      },
    ];

    const model = buildRowModel({
      data,
      columns: [mockColumn('name')],
      getRowId: (row) => row.id,
      table: mockTable(),
    });

    expect(model.rows).toHaveLength(1); // Only parent at top level
    expect(model.flatRows).toHaveLength(3); // All rows flattened
    expect(model.rowsById.size).toBe(3);

    const parent = model.getRow(1);
    expect(parent?.hasChildren).toBe(true);
    expect(parent?.subRows).toHaveLength(2);
  });

  test('provides efficient cell access', () => {
    const row = createRowInstance({
      /* ... */
    });

    // Should cache cells for performance
    const cell1 = row.getCell('name');
    const cell2 = row.getCell('name');
    expect(cell1).toBe(cell2); // Same reference

    // Should get typed value
    const value = row.getValue<string>('name');
    expectTypeOf(value).toBeString();
  });

  test('manages row selection state', () => {
    const row = createRowInstance({
      /* ... */
    });

    expect(row.getIsSelected()).toBe(false);

    row.toggleSelected(true);
    expect(row.getIsSelected()).toBe(true);

    row.toggleSelected(); // Toggle
    expect(row.getIsSelected()).toBe(false);
  });

  test('supports tree operations', () => {
    // Build hierarchical model
    const model = buildRowModel({
      /* hierarchical data */
    });
    const parent = model.getRow(1);
    const child = model.getRow(2);

    expect(parent?.isAncestorOf(child!)).toBe(true);
    expect(child?.isDescendantOf(parent!)).toBe(true);

    const leafRows = parent?.getLeafRows();
    expect(leafRows).toHaveLength(2); // Both children are leaves
  });
});
```

## 💡 **Performance Optimizations**

```typescript
// 1. Lazy cell creation
class LazyCellCache {
  private cache = new Map<ColumnId, Cell<any>>();
  private pending = new Set<ColumnId>();

  getCell(row: Row, column: Column): Cell {
    const cached = this.cache.get(column.id);
    if (cached) return cached;

    if (!this.pending.has(column.id)) {
      this.pending.add(column.id);
      // Schedule creation in microtask
      queueMicrotask(() => {
        const cell = createCell(row, column);
        this.cache.set(column.id, cell);
        this.pending.delete(column.id);
      });
    }

    // Return placeholder
    return createPlaceholderCell(row, column);
  }
}

// 2. Row pooling for large datasets
class RowPool {
  private pool: Row<any>[] = [];
  private maxSize = 1000;

  acquire(options: CreateRowOptions): Row {
    if (this.pool.length > 0) {
      const row = this.pool.pop()!;
      return reuseRow(row, options);
    }
    return createRowInstance(options);
  }

  release(row: Row): void {
    if (this.pool.length < this.maxSize) {
      resetRow(row);
      this.pool.push(row);
    }
  }
}

// 3. Indexed lookups for O(1) access
class RowIndex {
  private byId = new Map<RowId, Row>();
  private byOriginalIndex = new Map<number, Row>();
  private byParent = new Map<RowId, Row[]>();

  add(row: Row): void {
    this.byId.set(row.id, row);
    this.byOriginalIndex.set(row.originalIndex, row);

    if (row.parentRow) {
      const siblings = this.byParent.get(row.parentRow.id) || [];
      siblings.push(row);
      this.byParent.set(row.parentRow.id, siblings);
    }
  }
}
```

## 📊 **Success Metrics**

- ✅ Build model with 10,000 rows < 100ms
- ✅ Get cell value < 0.1ms (cached)
- ✅ Memory usage scales O(n) with data size
- ✅ Tree operations (ancestor/descendant) < 1ms
- ✅ No memory leaks in row/cell caching
- ✅ 100% test coverage for hierarchical data

## 🎯 **AI Implementation Strategy**

1. **Start with flat data model** - get basics right
2. **Implement hierarchical support** - tree data structures
3. **Add cell system** - with caching
4. **Build row methods** - selection, expansion
5. **Optimize performance** - pooling and indexing
6. **Test thoroughly** - edge cases with large trees

**Critical:** The hierarchical data support must be efficient and memory-safe. Tree traversal algorithms should avoid recursion depth issues.

---

**Status:** Ready for implementation. Complex hierarchical data algorithms required. Focus on memory efficiency with large trees.
