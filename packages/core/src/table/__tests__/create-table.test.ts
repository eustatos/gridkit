import { describe, it, expect, vi } from 'vitest';
import { createTable } from '../create-table';
import { GridKitError } from '../../errors';
import type { RowData } from '../../types/base';

describe('createTable', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
  }

  const users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];

  const columns = [
    { accessorKey: 'name' as const, header: 'Name' },
    { accessorKey: 'email' as const, header: 'Email' },
  ];

  describe('validation', () => {
    it('should throw when options is null/undefined', () => {
      expect(() => createTable(null as any)).toThrow(GridKitError);
      expect(() => createTable(undefined as any)).toThrow(GridKitError);
    });

    it('should throw when columns is not an array', () => {
      expect(() => createTable({ columns: 'invalid' as any })).toThrow(
        GridKitError
      );
    });

    it('should throw when columns array is empty', () => {
      expect(() => createTable<User>({ columns: [] })).toThrow(GridKitError);
    });
  });

  describe('initialization', () => {
    it('should create table with valid options', () => {
      const table = createTable<User>({
        columns,
        data: users,
      });

      expect(table).toBeDefined();
      expect(table.getState).toBeDefined();
      expect(table.getAllColumns).toBeDefined();
      expect(table.getRowModel).toBeDefined();
    });

    it('should use default empty data when not provided', () => {
      const table = createTable<User>({ columns });

      expect(table.getState().data).toEqual([]);
    });

    it('should apply initial state', () => {
      const table = createTable<User>({
        columns,
        data: users,
        initialState: {
          columnVisibility: { email: false },
        },
      });

      expect(table.getState().columnVisibility).toEqual({ email: false });
    });
  });

  describe('state management', () => {
    it('should get current state', () => {
      const table = createTable<User>({ columns, data: users });
      const state = table.getState();

      expect(state.data).toEqual(users);
      expect(state.columnVisibility).toBeDefined();
    });

    it('should update state immutably', () => {
      const table = createTable<User>({ columns, data: users });
      const oldState = table.getState();

      table.setState((prev) => ({
        ...prev,
        rowSelection: { '0': true },
      }));

      const newState = table.getState();
      expect(newState).not.toBe(oldState);
      expect(newState.rowSelection).toEqual({ '0': true });
    });

    it('should call onStateChange callback', () => {
      const onStateChange = vi.fn();
      const table = createTable<User>({
        columns,
        data: users,
        onStateChange,
      });

      table.setState((prev) => ({ ...prev, rowSelection: {} }));

      expect(onStateChange).toHaveBeenCalled();
    });

    it('should support subscriptions', () => {
      const table = createTable<User>({ columns, data: users });
      const listener = vi.fn();

      const unsubscribe = table.subscribe(listener);

      table.setState((prev) => ({ ...prev, rowSelection: {} }));

      expect(listener).toHaveBeenCalled();

      unsubscribe();
      table.setState((prev) => ({ ...prev, rowSelection: { '0': true } }));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('columns', () => {
    it('should create all columns', () => {
      const table = createTable<User>({ columns, data: users });
      const allColumns = table.getAllColumns();

      expect(allColumns).toHaveLength(2);
    });

    it('should get visible columns', () => {
      const table = createTable<User>({
        columns,
        data: users,
        initialState: {
          columnVisibility: { email: false },
        },
      });

      const visibleColumns = table.getVisibleColumns();
      expect(visibleColumns).toHaveLength(1);
      expect(visibleColumns[0].id).toBe('name');
    });

    it('should get column by ID', () => {
      const table = createTable<User>({ columns, data: users });

      const column = table.getColumn('name');
      expect(column).toBeDefined();
      expect(column?.id).toBe('name');

      const nonExistent = table.getColumn('non-existent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('row model', () => {
    it('should create row model', () => {
      const table = createTable<User>({ columns, data: users });
      const rowModel = table.getRowModel();

      expect(rowModel.rows).toHaveLength(2);
      expect(rowModel.flatRows).toHaveLength(2);
      expect(rowModel.rowsById.size).toBe(2);
    });

    it('should get row by ID', () => {
      const table = createTable<User>({
        columns,
        data: users,
        getRowId: (row) => `user-${row.id}`,
      });

      const row = table.getRow('user-1');
      expect(row).toBeDefined();
      expect(row?.original).toEqual(users[0]);

      const nonExistent = table.getRow('non-existent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('lifecycle', () => {
    it('should reset to initial state', () => {
      const table = createTable<User>({
        columns,
        data: users,
        initialState: {
          rowSelection: { '0': true },
        },
      });

      table.setState((prev) => ({ ...prev, rowSelection: {} }));
      expect(table.getState().rowSelection).toEqual({});

      table.reset();
      expect(table.getState().rowSelection).toEqual({ '0': true });
    });

    it('should cleanup on destroy', () => {
      const table = createTable<User>({ columns, data: users });
      const listener = vi.fn();
      table.subscribe(listener);

      table.destroy();

      // Should not throw, but state is cleared
      expect(table.getAllColumns()).toHaveLength(0);

      // Further state updates should be no-op
      expect(() => {
        table.setState((prev) => ({ ...prev, rowSelection: {} }));
      }).not.toThrow();
    });
  });
});
