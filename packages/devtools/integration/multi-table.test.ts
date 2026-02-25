// Integration tests: Multi-Table Management
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DevToolsBackend } from '../backend/DevToolsBackend'
import { DevToolsBridge } from '../bridge/DevToolsBridge'
import { createTestTable, createSampleTable } from './__helpers__/create-table'
import { createMockBridge } from './__helpers__/mock-bridge'

describe('Integration: Multi-Table Management', () => {
  let backend: DevToolsBackend
  let bridge: DevToolsBridge
  let mockPostMessage: any
  let originalWindow: any

  beforeEach(() => {
    originalWindow = global.window
    const mock = createMockBridge()
    mockPostMessage = mock.postMessage

    backend = new DevToolsBackend()
    // Bridge is singleton, don't create new one
  })

  afterEach(() => {
    backend.cleanup()
    global.window = originalWindow
    vi.restoreAllMocks()
  })

  it('should handle multiple tables with unique IDs', () => {
    // Given
    const table1 = createTestTable([], [])
    const table2 = createTestTable([], [])
    const table3 = createTestTable([], [])

    // When
    backend.registerTable(table1)
    backend.registerTable(table2)
    backend.registerTable(table3)

    // Then
    const tables = backend.getTables()
    expect(tables).toHaveLength(3)

    // Verify all IDs are unique
    const ids = tables.map((t: any) => t.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('should manage table lifecycle (register/unregister)', () => {
    // Given
    const table = createSampleTable()

    // When
    backend.registerTable(table)
    expect(backend.getTables()).toHaveLength(1)

    // Then
    backend.unregisterTable(table)
    expect(backend.getTables()).toHaveLength(0)
  })

  it('should look up table by ID', () => {
    // Given
    const table = createSampleTable()
    const expectedId = table.options?.tableId || `table-${Math.random().toString(36).substr(2, 9)}`
    backend.registerTable(table)

    // When
    const retrievedTable = backend.getTable(expectedId)

    // Then
    expect(retrievedTable).toBeDefined()
    expect(retrievedTable).toBe(table)
  })

  it('should cleanup on unregister', () => {
    // Given
    const table = createSampleTable()
    const tableId = table.options?.tableId || table.id

    // When
    backend.registerTable(table)
    expect(backend.getTables()).toHaveLength(1)

    // Then - verify internal maps cleaned up
    backend.unregisterTable(table)
    expect(backend.getTables()).toHaveLength(0)
    expect(backend.getTable(tableId)).toBeUndefined()
  })

  it('should handle edge case: same table registered twice', () => {
    // Given - create table with explicit tableId to ensure consistent ID
    const table = createSampleTable()
    const tableId = table.options?.tableId
    
    // When
    backend.registerTable(table)
    const initialCount = backend.getTables().length
    
    // Register the same table again (should be ignored due to ID check)
    backend.registerTable(table)
    const afterDuplicate = backend.getTables().length

    // Then
    expect(initialCount).toBe(1)
    expect(afterDuplicate).toBe(1) // Should not duplicate (already registered)
  })

  it('should generate unique IDs for different tables', () => {
    // Given
    const table1 = createTestTable([{ id: '1' }], [{ accessor: 'id' }])
    const table2 = createTestTable([{ id: '2' }], [{ accessor: 'id' }])

    // When
    backend.registerTable(table1)
    backend.registerTable(table2)

    // Then
    const tables = backend.getTables()
    // IDs should be different (either from table.options.tableId or generated)
    const ids = tables.map((t: any) => t.id)
    expect(ids[0]).not.toBe(ids[1])
  })

  it('should handle cleanup of all tables', () => {
    // Given
    const tables = []
    for (let i = 0; i < 5; i++) {
      tables.push(createTestTable([], []))
      backend.registerTable(tables[i])
    }

    expect(backend.getTables()).toHaveLength(5)

    // When
    backend.cleanup()

    // Then
    expect(backend.getTables()).toHaveLength(0)
  })
})
