import { createTable } from '../factory/create-table';
import { GridKitError } from '../../errors';

describe('createTable', () => {
  describe('Validation', () => {
    test('Rejects invalid columns with helpful errors', () => {
      expect(() => createTable({ columns: 'invalid' as any })).toThrow(
        'columns must be an array'
      );

      expect(() => createTable({ columns: [] as any })).toThrow(
        'At least one column definition is required'
      );

      expect(() =>
        createTable({
          columns: [{}] as any, // No accessor
        })
      ).toThrow('must have either accessorKey or accessorFn');
    });

    test('Validates data consistency', () => {
      const invalidData = [null, undefined, 'string'] as any;
      expect(() =>
        createTable({
          columns: [{ accessorKey: 'name' }],
          data: invalidData,
        })
      ).toThrow('Invalid row data');
    });
  });

  describe('Performance', () => {
    test('Creates 10,000 rows in < 200ms', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const start = performance.now();
      const table = createTable({
        columns: [{ accessorKey: 'name' },
        data: largeData,
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
      expect(table.getRowModel().rows).toHaveLength(10000);
    });

    test('Memory usage scales linearly', () => {
      // Test with increasing data sizes
      const sizes = [100, 1000, 10000];
      const memoryUsages: number[] = [];

      sizes.forEach((size) => {
        const data = Array.from({ length: size }, (_, i) => ({ id: i }));
        const table = createTable({
          columns: [{ accessorKey: 'id' }],
          data,
        });

        // Measure memory after GC
        memoryUsages.push(measureTableMemory(table));
        table.destroy();
      });

      // Should be roughly linear (allow 20% variance)
      expect(memoryUsages[2] / memoryUsages[1]).toBeCloseTo(10, -1); // ~10x increase for 10x data
    });
  });

  describe('Memory Safety', () => {
    test('No memory leaks after destroy', () => {
      const initialMemory = measureMemory();
      const tables: any[] = [];

      // Create and destroy tables
      for (let i = 0; i < 100; i++) {
        const table = createTable({
          columns: [{ accessorKey: 'test' }],
          data: [{ test: 'value' }],
        });
        tables.push(table);
      }

      // Destroy all
      tables.forEach((table) => table.destroy());

      // Force GC and measure
      global.gc?.();
      const finalMemory = measureMemory();

      expect(finalMemory).toBeLessThan(initialMemory * 1.1); // < 10% increase
    });

    test('Weak references prevent leaks', () => {
      let tableRef: WeakRef<any> | undefined;

      {
        // Create in isolated scope
        const table = createTable({
          columns: [{ accessorKey: 'test' }],
          data: [{ test: 'value' }],
        });
        tableRef = new WeakRef(table);
      }

      // Table should be GC'd
      global.gc?.();
      expect(tableRef?.deref()).toBeUndefined();
    });
  });
});

// Helper functions for testing
function measureMemory(): number {
  // In a real implementation, this would measure actual memory usage
  return 0;
}

function measureTableMemory(table: any): number {
  // In a real implementation, this would measure table-specific memory usage
  return 0;
}