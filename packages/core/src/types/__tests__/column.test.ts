import { describe, it, expectTypeOf } from 'vitest';
import type {
  ColumnDef,
  Column,
  AccessorFn,
  HeaderContext,
  CellContext,
  FooterContext,
  HeaderRenderer,
  CellRenderer,
  FooterRenderer,
  AccessorKey,
  ColumnMeta,
} from '../column';
import type { RowData } from '../base';

// Mock types for testing (since Row and RowModel are not yet implemented)
type Row<TData extends RowData> = any;
type RowModel<TData extends RowData> = any;
type Table<TData extends RowData> = any;

describe('Column Types', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
    profile: {
      avatar: string;
      bio: string;
      metadata: {
        created: Date;
        updated: Date;
      };
    };
  }

  describe('Accessor Types', () => {
    it('should define AccessorFn type', () => {
      const accessor: AccessorFn<User, string> = (row) =>
        `${row.name} - ${row.email}`;
      
      expectTypeOf(accessor).toBeFunction();
      expectTypeOf(accessor).parameter(0).toMatchTypeOf<User>();
      expectTypeOf(accessor).returns.toBeString();
    });

    it('should define AccessorKey type', () => {
      type Key = AccessorKey<User>;
      
      // Should accept simple keys
      const simpleKey: Key = 'name';
      expectTypeOf(simpleKey).toBeString();
      
      // Should accept nested keys with dot notation
      const nestedKey: Key = 'profile.avatar';
      expectTypeOf(nestedKey).toBeString();
      
      // Should accept deeply nested keys
      const deepKey: Key = 'profile.metadata.created';
      expectTypeOf(deepKey).toBeString();
    });
  });

  describe('Context Types', () => {
    it('should define HeaderContext', () => {
      type Context = HeaderContext<User, string>;
      
      expectTypeOf<Context['column']>().toMatchTypeOf<Column<User, string>>();
      expectTypeOf<Context['table']>().toMatchTypeOf<Table<User>>();
    });

    it('should define CellContext', () => {
      type Context = CellContext<User, string>;
      
      expectTypeOf<Context['getValue']>().returns.toBeString();
      expectTypeOf<Context['row']>().toMatchTypeOf<Row<User>>();
      expectTypeOf<Context['column']>().toMatchTypeOf<Column<User, string>>();
      expectTypeOf<Context['table']>().toMatchTypeOf<Table<User>>();
      expectTypeOf<Context['renderValue']>().returns.toBeUnknown();
    });

    it('should define FooterContext', () => {
      type Context = FooterContext<User, string>;
      
      expectTypeOf<Context['column']>().toMatchTypeOf<Column<User, string>>();
      expectTypeOf<Context['table']>().toMatchTypeOf<Table<User>>();
    });
  });

  describe('Renderer Types', () => {
    it('should define HeaderRenderer', () => {
      const renderer: HeaderRenderer<User, string> = ({ column }) => {
        expectTypeOf(column).toMatchTypeOf<Column<User, string>>();
        return column.id;
      };
      
      expectTypeOf(renderer).toBeFunction();
      expectTypeOf(renderer).returns.toBeUnknown();
    });

    it('should define CellRenderer', () => {
      const renderer: CellRenderer<User, string> = ({ getValue }) => {
        const value = getValue();
        expectTypeOf(value).toBeString();
        return value.toUpperCase();
      };
      
      expectTypeOf(renderer).toBeFunction();
      expectTypeOf(renderer).returns.toBeUnknown();
    });

    it('should define FooterRenderer', () => {
      const renderer: FooterRenderer<User, string> = ({ column }) => {
        expectTypeOf(column).toMatchTypeOf<Column<User, string>>();
        return `Footer for ${column.id}`;
      };
      
      expectTypeOf(renderer).toBeFunction();
      expectTypeOf(renderer).returns.toBeUnknown();
    });
  });

  describe('ColumnDef', () => {
    it('should accept simple accessor key', () => {
      const column: ColumnDef<User> = {
        accessorKey: 'name',
        header: 'Name',
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User>>();
      expectTypeOf(column.accessorKey).toBeString();
      expectTypeOf(column.header).toEqualTypeOf<string | HeaderRenderer<User, unknown>>();
    });

    it('should accept accessor function', () => {
      const column: ColumnDef<User, string> = {
        id: 'fullName',
        accessorFn: (row) => `${row.name} - ${row.email}`,
        header: 'Full Name',
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User, string>>();
      expectTypeOf(column.accessorFn).toMatchTypeOf<AccessorFn<User, string> | undefined>();
      expectTypeOf(column.id).toBeString();
    });

    it('should infer value type from accessorKey', () => {
      const column: ColumnDef<User> = {
        accessorKey: 'id',
        cell: ({ getValue }) => {
          const value = getValue();
          // TypeScript should infer this as number
          expectTypeOf(value).toBeNumber();
          return value.toString();
        },
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User>>();
    });

    it('should allow custom renderers', () => {
      const column: ColumnDef<User> = {
        accessorKey: 'email',
        header: ({ column }) => {
          expectTypeOf(column).toMatchTypeOf<Column<User, string>>();
          return column.id;
        },
        cell: ({ getValue, row }) => {
          expectTypeOf(getValue()).toBeString();
          expectTypeOf(row).toMatchTypeOf<Row<User>>();
          return getValue();
        },
        footer: ({ table }) => {
          expectTypeOf(table).toMatchTypeOf<Table<User>>();
          return 'Total emails';
        },
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User>>();
    });

    it('should support all feature flags', () => {
      const column: ColumnDef<User> = {
        accessorKey: 'name',
        enableSorting: false,
        enableFiltering: true,
        enableResizing: false,
        enableHiding: true,
        size: 200,
        minSize: 100,
        maxSize: 300,
      };
      
      expectTypeOf(column.enableSorting).toBeBoolean();
      expectTypeOf(column.enableFiltering).toBeBoolean();
      expectTypeOf(column.enableResizing).toBeBoolean();
      expectTypeOf(column.enableHiding).toBeBoolean();
      expectTypeOf(column.size).toBeNumber();
      expectTypeOf(column.minSize).toBeNumber();
      expectTypeOf(column.maxSize).toBeNumber();
    });

    it('should support custom metadata', () => {
      const column: ColumnDef<User> = {
        accessorKey: 'name',
        meta: {
          type: 'text',
          align: 'left',
          customField: 'custom value',
        },
      };
      
      expectTypeOf(column.meta).toMatchTypeOf<ColumnMeta | undefined>();
      expectTypeOf(column.meta?.customField).toBeString();
    });

    it('should support nested property access with dot notation', () => {
      const column: ColumnDef<User> = {
        accessorKey: 'profile.avatar',
        header: 'Avatar',
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User>>();
      
      // The value type should be inferred as string
      const columnWithCell: ColumnDef<User> = {
        accessorKey: 'profile.avatar',
        cell: ({ getValue }) => {
          const value = getValue();
          expectTypeOf(value).toBeString();
          return value;
        },
      };
      
      expectTypeOf(columnWithCell).toMatchTypeOf<ColumnDef<User>>();
    });

    it('should support deeply nested property access', () => {
      const column: ColumnDef<User> = {
        accessorKey: 'profile.metadata.created',
        header: 'Created Date',
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User>>();
      
      // The value type should be inferred as Date
      const columnWithCell: ColumnDef<User> = {
        accessorKey: 'profile.metadata.created',
        cell: ({ getValue }) => {
          const value = getValue();
          expectTypeOf(value).toMatchTypeOf<Date>();
          return value.toISOString();
        },
      };
      
      expectTypeOf(columnWithCell).toMatchTypeOf<ColumnDef<User>>();
    });
  });

  describe('Column', () => {
    it('should have correct interface', () => {
      type ColumnInstance = Column<User, string>;
      
      expectTypeOf<ColumnInstance['id']>().toBeString();
      expectTypeOf<ColumnInstance['table']>().toMatchTypeOf<Table<User>>();
      expectTypeOf<ColumnInstance['columnDef']>().toMatchTypeOf<ColumnDef<User, string>>();
      expectTypeOf<ColumnInstance['getSize']>().returns.toBeNumber();
      expectTypeOf<ColumnInstance['getIsVisible']>().returns.toBeBoolean();
      expectTypeOf<ColumnInstance['toggleVisibility']>().parameters.toEqualTypeOf<[boolean?]>();
      expectTypeOf<ColumnInstance['resetSize']>().parameters.toEqualTypeOf<[]>();
      expectTypeOf<ColumnInstance['getIndex']>().returns.toBeNumber();
    });
  });

  describe('ColumnMeta', () => {
    it('should be extensible', () => {
      interface ExtendedMeta extends ColumnMeta {
        type: 'text' | 'number' | 'date';
        align: 'left' | 'center' | 'right';
        format?: string;
      }
      
      const meta: ExtendedMeta = {
        type: 'date',
        align: 'center',
        format: 'YYYY-MM-DD',
        customField: 'additional data',
      };
      
      expectTypeOf(meta.type).toEqualTypeOf<'text' | 'number' | 'date'>();
      expectTypeOf(meta.align).toEqualTypeOf<'left' | 'center' | 'right'>();
      expectTypeOf(meta.format).toBeString();
      expectTypeOf(meta.customField).toBeString();
    });
  });

  describe('Edge Cases', () => {
    it('should handle mutually exclusive accessorKey and accessorFn', () => {
      // This should be a type error if both are provided
      // We test this by expecting TypeScript to catch it
      // Note: We can't directly test type errors in runtime tests,
      // but we can verify the types are defined correctly
      
      const columnWithKey: ColumnDef<User> = {
        accessorKey: 'name',
        // @ts-expect-error - accessorFn should not be allowed with accessorKey
        accessorFn: (row) => row.name,
      };
      
      const columnWithFn: ColumnDef<User, string> = {
        id: 'custom',
        accessorFn: (row) => row.name,
        // @ts-expect-error - accessorKey should not be allowed with accessorFn
        accessorKey: 'name',
      };
      
      // Both should still be valid ColumnDefs (ignoring the type errors)
      expectTypeOf(columnWithKey).toMatchTypeOf<ColumnDef<User>>();
      expectTypeOf(columnWithFn).toMatchTypeOf<ColumnDef<User, string>>();
    });

    it('should require id when using accessorFn', () => {
      // This should be a type error if id is missing with accessorFn
      const column: ColumnDef<User, string> = {
        // @ts-expect-error - id should be required when using accessorFn
        accessorFn: (row) => row.name,
        header: 'Name',
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User, string>>();
    });

    it('should handle empty column definitions', () => {
      // Minimal valid column definition
      const column: ColumnDef<User> = {
        accessorKey: 'id',
      };
      
      expectTypeOf(column).toMatchTypeOf<ColumnDef<User>>();
      expectTypeOf(column.header).toBeUndefined();
      expectTypeOf(column.cell).toBeUndefined();
      expectTypeOf(column.footer).toBeUndefined();
    });

    it('should handle complex nested data structures', () => {
      interface ComplexData extends RowData {
        id: number;
        metadata: {
          tags: string[];
          scores: number[];
          nested: {
            deep: {
              value: boolean;
            };
          };
        };
      }
      
      const column1: ColumnDef<ComplexData> = {
        accessorKey: 'metadata.tags',
        header: 'Tags',
      };
      
      const column2: ColumnDef<ComplexData> = {
        accessorKey: 'metadata.nested.deep.value',
        header: 'Deep Value',
      };
      
      expectTypeOf(column1).toMatchTypeOf<ColumnDef<ComplexData>>();
      expectTypeOf(column2).toMatchTypeOf<ColumnDef<ComplexData>>();
      
      // Test value type inference
      const columnWithCell1: ColumnDef<ComplexData> = {
        accessorKey: 'metadata.tags',
        cell: ({ getValue }) => {
          const value = getValue();
          expectTypeOf(value).toBeArray();
          expectTypeOf(value[0]).toBeString();
          return value.join(', ');
        },
      };
      
      const columnWithCell2: ColumnDef<ComplexData> = {
        accessorKey: 'metadata.nested.deep.value',
        cell: ({ getValue }) => {
          const value = getValue();
          expectTypeOf(value).toBeBoolean();
          return value ? 'Yes' : 'No';
        },
      };
      
      expectTypeOf(columnWithCell1).toMatchTypeOf<ColumnDef<ComplexData>>();
      expectTypeOf(columnWithCell2).toMatchTypeOf<ColumnDef<ComplexData>>();
    });
  });
});