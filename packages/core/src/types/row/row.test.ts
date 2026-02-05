import type { Row, Cell, RowModel } from './index';
import type { RowId } from '../base';

describe('Row & Cell Types', () => {
  test('Row supports hierarchical data', () => {
    interface OrgData {
      id: string;
      name: string;
      children?: OrgData[];
    }

    type RowType = Row<OrgData>;

    // Should support parent-child relationships
    expectTypeOf<RowType['parentRow']>().toMatchTypeOf<
      Row<OrgData> | undefined
    >();

    expectTypeOf<RowType['subRows']>().toMatchTypeOf<readonly Row<OrgData>[]>();
  });

  test('Cell provides typed value access', () => {
    interface User {
      name: string;
      age: number;
    }

    type CellType = Cell<User, string>;

    // getValue() should return correct type
    expectTypeOf<CellType['getValue']>().returns.toBeString();
  });

  test('RowModel provides efficient lookups', () => {
    type Model = RowModel<any>;

    // Should have map for O(1) lookups
    expectTypeOf<Model['rowsById']>().toMatchTypeOf<
      ReadonlyMap<RowId, Row<any>>
    >();

    // Should have fast lookup method
    expectTypeOf<Model['getRow']>().returns.toMatchTypeOf<
      Row<any> | undefined
    >();
  });
});