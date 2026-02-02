import { describe, it, expect, vi } from 'vitest';
import { createColumn } from '../create-column';
import { GridKitError } from '../../errors';
import type { RowData } from '../../types/base';

describe('createColumn', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
    profile: {
      age: number;
      city: string;
    };
  }

  const mockTable = {
    getState: vi.fn(() => ({
      columnVisibility: {},
      columnSizing: {},
      columnOrder: [],
    })),
    setState: vi.fn(),
    getColumn: vi.fn(() => undefined),
  } as any;

  describe('validation', () => {
    it('should throw when columnDef is missing', () => {
      expect(() => {
        createColumn({
          columnDef: null as any,
          table: mockTable,
        });
      }).toThrow(GridKitError);
    });

    it('should throw when neither accessorKey nor accessorFn is provided', () => {
      expect(() => {
        createColumn({
          columnDef: { header: 'Name' } as any,
          table: mockTable,
        });
      }).toThrow(GridKitError);
    });

    it('should throw when accessorFn is used without id', () => {
      expect(() => {
        createColumn({
          columnDef: {
            accessorFn: (row: User) => row.name,
            header: 'Name',
          },
          table: mockTable,
        });
      }).toThrow(GridKitError);
    });
  });

  describe('creation', () => {
    it('should create column with accessorKey', () => {
      const column = createColumn({
        columnDef: {
          accessorKey: 'name',
          header: 'Name',
          size: 200,
        },
        table: mockTable,
      });

      expect(column).toBeDefined();
      expect(column.id).toBe('name');
      expect(column.table).toBe(mockTable);
      expect(column.columnDef.header).toBe('Name');
      expect(column.columnDef.size).toBe(200);
    });

    it('should create column with custom id', () => {
      const column = createColumn({
        columnDef: {
          id: 'fullName',
          accessorKey: 'name',
          header: 'Full Name',
        },
        table: mockTable,
      });

      expect(column.id).toBe('fullName');
    });

    it('should create column with accessorFn', () => {
      const column = createColumn<User, string>({
        columnDef: {
          id: 'emailDomain',
          accessorFn: (row: User) => row.email.split('@')[1],
          header: 'Email Domain',
        },
        table: mockTable,
      });

      expect(column.id).toBe('emailDomain');
      expect(column.columnDef.accessorFn).toBeDefined();
    });

    it('should apply default values', () => {
      const column = createColumn({
        columnDef: {
          accessorKey: 'name',
        },
        table: mockTable,
      });

      expect(column.columnDef.size).toBe(150);
      expect(column.columnDef.minSize).toBe(50);
      expect(column.columnDef.maxSize).toBe(Number.MAX_SAFE_INTEGER);
      expect(column.columnDef.enableSorting).toBe(true);
      expect(column.columnDef.enableFiltering).toBe(true);
      expect(column.columnDef.enableResizing).toBe(true);
      expect(column.columnDef.enableHiding).toBe(true);
      expect(column.columnDef.meta).toEqual({});
    });

    it('should override defaults with provided values', () => {
      const column = createColumn({
        columnDef: {
          accessorKey: 'name',
          size: 300,
          enableSorting: false,
          meta: { align: 'right' },
        },
        table: mockTable,
      });

      expect(column.columnDef.size).toBe(300);
      expect(column.columnDef.enableSorting).toBe(false);
      expect(column.columnDef.meta).toEqual({ align: 'right' });
    });
  });

  describe('column methods', () => {
    it('should get size from state', () => {
      mockTable.getState.mockReturnValue({
        columnSizing: { name: 250 },
        columnVisibility: {},
        columnOrder: [],
      });

      const column = createColumn({
        columnDef: { accessorKey: 'name', size: 200 },
        table: mockTable,
      });

      expect(column.getSize()).toBe(250); // From state
    });

    it('should get default size when not in state', () => {
      mockTable.getState.mockReturnValue({
        columnSizing: {},
        columnVisibility: {},
        columnOrder: [],
      });

      const column = createColumn({
        columnDef: { accessorKey: 'name', size: 200 },
        table: mockTable,
      });

      expect(column.getSize()).toBe(200); // From columnDef
    });

    it('should check visibility', () => {
      mockTable.getState.mockReturnValue({
        columnSizing: {},
        columnVisibility: { name: false },
        columnOrder: [],
      });

      const column = createColumn({
        columnDef: { accessorKey: 'name' },
        table: mockTable,
      });

      expect(column.getIsVisible()).toBe(false);
    });

    it('should toggle visibility', () => {
      const column = createColumn({
        columnDef: { accessorKey: 'name' },
        table: mockTable,
      });

      column.toggleVisibility();

      expect(mockTable.setState).toHaveBeenCalled();
    });

    it('should get column index', () => {
      mockTable.getState.mockReturnValue({
        columnSizing: {},
        columnVisibility: {},
        columnOrder: ['email', 'name', 'id'],
      });

      const column = createColumn({
        columnDef: { accessorKey: 'name' },
        table: mockTable,
      });

      expect(column.getIndex()).toBe(1);
    });
  });
});
