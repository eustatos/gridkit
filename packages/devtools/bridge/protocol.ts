// DevTools Communication Protocol

export interface DevToolsMessage {
  source?: 'devtools' | 'backend' | 'content';
  type: string;
  payload?: unknown;
  tableId?: string;
  timestamp?: number;
}

export interface DevToolsCommand extends DevToolsMessage {
  source?: 'devtools';
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
    | 'SET_FILTER';
}

export interface DevToolsResponse extends DevToolsMessage {
  source?: 'backend';
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
    // Command types for responses
    | 'GET_TABLES'
    | 'GET_STATE'
    | 'GET_EVENTS'
    | 'GET_PERFORMANCE'
    | 'TIME_TRAVEL'
    | 'REPLAY_EVENT'
    | 'GET_MEMORY'
    | 'GET_PLUGINS'
    | 'GET_SNAPSHOTS'
    | 'SET_FILTER';
}

export interface DevToolsProtocol {
  sendCommand(command: DevToolsCommand): Promise<unknown>;
  onResponse(handler: (response: DevToolsResponse) => void): () => void;
  disconnect(): void;
}

export interface TableMetadata {
  id: string;
  rowCount: number;
  columnCount: number;
  state: Record<string, unknown>;
  performance?: Record<string, unknown>;
  memory?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface EventFilter {
  type?: string;
  since?: number;
  tableId?: string;
}

export interface PerformanceMetrics {
  timestamp: number;
  tableId: string;
  renderCount: number;
  lastRenderDuration: number | null;
  averageRenderDuration: number | null;
  totalRenderTime: number;
  reRenderReason: string | null;
  memoryUsage?: number;
  eventCount?: number;
}

export interface MemorySnapshot {
  timestamp: number;
  heapSize: number;
  trackedObjects: number;
  leakedObjects: Array<Record<string, unknown>>;
}

export interface TableSnapshot {
  timestamp: number;
  state: Record<string, unknown>;
  eventId: string;
}

// Extension types - allow additional properties for commands
export interface ExtensionCommand extends DevToolsCommand {
  [key: string]: unknown;
}
