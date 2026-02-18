/**
 * Tests for row factory and basic model building.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createRow } from '../factory/create-row';
import { buildRowModel } from '../factory/build-row-model';
import { RowRegistry } from '../factory/row-registry';
import type { Table } from '@/types/table/Table';
import type { TableState } from '@/types/table/TableState';
import { createStore } from '../../state/create-store';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

function createMockColumn<TData>(id: string, accessorKey?: string) {
  return {
    id,
    table: null as any,
    columnDef: { id, accessorKey },
    getSize: () => 100,
    getIsVisible: () => true,
    getIndex: () => 0,
    getPinnedPosition: () => false,
    toggleVisibility: () => {},
    setSize: () => {},
    resetSize: () => {},
    togglePinned: () => {},
    getIsSorted: () => false,
    getSortDirection: () => false,
    toggleSorting: () => {},
    getIsFiltered: () => false,
    getFilterValue: () => undefined,
    setFilterValue: () => {},
    meta: {},
    utils: {},
    _internal: {
      accessor: {
        type: accessorKey ? 'key' : 'function',
        getValue: (row: TData) => {
          if (accessorKey) {
            const path = accessorKey.split('.');
            let value: any = row;
            for (const key of path) {
              if (value == null) return undefined;
              value = value[key];
            }
            return value;
          }
          return undefined;
        }
      },
      featureFlags: {
        hasSorting: true,
        hasFiltering: true,
        hasPinning: false,
        hasResizing: true,
        hasHiding: true,
        hasReordering: true,
      },
      stateWatchers: new Set(),
    },
  };
}

function createMockTable<TData>(): Table<TData> {
  const initialState: TableState<TData> = {
    data: [],
    columnVisibility: {},
    columnOrder: [],
    columnSizing: {},
    rowSelection: {},
    expanded: {},
    version: 1,
    updatedAt: Date.now(),
  };

  const store = createStore(initialState);

  return {
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    getRowModel: () => ({ 
      rows: [], 
      flatRows: [], 
      rowsById: new Map(), 
      rowsByOriginalIndex: new Map(),
      totalRowCount: 0,
      totalFlatRowCount: 0,
      meta: {
        processingTime: 0,
        memoryUsage: 0,
        hasHierarchicalData: false,
        rowCount: { total: 0, flat: 0 }
      },
      getRow: () => undefined,
      getRowByOriginalIndex: () => undefined,
      getSelectedRows: () => [],
      getExpandedRows: () => [],
      filterRows: () => [],
      findRow: () => undefined
    }),
    getRow: () => undefined,
    getAllColumns: () => [],
    getVisibleColumns: () => [],
    getColumn: () => undefined,
    reset: () => store.reset(),
    destroy: () => store.destroy(),
    options: { columns: [] },
    id: 'test-table' as any,
  } as Table<TData>;
}

describe('Row Factory & Basic Model', () => {
  describe('createRow', () => {
    let table: Table<User>;
    let columns: any[];

    beforeEach(() => {
      table = createMockTable();
      columns = [
        createMockColumn<User>('id', 'id'),
        createMockColumn<User>('name', 'name'),
        createMockColumn<User>('email', 'email'),
      ];
    });

    test('creates row instance with correct properties', () => {
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      expect(row.id).toBe('1');
      expect(row.originalIndex).toBe(0);
      expect(row.depth).toBe(0);
      expect(row.parentRow).toBeUndefined();
      expect(row.subRows).toEqual([]);
      expect(row.hasChildren).toBe(false);
      expect(row.isExpanded).toBe(false);
    });

    test('creates row with immutable original data', () => {
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });
      expect(row.original.name).toBe('Alice');
    });

    test('provides cell cache for O(1) lookups', () => {
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      const cell1 = row.getCell('name');
      expect(cell1).toBeDefined();
      expect(cell1?.getValue()).toBe('Alice');
      const cell2 = row.getCell('name');
      expect(cell1).toBe(cell2);
    });

    test('provides typed value access', () => {
      const user = { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 };
      const columnsWithAge = [...columns, createMockColumn<User>('age', 'age')];
      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns: columnsWithAge,
        getRowId: (u) => u.id.toString(),
        table,
      });

      const age = row.getValue<number>('age');
      expect(age).toBe(30);
      expect(typeof age).toBe('number');
    });

    test('handles nested accessor paths', () => {
      interface UserWithProfile {
        id: number;
        profile: { name: string; email: string };
      }

      const columns = [
        createMockColumn<UserWithProfile>('name', 'profile.name'),
        createMockColumn<UserWithProfile>('email', 'profile.email'),
      ];

      const user: UserWithProfile = {
        id: 1,
        profile: { name: 'Alice', email: 'alice@example.com' },
      };

      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      const name = row.getValue<string>('name');
      expect(name).toBe('Alice');
    });

    test('throws error for missing cell', () => {
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      expect(() => {
        row.getValue('nonexistent');
      }).toThrow('CELL_NOT_FOUND');
    });

    test('supports hierarchical data with parent row', () => {
      const parentUser = { id: 1, name: 'Parent', email: 'parent@example.com' };
      const childUser = { id: 2, name: 'Child', email: 'child@example.com' };

      const parentRow = createRow({
        originalData: parentUser,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      const childRow = createRow({
        originalData: childUser,
        originalIndex: 1,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
        parentRow,
        depth: 1,
        path: ['1'],
      });

      expect(childRow.parentRow).toBe(parentRow);
      expect(childRow.depth).toBe(1);
      expect(childRow.getPath()).toEqual(['1', '2']);
    });
  });

  describe('buildRowModel', () => {
    let table: Table<User>;
    let columns: any[];

    beforeEach(() => {
      table = createMockTable();
      columns = [
        createMockColumn<User>('id', 'id'),
        createMockColumn<User>('name', 'name'),
      ];
    });

    test('creates row model from flat data', () => {
      const data = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table,
      });

      expect(model.rows).toHaveLength(2);
      expect(model.flatRows).toHaveLength(2);
      expect(model.rowsById.size).toBe(2);
      expect(model.rowsByOriginalIndex.size).toBe(2);
      expect(model.totalRowCount).toBe(2);
      expect(model.totalFlatRowCount).toBe(2);
    });

    test('provides O(1) row lookup by ID', () => {
      const data = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table,
      });

      const row = model.getRow('1');
      expect(row).toBeDefined();
      expect(row?.original.name).toBe('Alice');

      const nonexistent = model.getRow('999');
      expect(nonexistent).toBeUndefined();
    });

    test('provides O(1) row lookup by original index', () => {
      const data = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table,
      });

      const row = model.getRowByOriginalIndex(1);
      expect(row).toBeDefined();
      expect(row?.original.name).toBe('Bob');
    });

    test('provides filtering methods', () => {
      const data = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Alice', email: 'alice2@example.com' },
      ];

      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table,
      });

      const filtered = model.filterRows((row) => row.original.name === 'Alice');
      expect(filtered).toHaveLength(2);

      const found = model.findRow((row) => row.original.name === 'Bob');
      expect(found).toBeDefined();
      expect(found?.original.id).toBe(2);
    });

    test('handles empty data', () => {
      const model = buildRowModel({
        data: [],
        columns,
        getRowId: (row) => row.id.toString(),
        table,
      });

      expect(model.rows).toHaveLength(0);
      expect(model.flatRows).toHaveLength(0);
      expect(model.rowsById.size).toBe(0);
    });

    test('calculates processing time', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table,
      });

      expect(model.meta.processingTime).toBeGreaterThanOrEqual(0);
      expect(model.meta.processingTime).toBeLessThan(100);
      expect(model.meta.hasHierarchicalData).toBe(false);
    });

    test('provides getSelectedRows with selection state', () => {
      const data = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const initialState: TableState<User> = {
        data,
        columnVisibility: {},
        columnOrder: [],
        columnSizing: {},
        rowSelection: { '1': true, '2': false },
        expanded: {},
        version: 1,
        updatedAt: Date.now(),
      };

      const store = createStore(initialState);
      const tableWithSelection = { ...table, getState: store.getState } as Table<User>;

      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table: tableWithSelection,
      });

      const selected = model.getSelectedRows();
      expect(selected).toHaveLength(1);
      expect(selected[0].original.name).toBe('Alice');
    });

    test('provides getExpandedRows with expansion state', () => {
      const data = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const initialState: TableState<User> = {
        data,
        columnVisibility: {},
        columnOrder: [],
        columnSizing: {},
        rowSelection: {},
        expanded: { '1': true, '2': false },
        version: 1,
        updatedAt: Date.now(),
      };

      const store = createStore(initialState);
      const tableWithExpansion = { ...table, getState: store.getState } as Table<User>;

      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table: tableWithExpansion,
      });

      const expanded = model.getExpandedRows();
      expect(expanded).toHaveLength(1);
      expect(expanded[0].original.name).toBe('Alice');
    });
  });

  describe('RowRegistry', () => {
    let table: Table<User>;
    let columns: any[];

    beforeEach(() => {
      table = createMockTable();
      columns = [
        createMockColumn<User>('id', 'id'),
        createMockColumn<User>('name', 'name'),
      ];
    });

    test('provides O(1) lookups by row ID', () => {
      const registry = new RowRegistry<User>();
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };

      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      registry.add(row);

      expect(registry.getById('1')).toBe(row);
      expect(registry.size()).toBe(1);
    });

    test('provides O(1) lookups by original index', () => {
      const registry = new RowRegistry<User>();
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };

      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      registry.add(row);

      expect(registry.getByOriginalIndex(0)).toBe(row);
    });

    test('handles parent-child relationships', () => {
      const registry = new RowRegistry<User>();
      
      const parentUser = { id: 1, name: 'Parent', email: 'parent@example.com' };
      const childUser = { id: 2, name: 'Child', email: 'child@example.com' };

      const parentRow = createRow({
        originalData: parentUser,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      const childRow = createRow({
        originalData: childUser,
        originalIndex: 1,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
        parentRow,
        depth: 1,
      });

      registry.add(parentRow);
      registry.add(childRow);

      const children = registry.getChildren('1');
      expect(children).toHaveLength(1);
      expect(children[0]).toBe(childRow);
    });

    test('removes rows correctly', () => {
      const registry = new RowRegistry<User>();
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };

      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      registry.add(row);
      expect(registry.size()).toBe(1);

      const removed = registry.remove('1');
      expect(removed).toBe(true);
      expect(registry.size()).toBe(0);

      const nonexistent = registry.remove('999');
      expect(nonexistent).toBe(false);
    });

    test('provides getAll method', () => {
      const registry = new RowRegistry<User>();
      const users = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const rows = users.map((user, i) =>
        createRow({
          originalData: user,
          originalIndex: i,
          columns,
          getRowId: (u) => u.id.toString(),
          table,
        })
      );

      rows.forEach((row) => registry.add(row));

      const allRows = registry.getAll();
      expect(allRows).toHaveLength(2);
      expect(allRows).toContain(rows[0]);
      expect(allRows).toContain(rows[1]);
    });

    test('clears all entries', () => {
      const registry = new RowRegistry<User>();
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };

      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      registry.add(row);
      expect(registry.size()).toBe(1);

      registry.clear();
      expect(registry.size()).toBe(0);
    });

    test('provides statistics', () => {
      const registry = new RowRegistry<User>();

      const users = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      const rows = users.map((user, i) =>
        createRow({
          originalData: user,
          originalIndex: i,
          columns,
          getRowId: (u) => u.id.toString(),
          table,
        })
      );

      rows.forEach((row) => registry.add(row));

      const stats = registry.getStats();
      expect(stats.totalRows).toBe(2);
      expect(stats.rowsWithParents).toBe(0);
    });
  });

  describe('Performance', () => {
    let table: Table<User>;
    let columns: any[];

    beforeEach(() => {
      table = createMockTable();
      columns = [
        createMockColumn<User>('id', 'id'),
        createMockColumn<User>('name', 'name'),
        createMockColumn<User>('email', 'email'),
      ];
    });

    test('handles large datasets efficiently', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const start = performance.now();
      const model = buildRowModel({
        data,
        columns,
        getRowId: (row) => row.id.toString(),
        table,
      });
      const end = performance.now();

      expect(model.rows).toHaveLength(1000);
      expect(end - start).toBeLessThan(100);
    });

    test('cell caching is memory efficient', () => {
      const user = { id: 1, name: 'Alice', email: 'alice@example.com' };

      const row = createRow({
        originalData: user,
        originalIndex: 0,
        columns,
        getRowId: (u) => u.id.toString(),
        table,
      });

      const cell1 = row.getCell('name');
      const cell2 = row.getCell('name');
      const cell3 = row.getCell('name');

      expect(cell1).toBe(cell2);
      expect(cell2).toBe(cell3);
    });

    test('registry scales with dataset', () => {
      const registry = new RowRegistry<User>();
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const rows = data.map((user, i) =>
        createRow({
          originalData: user,
          originalIndex: i,
          columns,
          getRowId: (u) => u.id.toString(),
          table,
        })
      );

      const start = performance.now();
      rows.forEach((row) => registry.add(row));
      const end = performance.now();

      expect(registry.size()).toBe(10000);
      expect(end - start).toBeLessThan(200);
    });
  });
});
