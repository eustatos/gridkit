import { describe, it, expect, vi } from 'vitest';
import { createRow, buildRowModel } from '../create-row';
import { GridKitError } from '../../errors';
import type { RowData } from '../../types/base';

describe('createRow', () => {
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
      rowSelection: {},
      expanded: {},
    })),
    setState: vi.fn(),
  } as any;

  const mockColumns = [
    {
      id: 'name',
      table: mockTable,
      columnDef: { accessorKey: 'name' },
      getIsVisible: () => true,
    } as any,
    {
      id: 'email',
      table: mockTable,
      columnDef: { accessorKey: 'email' },
      getIsVisible: () => true,
    } as any,
  ];

  describe('validation', () => {
    it('should throw when data is missing', () => {
      expect(() => {
        createRow({
          rowData: null as any,
          index: 0,
          table: mockTable,
          columns: mockColumns,
          getRowId: (row: User) => row.id.toString(),
        });
      }).toThrow(GridKitError);
    });

    it('should throw when getRowId is not a function', () => {
      expect(() => {
        createRow({
          rowData: {
            id: 1,
            name: 'Test',
            email: 'test@test.com',
            profile: { age: 30, city: 'NYC' },
          },
          index: 0,
          table: mockTable,
          columns: mockColumns,
          getRowId: 'not-a-function' as any,
        });
      }).toThrow(GridKitError);
    });
  });

  describe('creation', () => {
    const testUser: User = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      profile: { age: 30, city: 'New York' },
    };

    it('should create row with basic data', () => {
      const row = createRow({
        rowData: testUser,
        index: 0,
        table: mockTable,
        columns: mockColumns,
        getRowId: (row: User) => row.id.toString(),
      });

      expect(row).toBeDefined();
      expect(row.id).toBe('1');
      expect(row.original).toBe(testUser);
      expect(row.index).toBe(0);
      expect(row.depth).toBe(0);
    });

    it('should create row with custom getRowId', () => {
      const row = createRow({
        rowData: testUser,
        index: 0,
        table: mockTable,
        columns: mockColumns,
        getRowId: (row: User) => `user-${row.id}`,
      });

      expect(row.id).toBe('user-1');
    });

    it('should create row with parent row', () => {
      const parentRow = {
        id: 'parent',
        table: mockTable,
        original: {} as User,
        index: 0,
        depth: 0,
        subRows: [] as any[],
      } as any;

      const row = createRow({
        rowData: testUser,
        index: 0,
        table: mockTable,
        columns: mockColumns,
        getRowId: (row: User) => row.id.toString(),
        parentRow,
        depth: 1,
      });

      expect(row.parentRow).toBe(parentRow);
      expect(row.depth).toBe(1);
    });
  });

  describe('row methods', () => {
    const testUser: User = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      profile: { age: 30, city: 'New York' },
    };

    let row: any;

    beforeEach(() => {
      row = createRow({
        rowData: testUser,
        index: 0,
        table: mockTable,
        columns: mockColumns,
        getRowId: (row: User) => row.id.toString(),
      });
    });

    it('should get all cells', () => {
      const cells = row.getAllCells();
      expect(cells).toHaveLength(2);
      expect(cells[0].column.id).toBe('name');
      expect(cells[1].column.id).toBe('email');
    });

    it('should get cell by column ID', () => {
      const cell = row.getCell('name');
      expect(cell).toBeDefined();
      expect(cell?.column.id).toBe('name');

      const nonExistent = row.getCell('non-existent');
      expect(nonExistent).toBeUndefined();
    });

    it('should get value from cell', () => {
      const value = row.getValue('name');
      expect(value).toBe('John Doe');
    });

    it('should check selection state', () => {
      mockTable.getState.mockReturnValue({
        columnVisibility: {},
        columnSizing: {},
        columnOrder: [],
        rowSelection: { '1': true },
        expanded: {},
      });

      expect(row.getIsSelected()).toBe(true);
    });

    it('should toggle selection', () => {
      row.toggleSelected();
      expect(mockTable.setState).toHaveBeenCalled();
    });

    it('should get parent rows', () => {
      const parentRow = {
        id: 'parent',
        parentRow: undefined,
      } as any;

      const childRow = createRow({
        rowData: testUser,
        index: 0,
        table: mockTable,
        columns: mockColumns,
        getRowId: (row: User) => row.id.toString(),
        parentRow,
      });

      const parents = childRow.getParentRows();
      expect(parents).toEqual([parentRow]);
    });
  });
});

describe('buildRowModel', () => {
  interface User extends RowData {
    id: number;
    name: string;
  }

  const mockTable = {
    getState: vi.fn(() => ({
      columnVisibility: {},
      columnSizing: {},
      columnOrder: [],
      rowSelection: {},
      expanded: {},
    })),
    setState: vi.fn(),
  } as any;

  const mockColumns = [
    {
      id: 'name',
      table: mockTable,
      columnDef: { accessorKey: 'name' },
      getIsVisible: () => true,
    } as any,
  ];

  it('should build row model from data', () => {
    const users: User[] = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];

    const rowModel = buildRowModel({
      data: users,
      columns: mockColumns,
      getRowId: (row: User) => row.id.toString(),
      table: mockTable,
    });

    expect(rowModel.rows).toHaveLength(3);
    expect(rowModel.flatRows).toHaveLength(3);
    expect(rowModel.rowsById.size).toBe(3);
    expect(rowModel.rowsById.get('1')?.original.name).toBe('Alice');
  });

  it('should build row model with parent row', () => {
    const parentRow = {
      id: 'parent',
      table: mockTable,
      original: {} as User,
      index: 0,
      depth: 0,
      subRows: [] as any[],
    } as any;

    const users: User[] = [
      { id: 1, name: 'Child 1' },
      { id: 2, name: 'Child 2' },
    ];

    const rowModel = buildRowModel({
      data: users,
      columns: mockColumns,
      getRowId: (row: User) => row.id.toString(),
      table: mockTable,
      parentRow,
      depth: 1,
    });

    expect(rowModel.rows).toHaveLength(2);
    expect(parentRow.subRows).toHaveLength(2);
    expect(rowModel.rows[0].depth).toBe(1);
  });
});
