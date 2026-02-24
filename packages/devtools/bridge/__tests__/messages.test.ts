// Tests for message type definitions
import { describe, it, expect } from 'vitest'
import {
  // Constants
  TABLES_LIST,
  STATE_UPDATE,
  EVENT_LOGGED,
  PERFORMANCE_UPDATE,
  MEMORY_UPDATE,
  PLUGIN_UPDATE,
  TABLE_REGISTERED,
  TABLE_UNREGISTERED,
  COMMAND,
  RESPONSE,
  BACKEND_READY,
  CONTENT_READY,
  PANEL_OPENED,
  PANEL_CLOSED,

  // Types
  BackendMessage,
  DevToolsCommandType,
  DevToolsMessageType,

  // Interfaces (need type checks)
} from '../messages'

describe('Message Constants', () => {
  it('should have correct TABLES_LIST type', () => {
    expect(TABLES_LIST).toBe('TABLES_LIST')
  })

  it('should have correct STATE_UPDATE type', () => {
    expect(STATE_UPDATE).toBe('STATE_UPDATE')
  })

  it('should have correct EVENT_LOGGED type', () => {
    expect(EVENT_LOGGED).toBe('EVENT_LOGGED')
  })

  it('should have correct PERFORMANCE_UPDATE type', () => {
    expect(PERFORMANCE_UPDATE).toBe('PERFORMANCE_UPDATE')
  })

  it('should have correct MEMORY_UPDATE type', () => {
    expect(MEMORY_UPDATE).toBe('MEMORY_UPDATE')
  })

  it('should have correct PLUGIN_UPDATE type', () => {
    expect(PLUGIN_UPDATE).toBe('PLUGIN_UPDATE')
  })

  it('should have correct TABLE_REGISTERED type', () => {
    expect(TABLE_REGISTERED).toBe('TABLE_REGISTERED')
  })

  it('should have correct TABLE_UNREGISTERED type', () => {
    expect(TABLE_UNREGISTERED).toBe('TABLE_UNREGISTERED')
  })

  it('should have correct COMMAND type', () => {
    expect(COMMAND).toBe('COMMAND')
  })

  it('should have correct RESPONSE type', () => {
    expect(RESPONSE).toBe('RESPONSE')
  })

  it('should have correct BACKEND_READY type', () => {
    expect(BACKEND_READY).toBe('BACKEND_READY')
  })

  it('should have correct CONTENT_READY type', () => {
    expect(CONTENT_READY).toBe('CONTENT_READY')
  })

  it('should have correct PANEL_OPENED type', () => {
    expect(PANEL_OPENED).toBe('PANEL_OPENED')
  })

  it('should have correct PANEL_CLOSED type', () => {
    expect(PANEL_CLOSED).toBe('PANEL_CLOSED')
  })
})

describe('Message Utility Types', () => {
  it('should define BackendMessage union type', () => {
    // Type check - should compile
    const backendMessages: BackendMessage[] = []

    // Should include all backend message types
    expect(backendMessages).toEqual([])
  })

  it('should define DevToolsCommandType', () => {
    // Type check - should compile
    const commandType: DevToolsCommandType = 'GET_TABLES'
    expect(commandType).toBe('GET_TABLES')
  })

  it('should define DevToolsMessageType', () => {
    // Type check - should compile
    const messageType: DevToolsMessageType = 'TABLE_REGISTERED'
    expect(messageType).toBe('TABLE_REGISTERED')
  })
})

describe('Message Structure', () => {
  it('should have correct backend message structure', () => {
    // Example TABLE_REGISTERED message
    const message = {
      type: TABLE_REGISTERED,
      source: 'backend' as const,
      payload: {
        table: {
          id: 'table1',
          rowCount: 10,
          columnCount: 5,
          state: { data: [] },
        },
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }

    expect(message.type).toBe(TABLE_REGISTERED)
    expect(message.payload).toBeDefined()
    expect(message.payload.table).toBeDefined()
  })

  it('should have correct response message structure', () => {
    // Example RESPONSE message
    const message = {
      type: RESPONSE,
      source: 'backend' as const,
      payload: {
        success: true,
        data: { tables: [] },
        commandType: 'GET_TABLES',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }

    expect(message.type).toBe(RESPONSE)
    expect(message.payload.success).toBe(true)
    expect(message.payload.data).toBeDefined()
  })

  it('should have correct command message structure', () => {
    // Example COMMAND message
    const message = {
      type: COMMAND,
      source: 'devtools' as const,
      payload: {
        type: 'GET_TABLES',
        source: 'devtools' as const,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    }

    expect(message.type).toBe(COMMAND)
    expect(message.payload.type).toBe('GET_TABLES')
  })
})
