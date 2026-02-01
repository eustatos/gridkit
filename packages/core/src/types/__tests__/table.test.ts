import { describe, it, expectTypeOf } from 'vitest';
import type { Table, TableOptions, TableState, TableMeta } from '../table';
import type { RowData } from '../base';

describe('Table Types', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
  }

  describe('Table', () => {
    it('should have correct method signatures', () => {
      type TableInstance = Table<User>;

      expectTypeOf<TableInstance['getState']>().toBeFunction();
      expectTypeOf<TableInstance['getState']>().returns.toMatchTypeOf<
        TableState<User>
      >();

      expectTypeOf<TableInstance['setState']>().toBeFunction();
      expectTypeOf<TableInstance['setState']>()
        .parameter(0)
        .toMatchTypeOf<
          TableState<User> | ((prev: TableState<User>) => TableState<User>)
        >();

      expectTypeOf<TableInstance['subscribe']>().toBeFunction();
      expectTypeOf<TableInstance['subscribe']>().parameter(0).toBeFunction();
      expectTypeOf<TableInstance['subscribe']>().returns.toBeFunction();

      expectTypeOf<TableInstance['getAllColumns']>().returns.toBeArray();
      expectTypeOf<TableInstance['getVisibleColumns']>().returns.toBeArray();

      expectTypeOf<TableInstance['getColumn']>().toBeFunction();
      expectTypeOf<TableInstance['getColumn']>().parameter(0).toBeString();

      expectTypeOf<TableInstance['getRowModel']>().toBeFunction();
      expectTypeOf<TableInstance['getRow']>().toBeFunction();

      expectTypeOf<TableInstance['reset']>().toBeFunction();
      expectTypeOf<TableInstance['destroy']>().toBeFunction();

      expectTypeOf<TableInstance['options']>().toMatchTypeOf<
        TableOptions<User>
      >();
    });

    it('should enforce readonly options', () => {
      const table: Table<User> = {} as any;

      // @ts-expect-error - options should be readonly
      table.options = {} as any;
    });
  });

  describe('TableOptions', () => {
    it('should accept valid options', () => {
      const options: TableOptions<User> = {
        columns: [{ accessorKey: 'name', header: 'Name' } as any],
        data: [],
      };

      expectTypeOf(options).toMatchTypeOf<TableOptions<User>>();
    });

    it('should make columns required', () => {
      // @ts-expect-error - columns is required
      const invalid: TableOptions<User> = {
        data: [],
      };
    });

    it('should allow optional fields', () => {
      const options: TableOptions<User> = {
        columns: [],
        // All other fields are optional
      };

      expectTypeOf(options).toMatchTypeOf<TableOptions<User>>();
    });

    it('should accept all optional properties', () => {
      const options: TableOptions<User> = {
        columns: [],
        data: [{ id: 1, name: 'John', email: 'john@example.com' }],
        getRowId: (row, index) => row.id.toString(),
        initialState: {
          columnVisibility: { name: true },
          columnOrder: ['name', 'email'],
          columnSizing: { name: 200 },
          rowSelection: { '1': true },
          expanded: { '1': false },
        },
        debugMode: true,
        onStateChange: (state) => console.log(state),
        defaultColumn: { header: 'Default' },
        meta: { tableName: 'users' },
      };

      expectTypeOf(options).toMatchTypeOf<TableOptions<User>>();
    });
  });

  describe('TableState', () => {
    it('should have correct structure', () => {
      const state: TableState<User> = {
        data: [],
        columnVisibility: {},
        columnOrder: [],
        columnSizing: {},
        rowSelection: {},
        expanded: {},
      };

      expectTypeOf(state.data).toMatchTypeOf<User[]>();
      expectTypeOf(state.columnVisibility).toMatchTypeOf<
        Record<string, boolean>
      >();
      expectTypeOf(state.columnOrder).toMatchTypeOf<string[]>();
      expectTypeOf(state.columnSizing).toMatchTypeOf<Record<string, number>>();
      expectTypeOf(state.rowSelection).toMatchTypeOf<
        Record<string | number, boolean>
      >();
      expectTypeOf(state.expanded).toMatchTypeOf<
        Record<string | number, boolean>
      >();
    });

    it('should require all properties', () => {
      // @ts-expect-error - missing properties
      const invalid: TableState<User> = {
        data: [],
        columnVisibility: {},
        // missing columnOrder, columnSizing, rowSelection, expanded
      };
    });
  });

  describe('TableMeta', () => {
    it('should allow any key-value pairs', () => {
      const meta: TableMeta = {
        tableName: 'users',
        permissions: ['read', 'write'],
        customField: { nested: true },
        numberField: 42,
        booleanField: true,
      };

      expectTypeOf(meta).toMatchTypeOf<Record<string, unknown>>();
    });

    it('should be extensible', () => {
      interface CustomMeta extends TableMeta {
        tableName: string;
        permissions: string[];
      }

      const meta: CustomMeta = {
        tableName: 'users',
        permissions: ['read'],
      };

      expectTypeOf(meta).toMatchTypeOf<TableMeta>();
    });

    it('should accept empty object', () => {
      const meta: TableMeta = {};
      expectTypeOf(meta).toMatchTypeOf<TableMeta>();
    });
  });

  describe('Generic constraints', () => {
    it('should require RowData constraint', () => {
      interface ValidData extends RowData {
        id: number;
      }

      // This should work
      const table: Table<ValidData> = {} as any;
      expectTypeOf(table).toMatchTypeOf<Table<ValidData>>();

      // Non-RowData types should fail
      interface InvalidData {
        id: number;
      }

      // @ts-expect-error - must extend RowData
      const invalid: Table<InvalidData> = {} as any;
    });

    it('should propagate generic through all interfaces', () => {
      interface Product extends RowData {
        sku: string;
        price: number;
      }

      const options: TableOptions<Product> = {
        columns: [],
        data: [{ sku: 'ABC123', price: 99.99 }],
      };

      const state: TableState<Product> = {
        data: options.data || [],
        columnVisibility: {},
        columnOrder: [],
        columnSizing: {},
        rowSelection: {},
        expanded: {},
      };

      expectTypeOf(state.data[0]).toMatchTypeOf<Product>();
      expectTypeOf(state.data[0].sku).toBeString();
      expectTypeOf(state.data[0].price).toBeNumber();
    });
  });
});
