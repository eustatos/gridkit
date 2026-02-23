// Tests for pinning methods
import { describe, it, expect } from 'vitest';
import { createColumn } from '../factory/create-column';
import type { Table } from '@/types/table/Table';
import type { TableState } from '@/types/table/TableState';
import { createStore } from '../../state/create-store';

interface User {
  name: string;
  age: number;
  email: string;
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

describe('Pinning Methods', () => {
  describe('getPinnedPosition', () => {
    it('returns false for unpinned column', () => {
      const table = createMockTable();
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      expect(column.getPinnedPosition()).toBe(false);
    });

    it('returns left for left-pinned column', () => {
      const table = createMockTable({
        columnPinning: { left: ['name'], right: [] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      expect(column.getPinnedPosition()).toBe('left');
    });

    it('returns right for right-pinned column', () => {
      const table = createMockTable({
        columnPinning: { left: [], right: ['email'] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'email', enablePinning: true },
        table,
      });
      expect(column.getPinnedPosition()).toBe('right');
    });

    it('returns false when column is not pinned', () => {
      const table = createMockTable({
        columnPinning: { left: ['name'], right: ['actions'] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'age', enablePinning: true },
        table,
      });
      expect(column.getPinnedPosition()).toBe(false);
    });
  });

  describe('togglePinned', () => {
    it('pins column to left when position is left', () => {
      const table = createMockTable();
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      column.togglePinned('left');
      expect(table.getState().columnPinning?.left).toContain('name');
      expect(table.getState().columnPinning?.right).not.toContain('name');
    });

    it('pins column to right when position is right', () => {
      const table = createMockTable();
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      column.togglePinned('right');
      expect(table.getState().columnPinning?.right).toContain('name');
      expect(table.getState().columnPinning?.left).not.toContain('name');
    });

    it('removes column from right when pinning to left', () => {
      const table = createMockTable({
        columnPinning: { left: [], right: ['name'] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      column.togglePinned('left');
      expect(table.getState().columnPinning?.left).toContain('name');
      expect(table.getState().columnPinning?.right).not.toContain('name');
    });

    it('removes column from left when pinning to right', () => {
      const table = createMockTable({
        columnPinning: { left: ['name'], right: [] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      column.togglePinned('right');
      expect(table.getState().columnPinning?.right).toContain('name');
      expect(table.getState().columnPinning?.left).not.toContain('name');
    });

    it('unpins column when position is false', () => {
      const table = createMockTable({
        columnPinning: { left: ['name'], right: [] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      column.togglePinned(false);
      expect(table.getState().columnPinning?.left).not.toContain('name');
      expect(table.getState().columnPinning?.right).not.toContain('name');
    });

    it('unpins column when position is undefined and currently pinned', () => {
      const table = createMockTable({
        columnPinning: { left: ['name'], right: [] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      column.togglePinned();
      expect(table.getState().columnPinning?.left).not.toContain('name');
      expect(table.getState().columnPinning?.right).not.toContain('name');
    });

    it('does not add duplicate when toggling already pinned column', () => {
      const table = createMockTable({
        columnPinning: { left: ['name'], right: [] },
      });
      const column = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      column.togglePinned('left');
      const leftPinning = table.getState().columnPinning?.left;
      expect(leftPinning?.filter((id) => id === 'name').length).toBe(1);
    });

    it('maintains order of pinned columns', () => {
      const table = createMockTable();
      const column1 = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email', enablePinning: true },
        table,
      });
      column1.togglePinned('left');
      column2.togglePinned('left');
      expect(table.getState().columnPinning?.left).toEqual(['name', 'email']);
    });

    it('handles multiple columns being pinned to left', () => {
      const table = createMockTable();
      const column1 = createColumn({
        columnDef: { accessorKey: 'name', enablePinning: true },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'email', enablePinning: true },
        table,
      });
      const column3 = createColumn({
        columnDef: { accessorKey: 'role', enablePinning: true },
        table,
      });
      column1.togglePinned('left');
      column2.togglePinned('left');
      column3.togglePinned('left');
      expect(table.getState().columnPinning?.left).toEqual(['name', 'email', 'role']);
    });

    it('handles multiple columns being pinned to right', () => {
      const table = createMockTable();
      const column1 = createColumn({
        columnDef: { accessorKey: 'actions', enablePinning: true },
        table,
      });
      const column2 = createColumn({
        columnDef: { accessorKey: 'status', enablePinning: true },
        table,
      });
      column1.togglePinned('right');
      column2.togglePinned('right');
      expect(table.getState().columnPinning?.right).toEqual(['actions', 'status']);
    });
  });
});
