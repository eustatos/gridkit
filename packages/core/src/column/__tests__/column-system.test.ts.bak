// Tests for column system implementation
import { describe, it, expect, vi } from 'vitest';
import { createColumn } from '../factory/create-column';
import { ColumnRegistry } from '../factory/column-registry';
import type { Table } from '@/types/table/Table';
import type { TableState } from '@/types/table/TableState';
import { createStore } from '@/state/create-store';

interface User {
  name: string;
  age: number;
  profile: {
    email: string;
  };
}

// Mock table implementation for testing
function createMockTable(): Table<User> {
  const initialState: TableState<User> = {
    data: [],
    columnVisibility: {},
    columnOrder: [],
    columnSizing: {},
    rowSelection: {},
    expanded: {},
    version: 1,
    updatedAt: Date.now(),
  };

  const store = createStore(initialState);

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
    options: {
      columns: [],
    },
    id: 'test-table' as any,
  } as Table<User>;
}

describe('Column System', () => {
  test('creates column with correct type inference', () => {
    const table = createMockTable();

    const column = createColumn({
      columnDef: { accessorKey: 'name' },
      table,
    });

    // Should infer string type
    expect(column.id).toBe('name');
    expect(typeof column._internal.accessor.getValue).toBe('function');
  });

  test('manages column visibility state', () => {
    const table = createMockTable();

    const column = createColumn({
      columnDef: { accessorKey: 'name' },
      table,
    });

    // Initially visible
    expect(column.getIsVisible()).toBe(true);

    // Toggle visibility
    column.toggleVisibility(false);
    expect(column.getIsVisible()).toBe(false);
  });

  test('handles column sizing with constraints', () => {
    const table = createMockTable();

    const column = createColumn({
      columnDef: {
        accessorKey: 'test',
        size: 200,
        minSize: 100,
        maxSize: 300,
      },
      table,
    });

    expect(column.getSize()).toBe(200);

    // Respects min/max constraints
    column.setSize(50); // Should clamp to 100
    expect(column.getSize()).toBe(100);

    column.setSize(400); // Should clamp to 300
    expect(column.getSize()).toBe(300);
  });

  test('supports sorting lifecycle', () => {
    const table = createMockTable();

    const column = createColumn({
      columnDef: { accessorKey: 'name', enableSorting: true },
      table,
    });

    // Initially not sorted
    expect(column.getIsSorted()).toBe(false);

    // Toggle sort
    column.toggleSorting(false); // asc
    expect(column.getIsSorted()).toBe(true);
    expect(column.getSortDirection()).toBe('asc');

    // Toggle direction
    column.toggleSorting(true); // desc
    expect(column.getSortDirection()).toBe('desc');

    // Remove sort
    column.toggleSorting(true); // should remove
    expect(column.getIsSorted()).toBe(false);
  });

  test('handles column registry', () => {
    const table = createMockTable();
    const registry = new ColumnRegistry<User>();

    const column1 = createColumn({
      columnDef: { accessorKey: 'name' },
      table,
    });

    const column2 = createColumn({
      columnDef: { accessorKey: 'age' },
      table,
    });

    // Register columns
    registry.register(column1);
    registry.register(column2);

    // Get columns
    expect(registry.get('name')).toBe(column1);
    expect(registry.get('age')).toBe(column2);
    expect(registry.get('nonexistent')).toBeUndefined();

    // Get all columns
    const allColumns = registry.getAll();
    expect(allColumns).toHaveLength(2);
    expect(allColumns[0]).toBe(column1);
    expect(allColumns[1]).toBe(column2);
  });

  test('handles accessor functions', () => {
    const table = createMockTable();

    const column = createColumn({
      columnDef: {
        id: 'fullName',
        accessorFn: (row) => `${row.name} (${row.age})`,
      },
      table,
    });

    // Should use provided ID
    expect(column.id).toBe('fullName');

    // Should extract value correctly
    const user: User = {
      name: 'John',
      age: 30,
      profile: { email: 'john@example.com' },
    };

    if (column._internal.accessor.type === 'function') {
      const value = column._internal.accessor.getValue(user, 0);
      expect(value).toBe('John (30)');
    }
  });

  test('handles nested accessor keys', () => {
    const table = createMockTable();

    const column = createColumn({
      columnDef: { accessorKey: 'profile.email' },
      table,
    });

    // Should use full path as ID
    expect(column.id).toBe('profile.email');

    // Should extract nested value correctly
    const user: User = {
      name: 'John',
      age: 30,
      profile: { email: 'john@example.com' },
    };

    if (column._internal.accessor.type === 'key') {
      const value = column._internal.accessor.getValue(user);
      expect(value).toBe('john@example.com');
    }
  });

  test('validates column definitions', () => {
    const table = createMockTable();

    // Should throw error for invalid definition
    expect(() => {
      createColumn({
        columnDef: {} as any, // Invalid definition
        table,
      });
    }).toThrow();

    // Should throw error for conflicting accessors
    expect(() => {
      createColumn({
        columnDef: {
          accessorKey: 'name',
          accessorFn: () => 'test',
        } as any,
        table,
      });
    }).toThrow();

    // Should require ID when using accessorFn
    expect(() => {
      createColumn({
        columnDef: {
          accessorFn: () => 'test',
        } as any,
        table,
      });
    }).toThrow();
  });
});