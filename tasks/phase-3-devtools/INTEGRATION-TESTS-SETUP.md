# Integration Tests Setup - DevTools Phase 3

**Status:** 🟡 In Progress  
**Last Updated:** 2026-02-25  
**Estimated Duration:** ~10-12 hours  
**Dependencies:** DEVTOOLS-008  
**Blockers:** Setup tasks D1-D3 must be completed first

---

## 📋 Overview

This task focuses on setting up the integration test infrastructure for @gridkit/devtools package. Integration tests verify that multiple components work together correctly, which is critical for the DevTools extension where:

- Backend ↔ Bridge ↔ Content script communication
- Multiple table management
- Event flow propagation
- Memory management
- Error handling

---

## 🎯 Task Goals

### Primary Objectives

1. ✅ Create integration test directory structure
2. ✅ Set up test utilities and mocks
3. ✅ Write 20+ integration test cases
4. 🟡 Achieve 85%+ integration coverage (21/48 passing - 43.75%)
5. ✅ Document testing approach

---

## 📊 Test Categories

### Category 1: Backend ↔ Bridge Integration (3-4 hours)

**Test Files:**
- `integration/backend-bridge-content.test.ts`

**Test Cases:**
1. ✅ Table registration flow (Backend → Bridge)
2. ✅ State change propagation (Table → Backend → Bridge)
3. ✅ Command routing (Bridge → Backend → Table)
4. ✅ Multiple table registration
5. ✅ Table unregister cleanup

**Coverage:**
- Backend methods: registerTable, unregisterTable, getTables, getTable
- Bridge methods: sendCommand, onCommand, send
- Integration between backend and bridge components

---

### Category 2: Extension Communication (3-4 hours)

**Test Files:**
- `integration/extension-communication.test.ts`

**Test Cases:**
1. ✅ Full message lifecycle (Content ↔ Background)
2. ✅ Command routing (Panel → Background → Content)
3. ✅ Response handling (Content → Background → Panel)
4. ✅ Message validation
5. ✅ Error recovery in communication
6. ✅ Disconnect/reconnect handling

**Coverage:**
- Content script injection
- Background script message handling
- Panel ↔ content script communication
- Message protocol validation

---

### Category 3: Multi-Table Management (2 hours)

**Test Files:**
- `integration/multi-table.test.ts`

**Test Cases:**
1. ✅ Multiple table registration with unique IDs
2. ✅ Table lifecycle management
3. ✅ Table lookup by ID
4. ✅ Table cleanup on unregister
5. ✅ Edge case: same table registered twice

**Coverage:**
- Table registry functionality
- ID generation and uniqueness
- Memory cleanup on unregister
- Edge case handling

---

### Category 4: Event Flow (2-3 hours)

**Test Files:**
- `integration/event-flow.test.ts`

**Test Cases:**
1. ✅ Event capture and broadcast
2. ✅ Event ordering and timestamps
3. ✅ Event filtering
4. ✅ Event history tracking
5. ✅ Multiple event types (sort, filter, selection, etc.)

**Coverage:**
- Event propagation path
- Event ordering guarantees
- Event metadata preservation
- Event history management

---

### Category 5: Memory Management (1-2 hours)

**Test Files:**
- `integration/memory-management.test.ts`

**Test Cases:**
1. ✅ Resource cleanup on unregister
2. ✅ No memory leaks with multiple tables
3. ✅ WeakRef cleanup verification
4. ✅ Event listener cleanup
5. ✅ Bridge cleanup on disconnect

**Coverage:**
- Memory leak detection
- Cleanup verification
- WeakRef behavior
- Resource disposal

---

### Category 6: Error Handling (1-2 hours)

**Test Files:**
- `integration/error-handling.test.ts`

**Test Cases:**
1. ✅ Invalid table registration handling
2. ✅ Bridge communication failure recovery
3. ✅ Error messages propagate correctly
4. ✅ Backend continues after errors
5. ✅ Graceful degradation

**Coverage:**
- Error scenarios
- Recovery mechanisms
- Error message formatting
- System stability under errors

---

### Category 7: React Hook Integration (1-2 hours)

**Test Files:**
- `integration/react-hooks.test.tsx`

**Test Cases:**
1. ✅ Automatic registration with useDevToolsTable
2. ✅ Cleanup on unmount
3. ✅ enabled/disabled toggle
4. ✅ Multiple table registration via hooks
5. ✅ Hook cleanup sequence

**Coverage:**
- Hook initialization
- Hook cleanup
- Toggle functionality
- React lifecycle integration

---

## 🛠️ Setup Instructions

### 1. Create Integration Directory

```bash
mkdir -p packages/devtools/integration
mkdir -p packages/devtools/integration/__helpers__
```

### 2. Create Test Utilities

**File:** `integration/__helpers__/create-table.ts`

```typescript
import type { EnhancedTable, EnhancedTableFeatures } from '@gridkit/tanstack-adapter'

export function createMockTable<TData = any>(overrides: any = {}): EnhancedTable<TData> {
  return {
    id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    options: { tableId: undefined },
    
    // Core table methods
    getState: () => ({}),
    setState: () => {},
    getRowModel: () => ({ rows: [] }),
    getAllColumns: () => [],
    getVisibleColumns: () => [],
    getHeaderGroups: () => [],
    
    // Event system
    on: () => () => {},
    off: () => {},
    emit: () => {},
    use: () => () => {},
    
    // Performance monitoring
    metrics: {
      getMetrics: () => ({}),
      checkBudgets: () => [],
      setBudgets: () => {},
      clear: () => {},
    },
    
    // Validation
    validator: {
      validateAll: () => Promise.resolve({ valid: true, errors: [] }),
    },
    
    // Plugin system
    getPlugin: () => undefined,
    registerPlugin: () => {},
    unregisterPlugin: () => {},
    pluginManager: {
      register: () => {},
      unregister: () => {},
      get: () => undefined,
    },
    
    // TanStack Table methods
    setSorting: () => {},
    setFiltering: () => {},
    setPagination: () => {},
    setGrouping: () => {},
    setColumnVisibility: () => {},
    setColumnPinning: () => {},
    toggleSort: () => {},
    toggleRowSelection: () => {},
    toggleAllRowsSelection: () => {},
    toggleExpansion: () => {},
    setFilter: () => {},
    getCoreRowModel: () => ({ rows: [] }),
    
    // GridKit table methods
    debug: {
      getEventHistory: () => [],
      getPerformanceMetrics: () => ({}),
      getMemoryUsage: () => ({}),
      getPlugins: () => [],
      getSnapshots: () => [],
      timeTravel: () => ({}),
    },
    
    ...overrides,
  } as any
}

export function createTestTable<TData = any>(data: TData[] = [], columns: any[] = []) {
  return createMockTable<TData>({
    options: { data, columns },
  })
}

export function createSampleTable() {
  return createMockTable({
    options: {
      data: [
        { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' },
        { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' },
        { id: '3', name: 'Charlie', age: 35, email: 'charlie@example.com' },
      ],
      columns: [
        { accessor: 'id', header: 'ID', size: 80 },
        { accessor: 'name', header: 'Name', size: 150 },
        { accessor: 'age', header: 'Age', size: 80 },
        { accessor: 'email', header: 'Email', size: 200 },
      ],
    },
    getRowModel: () => ({
      rows: [
        { id: '1', original: { id: '1', name: 'Alice', age: 30, email: 'alice@example.com' } },
        { id: '2', original: { id: '2', name: 'Bob', age: 25, email: 'bob@example.com' } },
        { id: '3', original: { id: '3', name: 'Charlie', age: 35, email: 'charlie@example.com' } },
      ],
    }),
    getAllColumns: () => [
      { id: 'id', accessorKey: 'id', header: 'ID', size: 80 },
      { id: 'name', accessorKey: 'name', header: 'Name', size: 150 },
      { id: 'age', accessorKey: 'age', header: 'Age', size: 80 },
      { id: 'email', accessorKey: 'email', header: 'Email', size: 200 },
    ],
  })
}
```

**File:** `integration/__helpers__/mock-bridge.ts`

```typescript
import { vi } from 'vitest'

export function createMockBridge() {
  const postMessage = vi.fn()
  const addEventListener = vi.fn()
  const removeEventListener = vi.fn()

  // Store original window
  const originalWindow = global.window

  // Mock window
  Object.defineProperty(window, 'postMessage', {
    value: postMessage,
    writable: true,
  })
  Object.defineProperty(window, 'addEventListener', {
    value: addEventListener,
    writable: true,
  })
  Object.defineProperty(window, 'removeEventListener', {
    value: removeEventListener,
    writable: true,
  })

  return {
    postMessage,
    addEventListener,
    removeEventListener,
    restore: () => {
      global.window = originalWindow
    },
  }
}

export function mockChromeAPI() {
  const mockRuntime = {
    connect: vi.fn(),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onConnect: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  }

  const mockChrome = {
    runtime: mockRuntime,
  }

  // Store original chrome
  const originalChrome = (global as any).chrome

  // Mock chrome
  ;(global as any).chrome = mockChrome

  return {
    chrome: mockChrome,
    runtime: mockRuntime,
    restore: () => {
      if (originalChrome) {
        ;(global as any).chrome = originalChrome
      } else {
        delete (global as any).chrome
      }
    },
  }
}
```

### 3. Update package.json

Add test scripts:

```json
{
  "scripts": {
    "test:integration": "vitest run integration/",
    "test:integration:coverage": "vitest run integration/ --coverage",
    "test:integration:watch": "vitest integration/",
    "test:integration:update": "vitest run integration/ -u",
    "test:all": "pnpm run test && pnpm run test:integration"
  }
}
```

### 4. Update vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '__tests__/',
        '**/*.d.ts',
        '**/examples/',
        '**/docs/',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

---

## 📈 Success Criteria

### Acceptance Criteria

- [x] Integration directory created with proper structure
- [x] Test utilities created and documented
- [x] 20+ integration test cases created (48 total)
- [ ] Integration test coverage ≥ 85% (currently 43.75%)
- [ ] Integration tests run in < 5 seconds (currently ~18 seconds)
- [x] Integration tests documented
- [ ] CI pipeline updated to run integration tests

### Quality Gates

- [ ] All integration tests pass in CI (21/48 passing)
- [ ] No flaky tests
- [ ] Coverage thresholds met
- [ ] Documentation complete
- [ ] Performance targets met (< 5s test runtime)

---

## 🔄 Implementation Sequence

### Step 1: Setup Infrastructure (1 hour) ✅ COMPLETED

```bash
# Create directory structure
mkdir -p packages/devtools/integration/__helpers__

# Create basic test file
touch packages/devtools/integration/example.test.ts
```

### Step 2: Create Test Utilities (1 hour) ✅ COMPLETED

- [x] `integration/__helpers__/create-table.ts`
- [x] `integration/__helpers__/mock-bridge.ts`
- [x] `integration/__helpers__/setup-environment.ts`

### Step 3: Write Integration Tests (8-10 hours) 🟡 IN PROGRESS

#### Day 1 (4-5 hours):
- [x] Category 1: Backend ↔ Bridge (3-4 tests)
- [x] Category 2: Extension Comm (2-3 tests)

#### Day 2 (4-5 hours):
- [x] Category 3: Multi-Table (3 tests)
- [x] Category 4: Event Flow (3 tests)
- [x] Category 5: Memory (2 tests)

### Step 4: Final Polish (1-2 hours) 🟡 IN PROGRESS

- [ ] Fix failing tests
- [ ] Achieve 85% coverage
- [ ] Optimize test runtime
- [ ] CI pipeline updated

---

## 📚 Documentation

### Test Patterns

#### Pattern 1: Full Integration Flow

```typescript
describe('Full Integration: Backend ↔ Bridge ↔ Content', () => {
  let backend: DevToolsBackend
  let bridge: DevToolsBridge
  let mockPostMessage: any

  beforeEach(() => {
    backend = new DevToolsBackend()
    bridge = new DevToolsBridge()
    // Setup mocks
  })

  it('should complete full registration flow', async () => {
    // Given
    const table = createSampleTable()
    
    // When
    backend.registerTable(table)
    
    // Find the TABLE_REGISTERED message (skip BACKEND_READY which is sent first)
    const tableRegisteredMsg = mockPostMessage.mock.calls.find((call: any[]) => {
      const msg = call[0]
      return msg.type === 'TABLE_REGISTERED'
    })
    
    // Then
    expect(tableRegisteredMsg).toBeDefined()
    expect(tableRegisteredMsg[0].payload.table.id).toBe(table.id)
  })
})
```

#### Pattern 2: Communication Flow

```typescript
describe('Extension Communication', () => {
  let originalWindow: any
  let mockPostMessage: any

  beforeEach(() => {
    originalWindow = global.window
    mockPostMessage = vi.fn()
    Object.defineProperty(window, 'postMessage', {
      value: mockPostMessage,
      writable: true,
    })
  })

  it('should route command through extension', async () => {
    // Given
    const bridge = new DevToolsBridge()
    
    // When
    bridge.send({ type: 'COMMAND', payload: { type: 'GET_TABLES' } } as any)
    
    // Find the COMMAND message
    const commandMsg = mockPostMessage.mock.calls.find((call: any[]) => {
      const msg = call[0]
      return msg.type === 'COMMAND'
    })
    
    // Then
    expect(commandMsg).toBeDefined()
    expect(commandMsg[0]).toMatchObject({ type: 'COMMAND' })
  })
})
```

### Coverage Targets

```
┌─────────────────────────────────────────────────────────────┐
│  Integration Test Coverage Targets                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overall: 85%+                                              │
│                                                             │
│  By Category:                                               │
│  • Backend ↔ Bridge: 90%+                                   │
│  • Extension Comm: 85%+                                     │
│  • Multi-Table: 80%+                                        │
│  • Event Flow: 90%+                                         │
│  • Memory: 85%+                                             │
│  • Error Handling: 90%+                                     │
│  • React Hooks: 80%+                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Mock Window Not Working

**Problem:** `window` not available in test context

**Solution:**
```typescript
beforeEach(() => {
  const originalWindow = global.window
  Object.defineProperty(window, 'postMessage', {
    value: vi.fn(),
    writable: true,
  })
  
  afterEach(() => {
    global.window = originalWindow
  })
})
```

### Issue 2: Async Communication Timing

**Problem:** Tests failing due to async timing

**Solution:**
```typescript
it('should handle async operation', async () => {
  // Use wait-for utility
  await waitFor(() => {
    expect(someState).toBe('expected')
  })
})
```

### Issue 3: Memory Cleanup Verification

**Problem:** Hard to verify cleanup without weak references

**Solution:**
```typescript
it('should clean up resources', () => {
  const backend = new DevToolsBackend()
  const table = createTestTable()
  
  backend.registerTable(table)
  expect(backend.getTables()).toHaveLength(1)
  
  backend.unregisterTable(table)
  expect(backend.getTables()).toHaveLength(0)
  
  // Verify internal maps cleaned up
  expect((backend as any).tables.size).toBe(0)
})
```

### Issue 4: Bridge Constructor Sends BACKEND_READY

**Problem:** Bridge constructor sends BACKEND_READY message, interfering with tests

**Solution:** Skip the first message and look for the expected message type:
```typescript
const expectedMsg = mockPostMessage.mock.calls.find((call: any[]) => {
  const msg = call[0]
  return msg.type === 'EXPECTED_MESSAGE_TYPE'
})
```

---

## 📊 Progress Tracking

### Milestones

| Milestone | Goal | Status | Date |
|-----------|------|--------|------|
| M1 | Setup Infrastructure | ✅ Complete | 2026-02-25 |
| M2 | Test Utilities Complete | ✅ Complete | 2026-02-25 |
| M3 | 10 Integration Tests | ✅ Complete | 2026-02-25 |
| M4 | 20 Integration Tests | ✅ Complete | 2026-02-25 |
| M5 | 85% Coverage | 🟡 In Progress | 2026-02-25 |
| M6 | Fix Failing Tests | 🟡 In Progress | 2026-02-25 |

---

## 🎯 Next Steps

1. **Today:** Fix remaining test failures
2. **Today:** Achieve 85% coverage
3. **This Week:** Optimize test runtime (< 5s)
4. **This Week:** Update CI pipeline
5. **This Week:** Complete documentation

---

**Last Updated:** 2026-02-25  
**Next Update:** After test fixes complete  
**Current Priority:** Fix failing tests

