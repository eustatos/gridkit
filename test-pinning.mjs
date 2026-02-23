// Simple test to verify column pinning functionality
console.log('Testing column pinning...');

// Import the built React package
import { useTableColumnPinning } from './packages/react/dist/index.js';

console.log('useTableColumnPinning export found:', typeof useTableColumnPinning);

// Test that it's a function
if (typeof useTableColumnPinning === 'function') {
  console.log('SUCCESS: useTableColumnPinning is exported as a function!');
} else {
  console.log('ERROR: useTableColumnPinning is not a function');
  process.exit(1);
}
