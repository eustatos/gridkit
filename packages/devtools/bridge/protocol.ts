// DevTools Communication Protocol

export interface DevToolsMessage {
  source: 'devtools' | 'backend' | 'content'
  type: string
  payload?: any
  tableId?: string
  timestamp: number
}

export interface DevToolsCommand extends DevToolsMessage {
  source: 'devtools'
  type:
    | 'GET_TABLES'
    | 'GET_STATE'
    | 'GET_EVENTS'
    | 'GET_PERFORMANCE'
    | 'TIME_TRAVEL'
    | 'REPLAY_EVENT'
    | 'GET_MEMORY'
    | 'GET_PLUGINS'
    | 'GET_SNAPSHOTS'
    | 'SET_FILTER'
}

export interface DevToolsResponse extends DevToolsMessage {
  source: 'backend'
  type:
    | 'TABLES_LIST'
    | 'STATE_UPDATE'
    | 'EVENT_LOGGED'
    | 'PERFORMANCE_UPDATE'
    | 'MEMORY_UPDATE'
    | 'PLUGIN_UPDATE'
    | 'TABLE_REGISTERED'
    | 'TABLE_UNREGISTERED'
    | 'COMMAND'
    | 'RESPONSE'
}

export interface DevToolsProtocol {
  sendCommand(command: DevToolsCommand): Promise<any>
  onResponse(handler: (response: DevToolsResponse) => void): () => void
  disconnect(): void
}

export interface TableMetadata {
  id: string
  rowCount: number
  columnCount: number
  state: any
  performance?: any
  memory?: any
  options?: any
}

export interface EventFilter {
  type?: string
  since?: number
  tableId?: string
}

export interface PerformanceMetrics {
  timestamp: number
  renderTime: number
  memoryUsage: number
  eventCount: number
  components: any[]
}

export interface MemorySnapshot {
  timestamp: number
  heapSize: number
  trackedObjects: number
  leakedObjects: any[]
}

export interface TableSnapshot {
  timestamp: number
  state: any
  eventId: string
}
