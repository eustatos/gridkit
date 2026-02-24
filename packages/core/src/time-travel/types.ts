/**
 * Public types for SimpleTimeTravel
 */

import { Store } from "../types";

/**
 * Main TimeTravel API interface
 */
export interface TimeTravelAPI {
  /**
   * Capture current state as a snapshot
   * @param action Optional action name for the snapshot
   * @returns The created snapshot or undefined if capture failed
   */
  capture(action?: string): Snapshot | undefined;

  /**
   * Undo to previous snapshot
   * @returns True if undo was successful
   */
  undo(): boolean;

  /**
   * Redo to next snapshot
   * @returns True if redo was successful
   */
  redo(): boolean;

  /**
   * Check if undo is available
   */
  canUndo(): boolean;

  /**
   * Check if redo is available
   */
  canRedo(): boolean;

  /**
   * Jump to a specific snapshot by index
   * @param index Index in the history array (0-based)
   * @returns True if jump was successful
   */
  jumpTo(index: number): boolean;

  /**
   * Clear all history
   */
  clearHistory(): void;

  /**
   * Get complete history as an array of snapshots
   */
  getHistory(): Snapshot[];

  /**
   * Import external state
   * @param state State to import
   * @returns True if import was successful
   */
  importState(state: Record<string, unknown>): boolean;

  /**
   * Get current snapshot without storing
   */
  getCurrentSnapshot?(): Snapshot | null;

  /**
   * Compare two snapshots
   */
  compareSnapshots?(a: Snapshot, b: Snapshot): any;

  /**
   * Subscribe to history events
   */
  subscribe?(listener: (event: any) => void): () => void;

  /**
   * Pause auto-capture
   */
  pauseAutoCapture?(): void;

  /**
   * Resume auto-capture
   */
  resumeAutoCapture?(): void;

  /**
   * Check if time travel is in progress
   */
  isTraveling?(): boolean;

  /**
   * Dispose instance
   */
  dispose?(): void;
}

// ... остальные типы остаются без изменений ...
/**
 * Configuration options for TimeTravel
 */
export interface TimeTravelOptions {
  /** Maximum number of snapshots to keep in history (default: 50) */
  maxHistory?: number;

  /** Automatically capture snapshots on state changes (default: true) */
  autoCapture?: boolean;

  /** Initial atoms to track */
  atoms?: any[];

  /** Registry mode for atom storage */
  registryMode?: "global" | "isolated";

  /** Custom snapshot comparator */
  comparator?: (a: Snapshot, b: Snapshot) => boolean;

  /** Whether to enable compression for snapshots */
  compression?: boolean;

  /** Custom serializer for complex values */
  serializer?: (value: unknown) => unknown;

  /** Custom deserializer for complex values */
  deserializer?: (value: unknown) => unknown;
}

/**
 * Snapshot metadata
 */
export interface SnapshotMetadata {
  /** Timestamp when snapshot was created */
  timestamp: number;

  /** Optional action name */
  action?: string;

  /** Number of atoms in this snapshot */
  atomCount: number;

  /** Custom metadata fields */
  [key: string]: unknown;
}

/**
 * Snapshot state entry for a single atom
 */
export interface SnapshotStateEntry {
  /** Value of the atom */
  value: any;

  /** Type of the atom (primitive, computed, writable) */
  type: string;

  /** Name of the atom */
  name: string;

  /** Optional atom ID for reliable restoration */
  atomId?: string;
}

/**
 * Snapshot - a captured state at a point in time
 */
export interface Snapshot {
  /** Unique identifier */
  id: string;

  /** Captured state (atom name -> entry) */
  state: Record<string, SnapshotStateEntry>;

  /** Snapshot metadata */
  metadata: SnapshotMetadata;
}

/**
 * History event types
 */
export type HistoryEventType =
  | "capture"
  | "undo"
  | "redo"
  | "jump"
  | "clear"
  | "import"
  | "error";

/**
 * History event
 */
export interface HistoryEvent {
  /** Event type */
  type: HistoryEventType;

  /** Timestamp of the event */
  timestamp: number;

  /** Snapshot involved (if any) */
  snapshot?: Snapshot;

  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * History event listener
 */
export type HistoryEventListener = (event: HistoryEvent) => void;

/**
 * TimeTravel statistics
 */
export interface TimeTravelStats {
  /** Total number of snapshots */
  totalSnapshots: number;

  /** Number of undo operations performed */
  undoCount: number;

  /** Number of redo operations performed */
  redoCount: number;

  /** Number of jump operations performed */
  jumpCount: number;

  /** Number of captures performed */
  captureCount: number;

  /** Average snapshot size (in bytes) */
  averageSnapshotSize: number;

  /** Total memory usage estimate */
  totalMemoryUsage: number;

  /** Time range of history */
  timeRange?: {
    oldest: number;
    newest: number;
    span: number;
  };
}

/**
 * Store registry for atom tracking
 */
export interface StoreRegistry {
  /** The store instance */
  store: Store;

  /** Set of atom IDs associated with this store */
  atoms: Set<symbol>;
}

/**
 * Atom metadata for registry
 */
export interface AtomMetadata {
  /** Display name */
  name: string;

  /** Creation timestamp */
  createdAt: number;

  /** Atom type */
  type: "primitive" | "computed" | "writable";

  /** Custom metadata */
  [key: string]: unknown;
}

/**
 * TimeTravel middleware configuration
 */
export interface TimeTravelMiddlewareConfig {
  /** Enable/disable time travel */
  enabled?: boolean;

  /** Whitelist of atom names to track */
  whitelist?: string[];

  /** Blacklist of atom names to ignore */
  blacklist?: string[];

  /** Transform state before capture */
  transform?: (
    state: Record<string, SnapshotStateEntry>,
  ) => Record<string, SnapshotStateEntry>;

  /** Validate snapshot before storing */
  validate?: (snapshot: Snapshot) => boolean;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  /** Number of successful operations */
  success: number;

  /** Number of failed operations */
  failed: number;

  /** Error messages for failed operations */
  errors: string[];

  /** Resulting snapshots */
  snapshots: Snapshot[];
}

/**
 * Search criteria for history
 */
export interface HistorySearchCriteria {
  /** Search by action name */
  action?: string | RegExp;

  /** Search by time range */
  timeRange?: { start: number; end: number };

  /** Search by atom value */
  atomValue?: {
    name: string;
    value: unknown;
    operator?: "eq" | "neq" | "gt" | "lt" | "regex";
  };

  /** Search by snapshot ID */
  id?: string | string[];

  /** Custom filter function */
  filter?: (snapshot: Snapshot) => boolean;
}

/**
 * Search result
 */
export interface SearchResult {
  /** Matching snapshots */
  snapshots: Snapshot[];

  /** Total matches */
  total: number;

  /** Search metadata */
  metadata: {
    searchTime: number;
    criteria: HistorySearchCriteria;
    executionTime: number;
  };
}

/**
 * Export format for history
 */
export interface ExportFormat {
  /** Version of export format */
  version: "1.0";

  /** Export timestamp */
  exportedAt: number;

  /** Exported snapshots */
  snapshots: Snapshot[];

  /** Export metadata */
  metadata: {
    snapshotCount: number;
    timeRange: { from: number; to: number };
    atomNames: string[];
  };

  /** Optional compression info */
  compression?: {
    algorithm: string;
    originalSize: number;
    compressedSize: number;
  };
}
