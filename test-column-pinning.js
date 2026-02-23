// Test to verify column pinning functionality
const { createTable } = require('./packages/core/dist/index.cjs');

console.log('Testing column pinning functionality...\n');

const columns = [
  { id: 'name', header: 'Name', accessorKey: 'name' },
  { id: 'email', header: 'Email', accessorKey: 'email' },
  { id: 'role', header: 'Role', accessorKey: 'role' },
  { id: 'salary', header: 'Salary', accessorKey: 'salary' },
];

const data = [
  { id: 1, name: 'John', email: 'john@example.com', role: 'Dev', salary: 100000 },
  { id: 2, name: 'Jane', email: 'jane@example.com', role: 'Designer', salary: 90000 },
];

// Test 1: Default columnPinning state
console.log('Test 1: Default columnPinning state');
const table = createTable({
  columns,
  data,
});

const state1 = table.getState();
console.log('  columnPinning:', JSON.stringify(state1.columnPinning));
console.log('  Expected: { left: [], right: [] }');
console.log('  Pass:', JSON.stringify(state1.columnPinning) === JSON.stringify({ left: [], right: [] }) ? '✓' : '✗');

// Test 2: Toggle pin using column method
console.log('\nTest 2: Toggle pin using column.togglePinned()');
const nameColumn = table.getColumn('name');
nameColumn.togglePinned('left');

const state2 = table.getState();
console.log('  columnPinning:', JSON.stringify(state2.columnPinning));
console.log('  Expected: { left: ["name"], right: [] }');
console.log('  Pass:', state2.columnPinning?.left?.includes('name') ? '✓' : '✗');

// Test 3: Pin another column to the right
console.log('\nTest 3: Pin another column to the right');
const salaryColumn = table.getColumn('salary');
salaryColumn.togglePinned('right');

const state3 = table.getState();
console.log('  columnPinning:', JSON.stringify(state3.columnPinning));
console.log('  Expected: { left: ["name"], right: ["salary"] }');
console.log('  Pass:', (state3.columnPinning?.left?.includes('name') && state3.columnPinning?.right?.includes('salary')) ? '✓' : '✗');

// Test 4: Using setState directly
console.log('\nTest 4: Using table.setState() directly');
table.setState({
  columnPinning: {
    left: ['name', 'email'],
    right: ['salary'],
  },
});

const state4 = table.getState();
console.log('  columnPinning:', JSON.stringify(state4.columnPinning));
console.log('  Expected: { left: ["name", "email"], right: ["salary"] }');
console.log('  Pass:', (state4.columnPinning?.left?.length === 2 && state4.columnPinning?.right?.includes('salary')) ? '✓' : '✗');

// Test 5: Unpin a column
console.log('\nTest 5: Unpin a column');
const emailColumn = table.getColumn('email');
emailColumn.togglePinned(false);

const state5 = table.getState();
console.log('  columnPinning:', JSON.stringify(state5.columnPinning));
console.log('  Expected: { left: ["name"], right: ["salary"] }');
console.log('  Pass:', (state5.columnPinning?.left?.length === 1 && !state5.columnPinning?.left?.includes('email')) ? '✓' : '✗');

// Test 6: getIndex method works correctly
console.log('\nTest 6: getColumn().getIndex() works correctly');
const roleColumn = table.getColumn('role');
console.log('  roleColumn.getIndex() =', roleColumn.getIndex());
console.log('  Expected: 2 (role is 3rd column, 0-indexed)');
console.log('  Pass:', roleColumn.getIndex() === 2 ? '✓' : '✗');

// Test 7: getIndex updates after column order change
console.log('\nTest 7: getIndex updates after column order change');
table.setState({
  columnOrder: ['role', 'name', 'email', 'salary'],
});

console.log('  roleColumn.getIndex() after reorder =', roleColumn.getIndex());
console.log('  Expected: 0 (role is now first column)');
console.log('  Pass:', roleColumn.getIndex() === 0 ? '✓' : '✗');

// Test 8: getPinnedPosition method
console.log('\nTest 8: getPinnedPosition method');
const nameColumn2 = table.getColumn('name');
const salaryColumn2 = table.getColumn('salary');
const emailColumn2 = table.getColumn('email');

console.log('  nameColumn.getPinnedPosition() =', nameColumn2.getPinnedPosition());
console.log('  Expected: "left"');
console.log('  Pass:', nameColumn2.getPinnedPosition() === 'left' ? '✓' : '✗');

console.log('  salaryColumn.getPinnedPosition() =', salaryColumn2.getPinnedPosition());
console.log('  Expected: "right"');
console.log('  Pass:', salaryColumn2.getPinnedPosition() === 'right' ? '✓' : '✗');

console.log('  emailColumn.getPinnedPosition() =', emailColumn2.getPinnedPosition());
console.log('  Expected: false (not pinned)');
console.log('  Pass:', emailColumn2.getPinnedPosition() === false ? '✓' : '✗');

// Test 9: Check column:pin event emission
console.log('\nTest 9: column:pin event emission');
let eventCount = 0;
table._internal.eventBus.on('column:pin', () => {
  eventCount++;
});

table.setState({
  columnPinning: {
    left: ['name'],
    right: ['salary', 'role'],
  },
});

console.log('  Event count after setState:', eventCount);
console.log('  Expected: >= 1');
console.log('  Pass:', eventCount >= 1 ? '✓' : '✗');

console.log('\n=== All Tests Completed ===');
console.log('If all tests show ✓, the column pinning functionality is working!');
