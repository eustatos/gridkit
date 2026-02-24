// Message Type Definitions

import {
  DevToolsMessage,
  DevToolsCommand,
  DevToolsResponse,
  TableMetadata,
  EventFilter,
  PerformanceMetrics,
  MemorySnapshot,
  TableSnapshot
} from './protocol'

// Backend -> DevTools Messages

export const TABLES_LIST: 'TABLES_LIST' = 'TABLES_LIST'

export interface TablesListMessage extends DevToolsResponse {
  type: typeof TABLES_LIST
  payload: {
    tables: TableMetadata[]
  }
}

export const STATE_UPDATE: 'STATE_UPDATE' = 'STATE_UPDATE'

export interface StateUpdateMessage extends DevToolsResponse {
  type: typeof STATE_UPDATE
  tableId: string
  payload: {
    state: any
    previousState?: any
  }
}

export const EVENT_LOGGED: 'EVENT_LOGGED' = 'EVENT_LOGGED'

export interface EventLoggedMessage extends DevToolsResponse {
  type: typeof EVENT_LOGGED
  tableId: string
  payload: {
    event: any
    timestamp: number
    correlationId?: string
  }
}

export const PERFORMANCE_UPDATE: 'PERFORMANCE_UPDATE' = 'PERFORMANCE_UPDATE'

export interface PerformanceUpdateMessage extends DevToolsResponse {
  type: typeof PERFORMANCE_UPDATE
  tableId: string
  payload: {
    metrics: PerformanceMetrics
    timestamp: number
  }
}

export const MEMORY_UPDATE: 'MEMORY_UPDATE' = 'MEMORY_UPDATE'

export interface MemoryUpdateMessage extends DevToolsResponse {
  type: typeof MEMORY_UPDATE
  tableId: string
  payload: {
    snapshot: MemorySnapshot
    leaks?: any[]
    timestamp: number
  }
}

export const PLUGIN_UPDATE: 'PLUGIN_UPDATE' = 'PLUGIN_UPDATE'

export interface PluginUpdateMessage extends DevToolsResponse {
  type: typeof PLUGIN_UPDATE
  tableId?: string
  payload: {
    plugins: any[]
    timestamp: number
  }
}

// Backend Events

export const TABLE_REGISTERED: 'TABLE_REGISTERED' = 'TABLE_REGISTERED'

export interface TableRegisteredMessage extends DevToolsResponse {
  type: typeof TABLE_REGISTERED
  payload: {
    table: TableMetadata
    timestamp: number
  }
}

export const TABLE_UNREGISTERED: 'TABLE_UNREGISTERED' = 'TABLE_UNREGISTERED'

export interface TableUnregisteredMessage extends DevToolsResponse {
  type: typeof TABLE_UNREGISTERED
  payload: {
    tableId: string
    timestamp: number
  }
}

// DevTools -> Backend Commands

export const COMMAND: 'COMMAND' = 'COMMAND'

export interface CommandMessage extends DevToolsMessage {
  type: typeof COMMAND
  payload: DevToolsCommand
}

export const RESPONSE: 'RESPONSE' = 'RESPONSE'

export interface ResponseMessage extends DevToolsMessage {
  type: typeof RESPONSE
  payload: {
    success: boolean
    data?: any
    error?: string
    commandType?: string
    timestamp: number
  }
}

// Content -> Backend Messages

export const BACKEND_READY: 'BACKEND_READY' = 'BACKEND_READY'

export interface BackendReadyMessage extends DevToolsMessage {
  source: 'content'
  type: typeof BACKEND_READY
}

export const CONTENT_READY: 'CONTENT_READY' = 'CONTENT_READY'

export interface ContentReadyMessage extends DevToolsMessage {
  source: 'content'
  type: typeof CONTENT_READY
}

// DevTools Panel Messages

export const PANEL_OPENED: 'PANEL_OPENED' = 'PANEL_OPENED'

export interface PanelOpenedMessage extends DevToolsMessage {
  source: 'devtools'
  type: typeof PANEL_OPENED
}

export const PANEL_CLOSED: 'PANEL_CLOSED' = 'PANEL_CLOSED'

export interface PanelClosedMessage extends DevToolsMessage {
  source: 'devtools'
  type: typeof PANEL_CLOSED
}

// Utility Types

export type BackendMessage =
  | TablesListMessage
  | StateUpdateMessage
  | EventLoggedMessage
  | PerformanceUpdateMessage
  | MemoryUpdateMessage
  | PluginUpdateMessage
  | TableRegisteredMessage
  | TableUnregisteredMessage

export type DevToolsCommandType = DevToolsCommand['type']
export type DevToolsMessageType = BackendMessage['type'] | ResponseMessage['type']