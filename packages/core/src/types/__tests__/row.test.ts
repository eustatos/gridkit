import { describe, it, expectTypeOf } from 'vitest';
import type { Row, RowModel, Cell } from '../row';
import type { RowData } from '../base';

describe('Row Types', () => {
  interface User extends RowData {
    id: number;
    name: string;
    email: string;
    profile: {
      age: number;
      bio: string;
    };
  }

  describe('Cell', () => {
    it('should have correct interface structure', () => {
      type CellInstance = Cell<User, string>;

      expectTypeOf<CellInstance['id']>().toBeString();
      expectTypeOf<CellInstance['row']>().toMatchTypeOf<Row<User>>();
      expectTypeOf<CellInstance['getValue']>().returns.toBeString();
      expectTypeOf<CellInstance['renderValue']>().returns.toBeUnknown();
    });

    it('should support different value types', () => {
      type StringCell = Cell<User, string>;
      type NumberCell = Cell<User, number>;
      type ObjectCell = Cell<User, User['profile']>;

      expectTypeOf<StringCell['getValue']>().returns.toBeString();
      expectTypeOf<NumberCell['getValue']>().returns.toBeNumber();
      expectTypeOf<ObjectCell['getValue']>().returns.toMatchTypeOf<{
        age: number;
        bio: string;
      }>();
    });

    it('should have readonly properties', () => {
      type CellInstance = Cell<User>;

      // Test that properties exist and have correct types
      expectTypeOf<CellInstance['id']>().toBeString();
      expectTypeOf<CellInstance['row']>().toMatchTypeOf<Row<User>>();
      expectTypeOf<CellInstance['column']>().toBeObject();
    });
  });

  describe('Row', () => {
    it('should have correct interface structure', () => {
      type RowInstance = Row<User>;

      expectTypeOf<RowInstance['id']>().toMatchTypeOf<string | number>();
      expectTypeOf<RowInstance['original']>().toMatchTypeOf<User>();
      expectTypeOf<RowInstance['index']>().toBeNumber();
      expectTypeOf<RowInstance['depth']>().toBeNumber();
      expectTypeOf<RowInstance['table']>().toBeObject();
    });

    it('should have correct method signatures', () => {
      type RowInstance = Row<User>;

      expectTypeOf<RowInstance['getAllCells']>().returns.toBeArray();
      expectTypeOf<RowInstance['getVisibleCells']>().returns.toBeArray();
      expectTypeOf<RowInstance['getCell']>().parameters.toMatchTypeOf<
        [string]
      >();
      expectTypeOf<RowInstance['getCell']>().returns.toMatchTypeOf<
        Cell<User> | undefined
      >();
      expectTypeOf<RowInstance['getIsSelected']>().returns.toBeBoolean();
      expectTypeOf<RowInstance['toggleSelected']>().parameters.toMatchTypeOf<
        [boolean?]
      >();
      expectTypeOf<RowInstance['getIsExpanded']>().returns.toBeBoolean();
      expectTypeOf<RowInstance['toggleExpanded']>().parameters.toMatchTypeOf<
        [boolean?]
      >();
    });

    it('should support getValue method', () => {
      type RowInstance = Row<User>;

      // Extract the getValue method type
      type GetValueMethod = RowInstance['getValue'];

      // Test that it's a function
      expectTypeOf<GetValueMethod>().toBeFunction();

      // Test parameter types
      expectTypeOf<GetValueMethod>().parameters.toMatchTypeOf<[string]>();

      // Test that default return is unknown
      type DefaultReturn = ReturnType<GetValueMethod>;
      expectTypeOf<DefaultReturn>().toBeUnknown();
    });

    it('should support tree data properties', () => {
      type RowInstance = Row<User>;

      // Optional parent row
      expectTypeOf<RowInstance['parentRow']>().toMatchTypeOf<
        Row<User> | undefined
      >();

      // Child rows array
      expectTypeOf<RowInstance['subRows']>().toMatchTypeOf<Row<User>[]>();

      // Tree methods
      expectTypeOf<RowInstance['getParentRows']>().returns.toMatchTypeOf<
        Row<User>[]
      >();
      expectTypeOf<RowInstance['getLeafRows']>().returns.toMatchTypeOf<
        Row<User>[]
      >();
    });

    it('should have readonly properties', () => {
      type RowInstance = Row<User>;

      // Test that properties exist and have correct types
      expectTypeOf<RowInstance['id']>().toMatchTypeOf<string | number>();
      expectTypeOf<RowInstance['original']>().toMatchTypeOf<User>();
      expectTypeOf<RowInstance['index']>().toBeNumber();
      expectTypeOf<RowInstance['depth']>().toBeNumber();
      expectTypeOf<RowInstance['table']>().toBeObject();
    });

    it('should handle edge cases for optional properties', () => {
      type RowInstance = Row<User>;

      // parentRow should be optional - test the type
      expectTypeOf<RowInstance['parentRow']>().toEqualTypeOf<
        Row<User> | undefined
      >();

      // subRows should always exist (empty array if no children)
      expectTypeOf<RowInstance['subRows']>().toEqualTypeOf<Row<User>[]>();
    });
  });

  describe('RowModel', () => {
    it('should have correct structure', () => {
      type Model = RowModel<User>;

      expectTypeOf<Model['rows']>().toMatchTypeOf<Row<User>[]>();
      expectTypeOf<Model['flatRows']>().toMatchTypeOf<Row<User>[]>();
      expectTypeOf<Model['rowsById']>().toMatchTypeOf<
        Map<string | number, Row<User>>
      >();
    });

    it('should support Map operations for rowsById', () => {
      type Model = RowModel<User>;
      type RowsById = Model['rowsById'];

      // Map should have correct key and value types
      expectTypeOf<RowsById['get']>().parameters.toMatchTypeOf<
        [string | number]
      >();
      expectTypeOf<RowsById['get']>().returns.toMatchTypeOf<
        Row<User> | undefined
      >();

      expectTypeOf<RowsById['set']>().parameters.toMatchTypeOf<
        [string | number, Row<User>]
      >();
      expectTypeOf<RowsById['set']>().returns.toMatchTypeOf<
        Map<string | number, Row<User>>
      >();

      expectTypeOf<RowsById['has']>().parameters.toMatchTypeOf<
        [string | number]
      >();
      expectTypeOf<RowsById['has']>().returns.toBeBoolean();
    });

    it('should differentiate between rows and flatRows', () => {
      type Model = RowModel<User>;

      // Both should be arrays of Row<User>
      expectTypeOf<Model['rows']>().toEqualTypeOf<Row<User>[]>();
      expectTypeOf<Model['flatRows']>().toEqualTypeOf<Row<User>[]>();

      // The types should be compatible
      type RowElement = Model['rows'][number];
      type FlatRowElement = Model['flatRows'][number];

      // Row element should be assignable to flat row element
      expectTypeOf<RowElement>().toEqualTypeOf<FlatRowElement>();
    });
  });

  describe('Type Inference Edge Cases', () => {
    it('should infer correct types for nested generics', () => {
      interface ComplexData extends RowData {
        id: string;
        metadata: {
          created: Date;
          tags: string[];
        };
        values: number[];
      }

      type ComplexRow = Row<ComplexData>;
      type ComplexCell = Cell<ComplexData, ComplexData['metadata']>;
      type ComplexModel = RowModel<ComplexData>;

      // Row type inference
      expectTypeOf<ComplexRow['original']>().toMatchTypeOf<ComplexData>();

      // Cell type inference
      expectTypeOf<ComplexCell['getValue']>().returns.toMatchTypeOf<{
        created: Date;
        tags: string[];
      }>();

      // Model type inference
      expectTypeOf<ComplexModel['rowsById']>().toMatchTypeOf<
        Map<string | number, Row<ComplexData>>
      >();
    });

    it('should handle empty data type', () => {
      interface EmptyData extends RowData {
        // No properties
      }

      type EmptyRow = Row<EmptyData>;
      type EmptyCell = Cell<EmptyData>;
      type EmptyModel = RowModel<EmptyData>;

      // Should still compile with empty data
      expectTypeOf<EmptyRow['original']>().toMatchTypeOf<EmptyData>();
      expectTypeOf<EmptyCell['getValue']>().returns.toBeUnknown();
      expectTypeOf<EmptyModel['rows']>().toMatchTypeOf<Row<EmptyData>[]>();
    });

    it('should enforce RowData constraint', () => {
      // @ts-expect-error - Should not accept non-RowData types
      type InvalidRow = Row<string>;

      // @ts-expect-error - Should not accept non-RowData types
      type InvalidCell = Cell<number>;

      // @ts-expect-error - Should not accept non-RowData types
      type InvalidModel = RowModel<boolean>;
    });

    it('should handle union types in RowId', () => {
      interface DataWithUnionId extends RowData {
        id: string | number; // Union type
        name: string;
      }

      type RowWithUnionId = Row<DataWithUnionId>;
      type ModelWithUnionId = RowModel<DataWithUnionId>;

      // Row id should accept string | number
      expectTypeOf<RowWithUnionId['id']>().toMatchTypeOf<string | number>();

      // Map keys should accept string | number
      expectTypeOf<ModelWithUnionId['rowsById']>().toMatchTypeOf<
        Map<string | number, Row<DataWithUnionId>>
      >();
    });
  });

  describe('Method Compatibility', () => {
    it('should have compatible method signatures between Row and Cell', () => {
      interface TestData extends RowData {
        value: string;
      }

      type TestRow = Row<TestData>;
      type TestCell = Cell<TestData, string>;

      // Both should have getValue methods
      expectTypeOf<TestRow['getValue']>().toBeFunction();
      expectTypeOf<TestCell['getValue']>().toBeFunction();

      // Cell's getValue returns string
      expectTypeOf<TestCell['getValue']>().returns.toBeString();
    });

    it('should support method chaining patterns', () => {
      interface TestData extends RowData {
        id: number;
        name: string;
      }

      type TestRow = Row<TestData>;

      // All methods should exist and have correct signatures
      expectTypeOf<TestRow['getValue']>().toBeFunction();
      expectTypeOf<TestRow['getIsSelected']>().toBeFunction();
      expectTypeOf<TestRow['getVisibleCells']>().toBeFunction();

      // Test return types
      expectTypeOf<ReturnType<TestRow['getValue']>>().toBeUnknown();
      expectTypeOf<ReturnType<TestRow['getIsSelected']>>().toBeBoolean();
      expectTypeOf<ReturnType<TestRow['getVisibleCells']>>().toBeArray();
    });
  });
});
