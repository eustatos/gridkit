// Tests for DevTools protocol types
import { describe, it, expect } from 'vitest'
import type {
  DevToolsMessage,
  DevToolsCommand,
  DevToolsResponse,
  TableMetadata,
  EventFilter,
  PerformanceMetrics,
  MemorySnapshot,
  TableSnapshot,
} from '../protocol'

describe('Protocol Types', () => {
  describe('DevToolsMessage', () => {
    it('should have required fields', () => {
      const message: DevToolsMessage = {
        source: 'backend',
        type: 'TEST',
        timestamp: Date.now(),
      }

      expect(message).toMatchObject({
        source: 'backend',
        type: 'TEST',
        timestamp: expect.any(Number),
      })
    })

    it('should support optional payload and tableId', () => {
      const message: DevToolsMessage = {
        source: 'devtools',
        type: 'COMMAND',
        payload: { test: 'data' },
        tableId: 'table1',
        timestamp: Date.now(),
      }

      expect(message.payload).toEqual({ test: 'data' })
      expect(message.tableId).toBe('table1')
    })
  })

  describe('DevToolsCommand', () => {
    it('should have correct source type', () => {
      const command: DevToolsCommand = {
        source: 'devtools',
        type: 'GET_TABLES',
        timestamp: Date.now(),
      }

      expect(command.source).toBe('devtools')
    })

    it('should support all command types', () => {
      const commands: DevToolsCommand[] = [
        { source: 'devtools', type: 'GET_TABLES', timestamp: Date.now() },
        { source: 'devtools', type: 'GET_STATE', timestamp: Date.now() },
        { source: 'devtools', type: 'GET_EVENTS', timestamp: Date.now() },
        { source: 'devtools', type: 'GET_PERFORMANCE', timestamp: Date.now() },
        { source: 'devtools', type: 'TIME_TRAVEL', timestamp: Date.now() },
        { source: 'devtools', type: 'REPLAY_EVENT', timestamp: Date.now() },
        { source: 'devtools', type: 'GET_MEMORY', timestamp: Date.now() },
        { source: 'devtools', type: 'GET_PLUGINS', timestamp: Date.now() },
        { source: 'devtools', type: 'GET_SNAPSHOTS', timestamp: Date.now() },
        { source: 'devtools', type: 'SET_FILTER', timestamp: Date.now() },
      ]

      expect(commands).toHaveLength(10)
    })
  })

  describe('DevToolsResponse', () => {
    it('should have correct source type', () => {
      const response: DevToolsResponse = {
        source: 'backend',
        type: 'TABLES_LIST',
        timestamp: Date.now(),
      }

      expect(response.source).toBe('backend')
    })

    it('should support all response types', () => {
      const responses: DevToolsResponse[] = [
        { source: 'backend', type: 'TABLES_LIST', timestamp: Date.now() },
        { source: 'backend', type: 'STATE_UPDATE', timestamp: Date.now() },
        { source: 'backend', type: 'EVENT_LOGGED', timestamp: Date.now() },
        { source: 'backend', type: 'PERFORMANCE_UPDATE', timestamp: Date.now() },
        { source: 'backend', type: 'MEMORY_UPDATE', timestamp: Date.now() },
        { source: 'backend', type: 'PLUGIN_UPDATE', timestamp: Date.now() },
        { source: 'backend', type: 'TABLE_REGISTERED', timestamp: Date.now() },
        { source: 'backend', type: 'TABLE_UNREGISTERED', timestamp: Date.now() },
        { source: 'backend', type: 'COMMAND', timestamp: Date.now() },
        { source: 'backend', type: 'RESPONSE', timestamp: Date.now() },
      ]

      expect(responses).toHaveLength(10)
    })
  })

  describe('TableMetadata', () => {
    it('should have required fields', () => {
      const metadata: TableMetadata = {
        id: 'table1',
        rowCount: 10,
        columnCount: 5,
        state: { data: [] },
      }

      expect(metadata).toMatchObject({
        id: 'table1',
        rowCount: 10,
        columnCount: 5,
        state: expect.any(Object),
      })
    })

    it('should support optional fields', () => {
      const metadata: TableMetadata = {
        id: 'table1',
        rowCount: 10,
        columnCount: 5,
        state: { data: [] },
        performance: { timestamp: Date.now(), renderTime: 15 },
        memory: { timestamp: Date.now(), heapSize: 1000000 },
        options: { tableId: 'table1' },
      }

      expect(metadata.performance).toBeDefined()
      expect(metadata.memory).toBeDefined()
      expect(metadata.options).toBeDefined()
    })
  })

  describe('EventFilter', () => {
    it('should support all filter options', () => {
      const filter: EventFilter = {
        type: 'STATE_CHANGE',
        since: 1000,
        tableId: 'table1',
      }

      expect(filter).toMatchObject({
        type: 'STATE_CHANGE',
        since: 1000,
        tableId: 'table1',
      })
    })

    it('should allow partial filter', () => {
      const filter: EventFilter = {
        type: 'STATE_CHANGE',
      }

      expect(filter).toEqual({ type: 'STATE_CHANGE' })
    })
  })

  describe('PerformanceMetrics', () => {
    it('should have required fields', () => {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        renderTime: 15,
        memoryUsage: 5000000,
        eventCount: 42,
        components: [],
      }

      expect(metrics).toMatchObject({
        timestamp: expect.any(Number),
        renderTime: 15,
        memoryUsage: 5000000,
        eventCount: 42,
        components: expect.any(Array),
      })
    })
  })

  describe('MemorySnapshot', () => {
    it('should have required fields', () => {
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        heapSize: 10000000,
        trackedObjects: 500,
        leakedObjects: [],
      }

      expect(snapshot).toMatchObject({
        timestamp: expect.any(Number),
        heapSize: 10000000,
        trackedObjects: 500,
        leakedObjects: expect.any(Array),
      })
    })
  })

  describe('TableSnapshot', () => {
    it('should have required fields', () => {
      const snapshot: TableSnapshot = {
        timestamp: Date.now(),
        state: { data: [] },
        eventId: 'event1',
      }

      expect(snapshot).toMatchObject({
        timestamp: expect.any(Number),
        state: expect.any(Object),
        eventId: 'event1',
      })
    })
  })
})
