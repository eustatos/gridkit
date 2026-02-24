// GridKit DevTools - Main Entry Point

// Bridge
export { devToolsBridge, DevToolsBridge } from '../bridge/DevToolsBridge'
export type {
  DevToolsProtocol,
  DevToolsMessage,
  DevToolsCommand,
  DevToolsResponse
} from '../bridge/protocol'

// Messages
export * from '../bridge/messages'

// Backend
export { devToolsBackend, DevToolsBackend } from '../backend/DevToolsBackend'
export { isGridKitTable, detectGridKitTables, setupAutoDetection, listenForTableEvents } from '../backend/detector'
export {
  useDevToolsTable,
  useAutoDetectDevTools,
  getDevToolsBackend,
  isDevToolsConnected,
  sendDevToolsCommand,
  setupDevTools,
  DevToolsTableOptions
} from '../backend/hooks'

// Types
export type {
  TableMetadata,
  EventFilter,
  PerformanceMetrics,
  MemorySnapshot,
  TableSnapshot
} from '../bridge/protocol'
