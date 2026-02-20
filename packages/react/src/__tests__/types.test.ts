import { describe, it, expectTypeOf } from 'vitest';
import type { UseTableOptions, RowData } from '../types';
import type { Table } from '@gridkit/core';

interface TestData extends RowData {
  id: string;
  name: string;
  age: number;
}

describe('Type Tests', () => {
  it('should have correct UseTableOptions type', () => {
    const options: UseTableOptions<TestData> = {
      data: [],
      columns: [],
      deps: [],
      debug: true,
    };
    
    expectTypeOf(options).toMatchTypeOf<UseTableOptions<TestData>>();
  });
  
  it('should have correct types structure', () => {
    expectTypeOf<UseTableOptions<TestData>>().toHaveProperty('deps');
    expectTypeOf<UseTableOptions<TestData>>().toHaveProperty('debug');
  });
});
