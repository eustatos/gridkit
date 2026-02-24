// Tests for DevToolsBackend table integration
import { describe, it, expect } from 'vitest'
import { DevToolsBackend } from '../DevToolsBackend'
import { devToolsBackend } from '../DevToolsBackend'

describe('DevToolsBackend', () => {
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
})
