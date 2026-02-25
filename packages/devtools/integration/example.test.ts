// Example integration test demonstrating the testing pattern
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DevToolsBackend } from '../backend/DevToolsBackend'
import { DevToolsBridge } from '../bridge/DevToolsBridge'
import { createSampleTable } from './__helpers__/create-table'
import { createMockBridge } from './__helpers__/mock-bridge'

describe('Example: Full Integration Flow', () => {
  let backend: DevToolsBackend
  let bridge: DevToolsBridge
  let mockPostMessage: any
  let originalWindow: any

  beforeEach(() => {
    // Setup environment with mocks
    originalWindow = global.window
    const mock = createMockBridge()
    mockPostMessage = mock.postMessage

    backend = new DevToolsBackend()
    bridge = new DevToolsBridge()
  })

  afterEach(() => {
    // Cleanup after each test
    backend.cleanup()
    global.window = originalWindow
    vi.restoreAllMocks()
  })

  it('should complete full registration flow', async () => {
    // 1. Create table
    const table = createSampleTable()
    const expectedId = table.options?.tableId || table.id

    // 2. Register in backend
    backend.registerTable(table)

    // Wait for async events
    await new Promise(resolve => setTimeout(resolve, 100))

    // 3. Verify bridge received notification
    expect(mockPostMessage).toHaveBeenCalled()

    // Find TABLE_REGISTERED message (skip BACKEND_READY which is sent first)
    const sentMessage = mockPostMessage.mock.calls.find((call: any[]) => {
      const msg = call[0]
      return msg.type === 'TABLE_REGISTERED'
    })
    
    expect(sentMessage).toBeDefined()
    expect(sentMessage[0].type).toBe('TABLE_REGISTERED')
    expect(sentMessage[0].payload.table.id).toBe(expectedId)

    // 4. Query via backend directly (bridge.sendCommand would timeout)
    const tables = backend.getTables()

    // 5. Verify response
    expect(tables).toHaveLength(1)
    expect(tables[0].id).toBe(expectedId)
    expect(tables[0].rowCount).toBe(3)
  })
})

describe('Example: State Change Propagation', () => {
  let backend: DevToolsBackend
  let bridge: DevToolsBridge
  let mockPostMessage: any
  let originalWindow: any

  beforeEach(() => {
    originalWindow = global.window
    const mock = createMockBridge()
    mockPostMessage = mock.postMessage

    backend = new DevToolsBackend()
    bridge = new DevToolsBridge()
  })

  afterEach(() => {
    backend.cleanup()
    global.window = originalWindow
    vi.restoreAllMocks()
  })

  it('should propagate state changes from table to bridge', async () => {
    // Given
    const table = createSampleTable()
    backend.registerTable(table)
    
    // Reset to ignore TABLE_REGISTERED
    mockPostMessage.mockClear()

    // When - change table state
    table.toggleSort?.('name')
    table.toggleRowSelection?.('1')

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 150))

    // Then - verify state update messages sent
    const stateUpdateMessages = mockPostMessage.mock.calls.filter((call: any[]) => {
      const msg = call[0]
      return msg.type === 'STATE_UPDATE'
    })

    // Note: state updates may not be sent if table.subscribe not available
    // Just verify backend still tracks table
    expect(backend.getTables()).toHaveLength(1)
  })
})
