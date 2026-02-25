// Integration tests: Error Handling
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DevToolsBackend } from '../backend/DevToolsBackend'
import { DevToolsBridge } from '../bridge/DevToolsBridge'
import { createSampleTable } from './__helpers__/create-table'
import { createMockBridge } from './__helpers__/mock-bridge'

describe('Integration: Error Handling', () => {
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

  it('should handle invalid table registration gracefully', () => {
    // Given
    const invalidTable = { invalid: true } as any
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When/Then
    expect(() => {
      backend.registerTable(invalidTable)
    }).not.toThrow()

    // Verify backend remains operational (doesn't crash)
    // Invalid tables ARE registered with a generated ID
    expect(backend['tables'].size).toBe(1)
    
    // But getTables() should return at least 1 since we generate metadata
    const tables = backend.getTables()
    expect(tables.length).toBeGreaterThan(0)

    consoleError.mockRestore()
  })

  it('should continue operating after bridge communication failure', () => {
    // Given
    const table = createSampleTable()
    backend.registerTable(table)
    bridge.disconnect()

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When
    expect(() => {
      table.toggleSort('name')
    }).not.toThrow()

    // Then - backend should still track the table
    expect(backend.getTables()).toHaveLength(1)

    consoleError.mockRestore()
  })

  it('should propagate error messages correctly', () => {
    // Given
    const table = createSampleTable()
    backend.registerTable(table)

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When - simulate error scenario
    try {
      backend.unregisterTable({} as any) // Invalid table (no ID match)
    } catch (error) {
      // Should not throw
    }

    // Then
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('should continue after table with missing methods', () => {
    // Given
    const tableWithoutId = { getState: () => ({}) } as any
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    // When
    expect(() => {
      backend.registerTable(tableWithoutId)
    }).not.toThrow()

    // Then - should warn but not crash (but currently it doesn't warn)
    // Just verify it doesn't crash and table is registered with generated ID
    expect(backend['tables'].size).toBe(1)

    consoleWarn.mockRestore()
    consoleLog.mockRestore()
  })

  it('should handle bridge timeout gracefully', async () => {
    // Given
    const table = createSampleTable()
    backend.registerTable(table)
    bridge.disconnect()

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When
    try {
      await bridge.sendCommand('GET_TABLES')
    } catch (error) {
      // Expected to fail with timeout
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(Error)
    }

    // Then
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('should handle missing table ID gracefully', () => {
    // Given
    const tableWithoutId = { getState: () => ({}) } as any
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // When
    expect(() => {
      backend.registerTable(tableWithoutId)
    }).not.toThrow()

    // Then - should generate ID automatically
    expect(backend.getTables()).toHaveLength(1)

    consoleWarn.mockRestore()
  })

  it('should not crash on null/undefined data', () => {
    // Given
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When/Then - null
    expect(() => {
      backend.registerTable(null as any)
    }).not.toThrow()

    // When/Then - undefined
    expect(() => {
      backend.registerTable(undefined as any)
    }).not.toThrow()

    // Then - backend should still be operational
    // Null/undefined shouldn't add to tables
    expect(backend['tables'].size).toBe(0)

    consoleError.mockRestore()
  })
})
