# Integration Tests for @gridkit/devtools

## Current State
- ✅ Unit tests exist for individual classes (DevToolsBackend, DevToolsBridge, detector)
- ❌ No tests for component integration between each other

## Why Integration Tests Are Needed

1. **Complex Integration** - DevTools interacts with:
   - Extension API (background/content scripts)
   - React UI components
   - Bridge communication layer
   - Multiple GridKit tables simultaneously

2. **Critical Reliability** - bugs in devtools affect the entire development process

3. **High ROI** - critical flows (register/unregister, event propagation, memory management) need integration coverage

## Priority Integration Scenarios

### 1. Full Integration: Backend ↔ Bridge ↔ Content Script

**Test File:** `integration/backend-bridge-content.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { DevToolsBridge } from '../DevToolsBridge'
import { createTable } from '@gridkit/core'

describe('Full Integration: Backend ↔ Bridge ↔ Content', () => {
  let backend: DevToolsBackend
  let bridge: DevToolsBridge
  let mockPostMessage: any

  beforeEach(() => {
    backend = new DevToolsBackend()
    bridge = new DevToolsBridge()
    
    mockPostMessage = vi.fn()
    Object.defineProperty(window, 'postMessage', {
      value: mockPostMessage,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should register table through backend and communicate via bridge', async () => {
    // 1. Create table
    const table = createTable({ data: [], columns: [] })
    
    // 2. Register in backend
    backend.registerTable(table)
    
    // 3. Verify bridge received notification
    const tables = await bridge.sendCommand('GET_TABLES')
    expect(tables).toHaveLength(1)
  })

  it('should propagate state changes from table → backend → bridge', async () => {
    const table = createTable({ 
      data: [{ id: '1', name: 'test' }],
      columns: [{ accessor: 'name' }]
    })
    backend.registerTable(table)
    
    // Change state
    table.toggleSort('name')
    
    // Verify changes propagated through bridge
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'STATE_UPDATE' })
    )
  })
})
```

### 2. Extension Background ↔ Content Script Communication

**Test File:** `integration/extension-communication.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DevToolsBridge } from '../DevToolsBridge'
import { COMMAND, RESPONSE, BACKEND_READY, CONTENT_READY } from '../messages'

describe('Extension: Background ↔ Content Communication', () => {
  let originalWindow: any
  let mockPostMessage: any
  let mockAddEventListener: any

  beforeEach(() => {
    originalWindow = global.window

    mockPostMessage = vi.fn()
    mockAddEventListener = vi.fn()

    Object.defineProperty(window, 'postMessage', {
      value: mockPostMessage,
      writable: true,
    })
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
    })
    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    global.window = originalWindow
  })

  it('should handle full message lifecycle', async () => {
    // 1. Content script connects
    const contentBridge = new DevToolsBridge()
    
    // 2. Backend sends READY
    const readyMsg = { type: BACKEND_READY, source: 'backend' }
    contentBridge.send(readyMsg)
    
    // 3. Content responds with READY
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: CONTENT_READY })
    )
  })

  it('should route commands from panel through background to content', async () => {
    // Panel → Background → Content → Background → Panel
    const command = { type: COMMAND, payload: { type: 'GET_TABLES' } }
    
    const bridge = new DevToolsBridge()
    bridge.send(command)
    
    // Verify message chain
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: COMMAND })
    )
  })
})
```

### 3. Multi-Table Integration

**Test File:** `integration/multi-table.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { createTable } from '@gridkit/core'

describe('Multi-Table Integration', () => {
  let backend: DevToolsBackend

  beforeEach(() => {
    backend = new DevToolsBackend()
  })

  it('should handle multiple tables with unique IDs', () => {
    const table1 = createTable({ data: [], columns: [] })
    const table2 = createTable({ data: [], columns: [] })
    const table3 = createTable({ data: [], columns: [] })
    
    backend.registerTable(table1)
    backend.registerTable(table2)
    backend.registerTable(table3)
    
    const tables = backend.getTables()
    expect(tables).toHaveLength(3)
    
    // Verify all IDs are unique
    const ids = tables.map(t => t.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('should manage table lifecycle (register/unregister)', () => {
    const table = createTable({ data: [], columns: [] })
    backend.registerTable(table)
    expect(backend.getTables()).toHaveLength(1)
    
    backend.unregisterTable(table)
    expect(backend.getTables()).toHaveLength(0)
  })
})
```

### 4. Event Flow Integration

**Test File:** `integration/event-flow.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { DevToolsBridge } from '../DevToolsBridge'
import { createTable } from '@gridkit/core'

describe('Event Flow Integration', () => {
  let backend: DevToolsBackend
  let bridge: DevToolsBridge
  let mockPostMessage: any

  beforeEach(() => {
    backend = new DevToolsBackend()
    bridge = new DevToolsBridge()
    
    mockPostMessage = vi.fn()
    Object.defineProperty(window, 'postMessage', {
      value: mockPostMessage,
      writable: true,
    })
  })

  it('should capture and broadcast table events', async () => {
    const table = createTable({ 
      data: [{ id: '1', name: 'test' }],
      columns: [{ accessor: 'name' }]
    })
    backend.registerTable(table)
    
    // Listen for events via bridge
    const events: any[] = []
    bridge.onCommand('EVENT_LOGGED', (msg: any) => {
      events.push(msg.payload)
    })
    
    table.toggleSort('name')
    table.toggleRowSelection('1')
    
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('SORTING_CHANGED')
    expect(events[1].type).toBe('ROW_SELECTED')
  })

  it('should maintain event order and timestamps', () => {
    const table = createTable({ 
      data: [{ id: '1', name: 'test' }],
      columns: [{ accessor: 'name' }]
    })
    backend.registerTable(table)
    
    table.toggleSort('name')
    table.toggleRowSelection('1')
    table.toggleExpansion('1')
    
    // Verify order via backend
    const history = backend.getEventHistory()
    expect(history).toHaveLength(3)
    expect(history[0].timestamp < history[1].timestamp).toBe(true)
    expect(history[1].timestamp < history[2].timestamp).toBe(true)
  })
})
```

### 5. Performance Monitoring Integration

**Test File:** `integration/performance-monitoring.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { createTable } from '@gridkit/core'

describe('Performance Monitoring Integration', () => {
  let backend: DevToolsBackend

  beforeEach(() => {
    backend = new DevToolsBackend()
  })

  it('should collect and broadcast performance metrics', async () => {
    const table = createTable({ 
      data: [], 
      columns: [] 
    })
    backend.registerTable(table)
    
    // Simulate load
    const startTime = performance.now()
    for (let i = 0; i < 100; i++) {
      table.toggleSort('column-' + (i % 10))
    }
    const duration = performance.now() - startTime
    
    // Verify metrics
    const metrics = backend.getPerformanceMetrics()
    expect(metrics.renderCount).toBeGreaterThan(0)
    expect(metrics.lastRenderDuration).toBeDefined()
  })
})
```

### 6. Memory Management Integration

**Test File:** `integration/memory-management.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { createTable } from '@gridkit/core'

describe('Memory Management Integration', () => {
  let backend: DevToolsBackend

  beforeEach(() => {
    backend = new DevToolsBackend()
  })

  it('should clean up resources on unregister', () => {
    const table = createTable({ data: [], columns: [] })
    backend.registerTable(table)
    
    // Should create references
    expect((backend as any).tables.size).toBe(1)
    
    backend.unregisterTable(table)
    
    // Should clean up
    expect((backend as any).tables.size).toBe(0)
    expect((backend as any).tableMetadata.has(table.id)).toBe(false)
  })

  it('should not leak memory with multiple tables', () => {
    const tables = []
    for (let i = 0; i < 50; i++) {
      const table = createTable({ data: [], columns: [] })
      backend.registerTable(table)
      tables.push(table)
    }
    
    expect((backend as any).tables.size).toBe(50)
    
    // Unregister all
    tables.forEach(table => backend.unregisterTable(table))
    
    expect((backend as any).tables.size).toBe(0)
    
    // Verify cleanup is complete
    expect((backend as any).tableMetadata.size).toBe(0)
  })
})
```

### 7. Error Handling Integration

**Test File:** `integration/error-handling.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { DevToolsBridge } from '../DevToolsBridge'
import { createTable } from '@gridkit/core'

describe('Error Handling Integration', () => {
  let backend: DevToolsBackend

  beforeEach(() => {
    backend = new DevToolsBackend()
  })

  it('should handle invalid table registration gracefully', () => {
    expect(() => {
      backend.registerTable({ invalid: true } as any)
    }).toThrow(/invalid table/)
    
    // Backend should remain operational
    expect(backend.getTables()).toHaveLength(0)
  })

  it('should continue operating after bridge communication failure', () => {
    const table = createTable({ data: [], columns: [] })
    backend.registerTable(table)
    
    // Simulate bridge failure
    const bridge = new DevToolsBridge()
    bridge.disconnect()
    
    // Backend should continue working
    expect(() => {
      table.toggleSort('name')
    }).not.toThrow()
  })
})
```

### 8. React Hook Integration

**Test File:** `integration/react-hooks.test.tsx`

```typescript
import { describe, it, expect, beforeEach, render, fireEvent } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { createTable } from '@gridkit/core'
import { useDevToolsTable } from '../hooks'

// Mock components
const TestComponent = ({ table, enabled }: { table: any, enabled?: boolean }) => {
  useDevToolsTable(table, enabled)
  return <div>Test</div>
}

describe('React Hook Integration', () => {
  let backend: DevToolsBackend

  beforeEach(() => {
    backend = new DevToolsBackend()
  })

  it('should automatically register table with useDevToolsTable', () => {
    const table = createTable({ data: [], columns: [] })
    
    render(<TestComponent table={table} />)
    
    // Should have registration
    expect(backend.getTables()).toHaveLength(1)
  })

  it('should cleanup on unmount', () => {
    const table = createTable({ data: [], columns: [] })
    
    const { unmount } = render(<TestComponent table={table} />)
    
    expect(backend.getTables()).toHaveLength(1)
    
    unmount()
    
    // Should have automatic cleanup
    expect(backend.getTables()).toHaveLength(0)
  })

  it('should respect enabled/disabled toggle', () => {
    const table = createTable({ data: [], columns: [] })
    
    const { rerender } = render(<TestComponent table={table} enabled={true} />)
    
    expect(backend.getTables()).toHaveLength(1)
    
    rerender(<TestComponent table={table} enabled={false} />)
    
    expect(backend.getTables()).toHaveLength(0)
  })
})
```

## Test Structure

```
packages/devtools/
├── integration/                     # NEW: Integration tests
│   ├── backend-bridge-content.test.ts
│   ├── extension-communication.test.ts
│   ├── multi-table.test.ts
│   ├── event-flow.test.ts
│   ├── performance-monitoring.test.ts
│   ├── memory-management.test.ts
│   ├── error-handling.test.ts
│   └── react-hooks.test.tsx
├── backend/__tests__/
├── bridge/__tests__/
└── extension/__tests__/            # NEW
```

## Running Integration Tests

```bash
# Run all tests
pnpm test

# Run only integration tests
pnpm test -- integration/

# With coverage for integration tests
pnpm test -- integration/ --coverage
```

## Quality Metrics

Target metrics after adding integration tests:

- **Code Coverage**: 85%+ (unit + integration)
- **Integration Test Cases**: 20+ scenarios
- **Test Execution Time**: < 5 seconds for all integration tests
- **CI Reliability**: 99%+ pass rate

## Key Benefits

Integration tests for devtools are justified because:

1. ✅ Extension API and cross-context communication is complex
2. ✅ Devtools bugs critically affect development workflow
3. ✅ Multiple components require interaction testing
4. ✅ Lifecycle methods (register/unregister) are critical for memory
5. ✅ Event flow must work correctly for debugging

**Recommendation: Add incrementally, starting with most critical scenarios**
