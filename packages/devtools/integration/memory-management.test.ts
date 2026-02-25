// Integration tests: Memory Management
import { describe, it, expect, beforeEach } from 'vitest'
import { DevToolsBackend } from '../backend/DevToolsBackend'
import { createTestTable, createSampleTable } from './__helpers__/create-table'

describe('Integration: Memory Management', () => {
  let backend: DevToolsBackend

  beforeEach(() => {
    backend = new DevToolsBackend()
  })

  afterEach(() => {
    backend.cleanup()
  })

  it('should clean up resources on unregister', () => {
    // Given
    const table = createSampleTable()
    backend.registerTable(table)

    // Verify references exist
    expect(backend.getTables()).toHaveLength(1)
    expect(backend['tables'].size).toBe(1)
    expect(backend['tableMetadata'].size).toBe(1)

    // When
    backend.unregisterTable(table)

    // Then - verify cleanup
    expect(backend.getTables()).toHaveLength(0)
    expect(backend['tables'].size).toBe(0)
    expect(backend['tableMetadata'].size).toBe(0)
  })

  it('should not leak memory with multiple tables', () => {
    // Given
    const tables = []
    for (let i = 0; i < 50; i++) {
      const table = createTestTable([], [])
      backend.registerTable(table)
      tables.push(table)
    }

    expect(backend['tables'].size).toBe(50)
    expect(backend['tableMetadata'].size).toBe(50)

    // When
    tables.forEach((table) => backend.unregisterTable(table))

    // Then
    expect(backend['tables'].size).toBe(0)
    expect(backend['tableMetadata'].size).toBe(0)
  })

  it('should cleanup event listeners on unregister', () => {
    // Given
    const table = createSampleTable()
    const tableId = table.options?.tableId || table.id
    backend.registerTable(table)

    // Verify subscription exists
    const tableData = backend['tables'].get(tableId)
    expect(tableData?.unsubscribeState).toBeDefined()
    expect(tableData?.unsubscribeEvents).toBeDefined()

    // When
    backend.unregisterTable(table)

    // Then - verify cleanup
    expect(backend['tables'].has(tableId)).toBe(false)
  })

  it('should handle cleanup sequence properly', () => {
    // Given
    const table1 = createTestTable([], [])
    const table2 = createTestTable([], [])
    const table1Id = table1.options?.tableId || table1.id
    const table2Id = table2.options?.tableId || table2.id

    backend.registerTable(table1)
    backend.registerTable(table2)

    expect(backend.getTables()).toHaveLength(2)

    // When - unregister first table
    backend.unregisterTable(table1)

    // Then
    expect(backend.getTables()).toHaveLength(1)
    expect(backend['tables'].size).toBe(1)
    expect(backend['tableMetadata'].size).toBe(1)

    // When - unregister second table
    backend.unregisterTable(table2)

    // Then
    expect(backend.getTables()).toHaveLength(0)
    expect(backend['tables'].size).toBe(0)
    expect(backend['tableMetadata'].size).toBe(0)
  })

  it('should cleanup bridge connection on backend cleanup', () => {
    // Given
    const bridge = backend['bridge']
    bridge.disconnect = vi.fn()

    const table = createSampleTable()
    backend.registerTable(table)

    // When
    backend.cleanup()

    // Then
    expect(bridge.disconnect).toHaveBeenCalled()
    expect(backend.getTables()).toHaveLength(0)
  })

  it('should handle rapid register/unregister without leaks', () => {
    // Given
    const iterations = 100

    // When
    for (let i = 0; i < iterations; i++) {
      const table = createTestTable([], [])
      backend.registerTable(table)
      backend.unregisterTable(table)
    }

    // Then
    expect(backend['tables'].size).toBe(0)
    expect(backend['tableMetadata'].size).toBe(0)
  })
})
