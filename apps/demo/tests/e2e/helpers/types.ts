/**
 * GridKit DevTools Extension Test Types
 * 
 * TypeScript interfaces for testing the GridKit DevTools browser extension.
 * Defines data structures for table inspection and extension panel interactions.
 */

/**
 * Result of table inspection by the extension
 */
export interface TableInspectionResult {
  /** Table ID */
  id: string;
  /** Table selector */
  selector: string;
  /** Table DOM element type */
  type: string;
  /** Number of columns */
  columnCount: number;
  /** Number of rows */
  rowCount: number;
  /** Column definitions */
  columns: ColumnDefinition[];
  /** Row data sample */
  rowData: Record<string, any>[];
  /** Table metadata */
  metadata: TableMetadata;
}

/**
 * Column definition from inspected table
 */
export interface ColumnDefinition {
  /** Column key/accessor */
  key: string;
  /** Column header text */
  header: string;
  /** Column width */
  width?: number;
  /** Is column visible */
  visible: boolean;
  /** Is column sortable */
  sortable: boolean;
  /** Is column filterable */
  filterable: boolean;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Metadata about the table
 */
export interface TableMetadata {
  /** Table element ID */
  id?: string;
  /** Table element class */
  class?: string;
  /** Timestamp when table was detected */
  detectedAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Is table currently in use */
  active: boolean;
}

/**
 * Data structure for extension panel
 */
export interface ExtensionPanelData {
  /** Extension version */
  version: string;
  /** Connected tables count */
  tablesCount: number;
  /** Currently selected table ID */
  selectedTableId?: string;
  /** Panel tab */
  activeTab: 'overview' | 'columns' | 'data' | 'events' | 'performance';
  /** Panel state */
  state: 'connected' | 'disconnected' | 'loading';
  /** Timestamp of last update */
  lastUpdate: number;
}

/**
 * Performance metrics from the extension
 */
export interface PerformanceMetrics {
  /** Page load time in milliseconds */
  loadTime: number;
  /** Table rendering time in milliseconds */
  renderTime: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Number of re-renders */
  reRenderCount: number;
  /** Average render time */
  avgRenderTime: number;
}

/**
 * Event logged by the extension
 */
export interface LoggedEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: string;
  /** Event timestamp */
  timestamp: number;
  /** Event source */
  source: string;
  /** Event payload */
  payload: any;
  /** Event metadata */
  metadata?: {
    /** Duration in milliseconds */
    duration?: number;
    /** Success flag */
    success?: boolean;
    /** Error message if any */
    error?: string;
  };
}

/**
 * Table state snapshot
 */
export interface TableStateSnapshot {
  /** Table ID */
  tableId: string;
  /** Current page index */
  pageIndex: number;
  /** Page size */
  pageSize: number;
  /** Total row count */
  totalRows: number;
  /** Filter state */
  filters: Record<string, any>[];
  /** Sort state */
  sorting: SortingState[];
  /** Selection state */
  selectedRowIds: string[];
  /** Expanded row IDs */
  expandedRowIds: string[];
}

/**
 * Sorting state
 */
export interface SortingState {
  /** Column ID */
  columnId: string;
  /** Sort direction */
  direction: 'asc' | 'desc' | null;
}

/**
 * Content script connection status
 */
export interface ContentScriptStatus {
  /** Is connected to backend */
  connected: boolean;
  /** Extension version */
  version: string;
  /** Registered message handlers count */
  messageHandlerCount: number;
  /** Detected tables count */
  detectedTablesCount: number;
}

/**
 * API response from extension
 */
export interface ExtensionApiResponse {
  /** Success flag */
  success: boolean;
  /** Response data */
  data?: any;
  /** Error message if any */
  error?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Large dataset for performance testing
 */
export interface LargeDatasetConfig {
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  columnCount: number;
  /** Row data structure */
  rowStructure: Record<string, any>;
}

/**
 * Extension message types
 */
export type ExtensionMessageType = 
  | 'GET_TABLES'
  | 'GET_STATE'
  | 'GET_EVENTS'
  | 'GET_METRICS'
  | 'TIME_TRAVEL'
  | 'EXPORT_CSV'
  | 'EXPORT_JSON'
  | 'RESET_METRICS'
  | 'COMMAND';

/**
 * Extension message
 */
export interface ExtensionMessage {
  /** Message type */
  type: ExtensionMessageType;
  /** Message payload */
  payload?: any;
  /** Message ID */
  messageId?: string;
  /** Timestamp */
  timestamp?: number;
}
