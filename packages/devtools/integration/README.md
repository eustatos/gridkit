# Integration Tests for @gridkit/devtools

This directory contains integration tests for the DevTools extension.

## Test Categories

### 1. Backend ↔ Bridge Integration (`backend-bridge-content.test.ts`)
Tests verify the communication between the DevTools backend and bridge:

- Table registration flow
- State change propagation
- Command routing
- Multiple table registration
- Cleanup on unregister
- Error handling

### 2. Extension Communication (`extension-communication.test.ts`)
Tests verify the communication across extension contexts:

- Full message lifecycle
- Command routing
- Response handling
- Message validation
- Disconnect/reconnect handling

### 3. Multi-Table Management (`multi-table.test.ts`)
Tests verify the management of multiple tables:

- Multiple table registration with unique IDs
- Table lifecycle management
- Table lookup by ID
- Cleanup on unregister
- Edge case handling

### 4. Event Flow (`event-flow.test.ts`)
Tests verify event propagation:

- Event capture and broadcast
- Event ordering and timestamps
- Event filtering
- Event history tracking
- Multiple event types

### 5. Memory Management (`memory-management.test.ts`)
Tests verify memory cleanup:

- Resource cleanup on unregister
- No memory leaks with multiple tables
- WeakRef cleanup verification
- Event listener cleanup
- Bridge cleanup on disconnect

### 6. Error Handling (`error-handling.test.ts`)
Tests verify error scenarios:

- Invalid table registration handling
- Bridge communication failure recovery
- Error message propagation
- Backend continues after errors
- Graceful degradation

### 7. React Hook Integration (`react-hooks.test.tsx`)
Tests verify React hook integration:

- Automatic registration with useDevToolsTable
- Cleanup on unmount
- enabled/disabled toggle
- Multiple table registration via hooks
- Hook cleanup sequence

## Running Tests

### Run all integration tests:
```bash
pnpm test:integration
```

### Run with coverage:
```bash
pnpm test:integration:coverage
```

### Watch mode:
```bash
pnpm test:integration:watch
```

### Update snapshots:
```bash
pnpm test:integration:update
```

### Run all tests (unit + integration):
```bash
pnpm test:all
```

## Test Helpers

### `create-table.ts`
Utilities for creating test tables:

```typescript
import { createTestTable, createSampleTable } from './__helpers__/create-table'

const table = createSampleTable()
```

### `mock-bridge.ts`
Utilities for mocking bridge communication:

```typescript
import { createMockBridge, mockChromeAPI } from './__helpers__/mock-bridge'

const mock = createMockBridge()
const chromeMock = mockChromeAPI()
```

### `setup-environment.ts`
Environment setup utilities:

```typescript
import { setupTestEnvironment, setupDevToolsEnvironment } from './__helpers__/setup-environment'

const { backend, bridge } = setupDevToolsEnvironment()
```

## Writing New Integration Tests

1. Create a new test file in this directory
2. Import helpers from `./__helpers__/*`
3. Use `beforeEach` and `afterEach` for setup/teardown
4. Test the integration between components
5. Verify end-to-end flows

### Example:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DevToolsBackend } from '../backend/DevToolsBackend'
import { createSampleTable } from './__helpers__/create-table'
import { createMockBridge } from './__helpers__/mock-bridge'

describe('My Integration Test', () => {
  let backend: DevToolsBackend
  let mockPostMessage: any
  let originalWindow: any

  beforeEach(() => {
    originalWindow = global.window
    const mock = createMockBridge()
    mockPostMessage = mock.postMessage

    backend = new DevToolsBackend()
  })

  afterEach(() => {
    backend.cleanup()
    global.window = originalWindow
    vi.restoreAllMocks()
  })

  it('should do something', async () => {
    // Given
    const table = createSampleTable()
    backend.registerTable(table)

    // When
    // ... test actions ...

    // Then
    expect(mockPostMessage).toHaveBeenCalled()
  })
})
```

## Current Status

The integration test setup is in progress. Currently:

- ✅ Directory structure created
- ✅ Test helpers created
- ✅ Test scripts configured
- 🟡 21 passing tests (43.75%)
- 🟡 27 failing tests (56.25%)
- 🟡 Coverage target: 85%+ (not yet achieved)

## Next Steps

1. Fix remaining test failures
2. Achieve 85%+ coverage
3. Optimize test runtime (< 5 seconds)
4. Document testing approach
5. Update CI pipeline

## Coverage Requirements

Integration tests target **85%+ coverage** for:

- Backend ↔ Bridge communication
- Extension communication
- Multi-table management
- Event flow
- Memory management
- Error handling
- React hook integration
