// Tests for table auto-detection
import { describe, it, expect } from 'vitest'
import { isGridKitTable, detectGridKitTables, autoRegisterTables, setupAutoDetection, listenForTableEvents } from '../detector'

describe('isGridKitTable', () => {
  it('should return false for null', () => {
    expect(isGridKitTable(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isGridKitTable(undefined)).toBe(false)
  })

  it('should return false for non-object', () => {
    expect(isGridKitTable('string' as any)).toBe(false)
    expect(isGridKitTable(123 as any)).toBe(false)
  })

  it('should return false for object without required methods', () => {
    expect(isGridKitTable({} as any)).toBe(false)
    expect(isGridKitTable({ getState: () => {} } as any)).toBe(false)
  })

  it('should return true for valid GridKit table', () => {
    const table = {
      getState: () => ({}),
      subscribe: () => () => {},
      on: () => () => {},
      off: () => () => {},
      getRowModel: () => ({ rows: [] }),
      getAllColumns: () => [],
      options: { tableId: 'test-table' },
    }

    expect(isGridKitTable(table)).toBe(true)
  })

  it('should require tableId in options', () => {
    const table = {
      getState: () => ({}),
      subscribe: () => () => {},
      on: () => () => {},
      off: () => () => {},
      getRowModel: () => ({ rows: [] }),
      getAllColumns: () => [],
      options: {},
    }

    expect(isGridKitTable(table)).toBe(false)
  })
})

describe('detectGridKitTables', () => {
  it('should return empty array when no tables', () => {
    const tables = detectGridKitTables()
    expect(tables).toEqual([])
  })
})

describe('autoRegisterTables', () => {
  it('should not throw when no tables', () => {
    expect(() => autoRegisterTables()).not.toThrow()
  })
})

describe('setupAutoDetection', () => {
  it('should return cleanup function', () => {
    const cleanup = setupAutoDetection(1000)
    expect(cleanup).toBeTypeOf('function')
  })
})

describe('listenForTableEvents', () => {
  it('should return cleanup function', () => {
    const callback = () => {}
    const cleanup = listenForTableEvents(callback)
    expect(cleanup).toBeTypeOf('function')
  })
})
