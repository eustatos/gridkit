// Tests for column registry with pinning
import { describe, it, expect } from 'vitest';
import { createColumn } from '../create-column';
import { ColumnRegistry } from '../column-registry';
import type { Table } from '@/types/table/Table';
import type { TableState } from '@/types/table/TableState';
import { createStore } from '../../../state/create-store';

interface User {
  name: string;
  age: number;
  email: string;
  role: string;
  status: string;
}

function createMockTable(initialState?: Partial<TableState<User>>): Table<User> {
  const defaultState: TableState<User> = {
    data: [],
    columnVisibility: {},
    columnOrder: [],
    columnSizing: {},
    columnPinning: { left: [], right: [] },
    rowSelection: {},
    expanded: {},
    version: 1,
    updatedAt: Date.now(),
  };

  const store = createStore({ ...defaultState, ...initialState });

  return {
    getState: store.getState,
    setState: store.setState,
    subscribe: store.subscribe,
    getRowModel: () => ({ rows: [], flatRows: [], rowsById: {} }),
    getRow: () => undefined,
    getAllColumns: () => [],
    getVisibleColumns: () => [],
    getColumn: () => undefined,
    reset: () => store.reset(),
    destroy: () => store.destroy(),
    options: { columns: [] },
    id: 'test-table' as any,
  } as Table<User>;
}

describe('ColumnRegistry - Pinning', () => {
  describe('getVisible with pinning', () => {
    it('returns columns in registration order when no pinning', () => {
      const table = createMockTable();
      const registry = new ColumnRegistry<User>();
      registry.setTable(table);

      const column1 = createColumn({
        columnDef: { accessorKey: 'name' },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email' },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role' },
        table,
      });

      registry.register(column1);
      registry.register(column2);
      registry.register(column3);

      const visible = registry.getVisible(
        { name: true, email: true, role: true },
        ['name', 'email', 'role']
      );

      expect(visible.map((c) => c.id)).toEqual(['name', 'email', 'role']);
    });

    it('returns left-pinned columns first', () => {
      const table = createMockTable();
      const registry = new ColumnRegistry<User>();
      registry.setTable(table);

      const column1 = createColumn({
        columnDef: { accessorKey: 'name' },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email' },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role' },
        table,
      });

      registry.register(column1);
      registry.register(column2);
      registry.register(column3);

      const visible = registry.getVisible(
        { name: true, email: true, role: true },
        ['name', 'email', 'role'],
        { left: ['name', 'email'] }
      );

      expect(visible.map((c) => c.id)).toEqual(['name', 'email', 'role']);
    });

    it('returns right-pinned columns last', () => {
      const table = createMockTable();
      const registry = new ColumnRegistry<User>();
      registry.setTable(table);

      const column1 = createColumn({
        columnDef: { accessorKey: 'name' },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email' },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role' },
        table,
      });

      registry.register(column1);
      registry.register(column2);
      registry.register(column3);

      const visible = registry.getVisible(
        { name: true, email: true, role: true },
        ['name', 'email', 'role'],
        { right: ['email', 'role'] }
      );

      expect(visible.map((c) => c.id)).toEqual(['name', 'email', 'role']);
    });

    it('returns pinned columns in their specified order', () => {
      const table = createMockTable();
      const registry = new ColumnRegistry<User>();
      registry.setTable(table);

      const column1 = createColumn({
        columnDef: { accessorKey: 'name' },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email' },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role' },
        table,
      });

      registry.register(column1);
      registry.register(column2);
      registry.register(column3);

      const visible = registry.getVisible(
        { name: true, email: true, role: true },
        ['name', 'email', 'role'],
        { left: ['email', 'name'] }
      );

      expect(visible.map((c) => c.id)).toEqual(['email', 'name', 'role']);
    });

    it('handles both left and right pinning', () => {
      const table = createMockTable();
      const registry = new ColumnRegistry<User>();
      registry.setTable(table);

      const column1 = createColumn({
        columnDef: { accessorKey: 'name' },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email' },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role' },
        table,
      });
      const column4 = createColumn({
        columnDef: { accessorKey: 'status' },
        table,
      });

      registry.register(column1);
      registry.register(column2);
      registry.register(column3);
      registry.register(column4);

      const visible = registry.getVisible(
        { name: true, email: true, role: true, status: true },
        ['name', 'email', 'role', 'status'],
        { left: ['name'], right: ['status'] }
      );

      expect(visible.map((c) => c.id)).toEqual(['name', 'email', 'role', 'status']);
    });

    it('filters hidden columns from pinning lists', () => {
      const table = createMockTable();
      const registry = new ColumnRegistry<User>();
      registry.setTable(table);

      const column1 = createColumn({
        columnDef: { accessorKey: 'name' },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email' },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role' },
        table,
      });

      registry.register(column1);
      registry.register(column2);
      registry.register(column3);

      const visible = registry.getVisible(
        { name: true, email: false, role: true },
        ['name', 'email', 'role'],
        { left: ['name', 'email'] }
      );

      expect(visible.map((c) => c.id)).toEqual(['name', 'role']);
    });

    it('excludes hidden columns from middle section', () => {
      const table = createMockTable();
      const registry = new ColumnRegistry<User>();
      registry.setTable(table);

      const column1 = createColumn({
        columnDef: { accessorKey: 'name' },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email' },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role' },
        table,
      });

      registry.register(column1);
      registry.register(column2);
      registry.register(column3);

      const visible = registry.getVisible(
        { name: true, email: false, role: true },
        ['name', 'email', 'role'],
        { left: ['name'] }
      );

      expect(visible.map((c) => c.id)).toEqual(['name', 'role']);
    });
  });
});
