# State Management Tests

This directory contains comprehensive tests for the state management system.

## Test Categories

### 1. Basic Functionality (`createStore.basic.test.ts`)
- Initial state creation
- State getter/setter operations
- Direct value vs updater function
- Return value semantics
- Immutability guarantees

### 2. Deep Clone (`deepClone.test.ts`)
- Primitive type cloning
- Object cloning (simple and nested)
- Array cloning
- Special objects (Date, RegExp, Map, Set)
- Circular reference handling
- Mutation safety

### 3. Equality Check (`equality.test.ts`)
- Same reference detection
- Primitive equality
- Object equality (shallow)
- Array equality
- Mixed type handling
- Edge cases (NaN, null, etc.)

### 4. Validation (`validation.test.ts`)
- Store destruction validation
- Error codes and messages
- Error details
- Error boundaries

### 5. Subscription (`subscribe.test.ts`)
- Basic subscription/unsubscription
- fireImmediately option
- Multiple listeners
- Error handling in listeners
- Memory management
- GC behavior

### 6. Batching (`batch.test.ts`)
- Basic batch operations
- Nested batching
- Update tracking
- Error handling
- Performance optimization

### 7. Destruction (`destroy.test.ts`)
- Store cleanup
- Listener cleanup
- State cleanup
- Debug mode
- Memory leak prevention

### 8. Reset (`reset.test.ts`)
- Basic reset functionality
- Subscriber notifications
- Deep reset
- Multiple resets
- Interaction with other methods

### 9. Performance (`performance.test.ts`)
- Large update sets
- Many listeners
- Batch performance
- Memory efficiency
- Deep clone performance
- Real-world scenarios

### 10. Integration (`integration.test.ts`)
- Counter patterns
- Form state management
- Async updates
- Undo/Redo patterns
- Shopping cart
- Real-time data sync
- Complex nested updates

### 11. Hybrid Tests (`createStore.hybrid.test.ts`)
- Full lifecycle tests
- Complex state scenarios
- Race conditions
- Error handling
- Memory leak prevention
- Performance edge cases

### 12. Utils Integration (`utils.integration.test.ts`)
- deepClone + shallowEqual interaction
- Store utility usage
- Performance with utilities
- Real-world utility scenarios

## Running Tests

```bash
# Run all state tests
pnpm test packages/core/src/state/__tests__

# Run specific test file
pnpm test packages/core/src/state/__tests__/createStore.basic.test.ts

# Run with coverage
pnpm test:coverage packages/core/src/state/__tests__
```

## Test Coverage Targets

- ✅ Basic functionality: 100%
- ✅ Deep clone: 100%
- ✅ Equality check: 100%
- ✅ Validation: 100%
- ✅ Subscription: 100%
- ✅ Batching: 100%
- ✅ Destruction: 100%
- ✅ Reset: 100%
- ⚠️ Performance: 80% (edge cases)
- ⚠️ Integration: 80% (complex scenarios)

## Performance Benchmarks

- State updates: <100ms for 10,000 updates
- Batch operations: 1 notification per batch (vs N notifications without)
- Memory growth: Near-constant with repeated updates
- Deep clone: <50ms for 1,000 operations on moderate objects
