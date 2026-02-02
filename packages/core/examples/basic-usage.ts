import { createTable } from '../src';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
];

const columns = [
  { accessorKey: 'name' as const, header: 'Name', size: 200 },
  { accessorKey: 'email' as const, header: 'Email', size: 300 },
  { accessorKey: 'age' as const, header: 'Age', size: 100 },
];

// Create table
const table = createTable<User>({
  columns,
  data: users,
  getRowId: (row) => row.id.toString(),
  debugMode: true,
});

console.log('Table created successfully!');
console.log('Number of columns:', table.getAllColumns().length);
console.log('Number of rows:', table.getRowModel().rows.length);
console.log('First row name:', table.getRow('1')?.getValue('name'));

// Test state updates
table.setState(prev => ({
  ...prev,
  columnVisibility: { age: false },
}));

console.log('Visible columns after hiding age:', table.getVisibleColumns().length);

// Test selection
table.getRow('1')?.toggleSelected(true);
console.log('Row 1 selected:', table.getRow('1')?.getIsSelected());

console.log('\nAll tests passed!');
