import type { RowData, ColumnDef } from '@gridkit/core';

/**
 * Common test data interface
 */
export interface TestUser extends RowData {
  id: string;
  name: string;
  email: string;
  age: number;
  active: boolean;
}

/**
 * Sample test users
 */
export const testUsers: TestUser[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 30, active: true },
  { id: '2', name: 'Bob', email: 'bob@example.com', age: 25, active: true },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', age: 35, active: false },
  { id: '4', name: 'Diana', email: 'diana@example.com', age: 28, active: true },
  { id: '5', name: 'Eve', email: 'eve@example.com', age: 32, active: false },
];

/**
 * Sample test columns
 */
export const testColumns: ColumnDef<TestUser>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
    enableSorting: true,
    enableFiltering: true,
  },
  {
    id: 'age',
    accessorKey: 'age',
    header: 'Age',
    enableSorting: true,
  },
  {
    id: 'active',
    accessorKey: 'active',
    header: 'Active',
  },
];

/**
 * Generate large dataset for performance testing
 */
export function generateLargeDataset(count: number): TestUser[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
    active: i % 2 === 0,
  }));
}
