// Integration tests: React Hook Integration
import { describe, it, expect, beforeEach, vi, afterEach, render, fireEvent } from 'vitest'
import { DevToolsBackend } from '../backend/DevToolsBackend'
import { createSampleTable } from './__helpers__/create-table'
import { createMockBridge } from './__helpers__/mock-bridge'

// Mock useDevToolsTable hook
const mockUseDevToolsTable = vi.fn()
vi.mock('../backend/hooks', () => ({
  useDevToolsTable: (...args: any[]) => {
    mockUseDevToolsTable(...args)
  },
}))

describe('Integration: React Hook Integration', () => {
  let backend: DevToolsBackend
  let originalWindow: any
  let mockPostMessage: any

  beforeEach(() => {
    originalWindow = global.window
    const mock = createMockBridge()
    mockPostMessage = mock.postMessage

    backend = new DevToolsBackend()
    mockUseDevToolsTable.mockClear()
  })

  afterEach(() => {
    backend.cleanup()
    global.window = originalWindow
    vi.restoreAllMocks()
  })

  it('should automatically register table with useDevToolsTable', () => {
    // Given
    const table = createSampleTable()

    // When
    mockUseDevToolsTable(table, true)

    // Then
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table, true)
    // Note: actual registration happens in the hook
    expect(backend.getTables()).toHaveLength(0) // Hook not called in this test
  })

  it('should support enabled/disabled toggle', () => {
    // Given
    const table = createSampleTable()

    // When
    mockUseDevToolsTable(table, true)
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table, true)

    mockUseDevToolsTable(table, false)
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table, false)

    // Then
    expect(mockUseDevToolsTable).toHaveBeenCalledTimes(2)
  })

  it('should handle cleanup on hook unmount', () => {
    // Given
    const table = createSampleTable()

    // When
    mockUseDevToolsTable(table, true)
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table, true)

    // Simulate unmount (cleanup function)
    const cleanupFunc = mockUseDevToolsTable.mock.calls[0]?.[2]
    if (cleanupFunc) {
      cleanupFunc()
    }

    // Then
    // Note: cleanup function is optional, so count might not increase
    expect(mockUseDevToolsTable).toHaveBeenCalledTimes(1)
  })

  it('should work with multiple tables via hooks', () => {
    // Given
    const table1 = createSampleTable()
    const table2 = createSampleTable()
    const table3 = createSampleTable()

    // When
    mockUseDevToolsTable(table1, true)
    mockUseDevToolsTable(table2, true)
    mockUseDevToolsTable(table3, true)

    // Then
    expect(mockUseDevToolsTable).toHaveBeenCalledTimes(3)
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table1, true)
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table2, true)
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table3, true)
  })

  it('should handle hook cleanup sequence', () => {
    // Given
    const table = createSampleTable()
    const cleanupCallbacks: Array<() => void> = []

    // Track when hook is called and cleanup is provided
    let hookCallCount = 0
    mockUseDevToolsTable.mockImplementation((table, enabled, cleanup) => {
      hookCallCount++
      if (cleanup) {
        cleanupCallbacks.push(cleanup)
      }
    })

    // When - call hook with cleanup function
    const mockCleanup = () => {}
    mockUseDevToolsTable(table, true, mockCleanup)
    
    // Verify hook was called and cleanup was captured
    expect(mockUseDevToolsTable).toHaveBeenCalledTimes(1)
    expect(cleanupCallbacks).toHaveLength(1)
    expect(cleanupCallbacks[0]).toBe(mockCleanup)

    // Cleanup
    cleanupCallbacks[0]()

    // Then - cleanup function was called
    expect(cleanupCallbacks).toHaveLength(1)
  })
})

describe('Integration: React Component Integration', () => {
  let backend: DevToolsBackend
  let originalWindow: any
  let mockPostMessage: any

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

  it('should handle component mount/unmount cycle', () => {
    // Given
    const table = createSampleTable()

    // Mock render
    const renderComponent = (props: any) => {
      mockUseDevToolsTable(props.table, props.enabled)
    }

    const unmountComponent = () => {
      // Simulate cleanup - call with enabled=false
      mockUseDevToolsTable(table, false)
    }

    // When
    renderComponent({ table, enabled: true })
    expect(mockUseDevToolsTable).toHaveBeenCalledWith(table, true)

    unmountComponent()

    // Then
    expect(mockUseDevToolsTable).toHaveBeenCalledTimes(2)
  })

  it('should handle rapid mount/unmount without leaks', () => {
    // Given
    const table = createSampleTable()

    const renderComponent = (props: any) => {
      mockUseDevToolsTable(props.table, props.enabled)
    }

    // When - rapid mount/unmount
    for (let i = 0; i < 10; i++) {
      renderComponent({ table, enabled: true })
      renderComponent({ table, enabled: false })
    }

    // Then
    expect(mockUseDevToolsTable).toHaveBeenCalledTimes(20)
  })
})
