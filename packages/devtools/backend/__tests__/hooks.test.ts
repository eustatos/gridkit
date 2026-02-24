// Tests for integration hooks
import { describe, it, expect } from 'vitest'
import { isGridKitTable, detectGridKitTables, autoRegisterTables, setupAutoDetection, listenForTableEvents } from '../detector'
import { devToolsBackend } from '../DevToolsBackend'
import { DevToolsBridge, devToolsBridge } from '../../bridge/DevToolsBridge'

describe('Integration Hooks', () => {
  it('should verify basic test structure', () => {
    expect(true).toBe(true)
  })
})

describe('DevTools Backend', () => {
  it('should verify backend exists', () => {
    expect(devToolsBackend).toBeDefined()
  })

  it('should have expected methods', () => {
    expect(devToolsBackend.registerTable).toBeTypeOf('function')
    expect(devToolsBackend.unregisterTable).toBeTypeOf('function')
    expect(devToolsBackend.getTables).toBeTypeOf('function')
    expect(devToolsBackend.getTable).toBeTypeOf('function')
    expect(devToolsBackend.cleanup).toBeTypeOf('function')
  })
})

describe('DevTools Bridge', () => {
  it('should verify bridge exists', () => {
    expect(devToolsBridge).toBeDefined()
  })

  it('should have expected methods', () => {
    expect(devToolsBridge.send).toBeTypeOf('function')
    expect(devToolsBridge.sendCommand).toBeTypeOf('function')
    expect(devToolsBridge.onCommand).toBeTypeOf('function')
    expect(devToolsBridge.onResponse).toBeTypeOf('function')
    expect(devToolsBridge.disconnect).toBeTypeOf('function')
    expect(devToolsBridge.isConnected).toBeTypeOf('function')
  })

  it('should export DevToolsBridge class', () => {
    expect(DevToolsBridge).toBeDefined()
    expect(typeof DevToolsBridge).toBe('function')
  })
})

describe('Auto-detection functions', () => {
  it('should have isGridKitTable', () => {
    expect(isGridKitTable).toBeTypeOf('function')
  })

  it('should have detectGridKitTables', () => {
    expect(detectGridKitTables).toBeTypeOf('function')
  })

  it('should have autoRegisterTables', () => {
    expect(autoRegisterTables).toBeTypeOf('function')
  })

  it('should have setupAutoDetection', () => {
    expect(setupAutoDetection).toBeTypeOf('function')
  })

  it('should have listenForTableEvents', () => {
    expect(listenForTableEvents).toBeTypeOf('function')
  })
})
