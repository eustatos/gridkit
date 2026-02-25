// Tests for DevToolsBackend table integration
import { describe, it, expect, beforeEach } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { devToolsBackend } from '../DevToolsBackend'

describe('DevToolsBackend', () => {
  let backend: DevToolsBackend

  beforeEach(() => {
    backend = new DevToolsBackend()
  })

  afterEach(() => {
    backend.cleanup()
  })

  it('should export DevToolsBackend class', () => {
    expect(DevToolsBackend).toBeDefined()
    expect(typeof DevToolsBackend).toBe('function')
  })

  it('should export devToolsBackend instance', () => {
    expect(devToolsBackend).toBeDefined()
    expect(devToolsBackend).toBeInstanceOf(DevToolsBackend)
  })

  it('should have registerTable method', () => {
    expect(devToolsBackend.registerTable).toBeTypeOf('function')
  })

  it('should have unregisterTable method', () => {
    expect(devToolsBackend.unregisterTable).toBeTypeOf('function')
  })

  it('should have getTables method', () => {
    expect(devToolsBackend.getTables).toBeTypeOf('function')
  })

  it('should have getTable method', () => {
    expect(devToolsBackend.getTable).toBeTypeOf('function')
  })

  it('should have cleanup method', () => {
    expect(devToolsBackend.cleanup).toBeTypeOf('function')
  })

  it('should be initialized', () => {
    expect(devToolsBackend).toBeDefined()
    expect(devToolsBackend['tables'].size).toBeGreaterThanOrEqual(0)
    expect(devToolsBackend['tableMetadata'].size).toBeGreaterThanOrEqual(0)
  })

  it('should register and retrieve table', () => {
    const mockTable = {
      id: 'test-table',
      getState: () => ({}),
      options: { tableId: 'test-table' },
      getRowModel: () => ({ rows: [] }),
      getAllColumns: () => [],
    }

    backend.registerTable(mockTable)
    const tables = backend.getTables()

    expect(tables).toHaveLength(1)
    expect(tables[0].id).toBe('test-table')
  })

  it('should unregister table', () => {
    const mockTable = {
      id: 'test-table',
      getState: () => ({}),
      options: { tableId: 'test-table' },
      getRowModel: () => ({ rows: [] }),
      getAllColumns: () => [],
    }

    backend.registerTable(mockTable)
    expect(backend.getTables()).toHaveLength(1)

    backend.unregisterTable(mockTable)
    expect(backend.getTables()).toHaveLength(0)
  })

  it('should get table by ID', () => {
    const mockTable = {
      id: 'test-table',
      getState: () => ({ sorting: [] }),
      options: { tableId: 'test-table' },
      getRowModel: () => ({ rows: [] }),
      getAllColumns: () => [],
    }

    backend.registerTable(mockTable)
    const retrieved = backend.getTable('test-table')

    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe('test-table')
  })

  it('should handle invalid table gracefully', () => {
    const invalidTable = { invalid: true } as any

    expect(() => {
      backend.registerTable(invalidTable)
    }).not.toThrow()

    // Invalid table is registered with a generated ID (not filtered out)
    // But it doesn't crash
    expect(backend['tables'].size).toBe(1)
    expect(backend.getTables()).toHaveLength(1)
  })

  it('should cleanup all resources', () => {
    const table1 = {
      id: 'table-1',
      getState: () => ({}),
      options: { tableId: 'table-1' },
      getRowModel: () => ({ rows: [] }),
      getAllColumns: () => [],
    }

    const table2 = {
      id: 'table-2',
      getState: () => ({}),
      options: { tableId: 'table-2' },
      getRowModel: () => ({ rows: [] }),
      getAllColumns: () => [],
    }

    backend.registerTable(table1)
    backend.registerTable(table2)
    expect(backend.getTables()).toHaveLength(2)

    backend.cleanup()
    expect(backend.getTables()).toHaveLength(0)
  })
})
