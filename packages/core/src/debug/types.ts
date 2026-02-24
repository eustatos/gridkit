/**
 * Advanced debugging types and interfaces for GridKit.
 * 
 * @packageDocumentation
 * @module @gridkit/core/debug
 */

import type { GridEvent } from '../events/types/base';
import type { TableState as GridKitTableState } from '../types/table/TableState';
import type { RowData } from '../types';

/**
 * Main debug configuration interface
 */
export interface DebugConfig {
  /** Enable/configure event debugging */
  events?: boolean | EventDebugConfig;
  /** Enable/configure performance debugging */
  performance?: boolean | PerformanceDebugConfig;
  /** Enable validation error logging */
  validation?: boolean;
  /** Enable/configure memory debugging */
  memory?: boolean | MemoryDebugConfig;
  /** Enable plugin activity logging */
  plugins?: boolean;
  /** Enable/configure time-travel debugging */
  timeTravel?: boolean | TimeTravelConfig;
  /** Debug output destination */
  output?: DebugOutput;
  /** Enable/configure browser DevTools extension */
  devtools?: boolean | DevToolsConfig;
}

/**
 * Event debugging configuration
 */
export interface EventDebugConfig {
  /** Enable event debugging */
  enabled: boolean;
  /** Filter function for events to log */
  filter?: (event: GridEvent) => boolean;
  /** Maximum number of events to store in history */
  maxHistory?: number;
  /** Include event payload in logs */
  includePayload?: boolean;
}

/**
 * Performance debugging configuration
 */
export interface PerformanceDebugConfig {
  /** Enable performance debugging */
  enabled: boolean;
  /** Operations to profile (empty = all) */
  operations?: string[];
  /** Performance threshold in ms */
  threshold?: number;
  /** Generate flame graph data */
  flamegraph?: boolean;
}

/**
 * Memory debugging configuration
 */
export interface MemoryDebugConfig {
  /** Enable memory debugging */
  enabled: boolean;
  /** Snapshot interval in ms */
  interval?: number;
  /** Track potential memory leaks */
  trackLeaks?: boolean;
  /** Create snapshot when leak detected */
  snapshotOnLeak?: boolean;
}

/**
 * Time travel debugging configuration
 */
export interface TimeTravelConfig {
  /** Enable time travel debugging */
  enabled: boolean;
  /** Maximum number of snapshots to keep */
  maxSnapshots?: number;
  /** Interval between automatic snapshots (ms) */
  snapshotInterval?: number;
}

/**
 * Browser DevTools extension configuration
 */
export interface DevToolsConfig {
  /** Enable DevTools extension */
  enabled: boolean;
  /** Port for DevTools communication */
  port?: number;
  /** Maximum number of events to buffer */
  maxEventBuffer?: number;
  /** Buffer interval in ms */
  bufferInterval?: number;
}

/**
 * Debug output destination
 */
export type DebugOutput = 'console' | 'file' | 'devtools' | 'custom';

/**
 * Table state snapshot for time travel
 */
export interface TableSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Event index at snapshot time */
  eventIndex: number;
  /** Table state */
  state: GridKitTableState<RowData>;
  /** Snapshot metadata */
  metadata: {
    /** Number of rows */
    rowCount: number;
    /** Number of columns */
    columnCount: number;
    /** Memory usage in bytes */
    memory: number;
  };
}

/**
 * Event filter function
 */
export type EventFilter = (event: GridEvent) => boolean;

/**
 * Profiling result
 */
export interface ProfilingResult<T = void> {
  /** Profile label */
  label: string;
  /** Total duration in ms */
  duration: number;
  /** Memory statistics */
  memory: {
    /** Memory before operation (bytes) */
    before: number;
    /** Memory after operation (bytes) */
    after: number;
    /** Memory change (bytes) */
    delta: number;
  };
  /** Individual operation profiles */
  operations: OperationProfile[];
  /** Function result (if any) */
  result?: T;
}

/**
 * Individual operation profile
 */
export interface OperationProfile {
  /** Operation name */
  name: string;
  /** Duration in ms */
  duration: number;
  /** Number of calls */
  calls: number;
  /** Child operations */
  children: OperationProfile[];
}

/**
 * Profiling session
 */
export interface ProfileSession {
  /** Session label */
  label: string;
  /** Start time */
  startTime: number;
  /** Start memory */
  startMemory: number;
  /** Operations stack */
  operations: OperationProfile[];
}

/**
 * Flame graph data structure
 */
export interface FlameGraph {
  /** Root node */
  root: FlameGraphNode;
  /** Total duration */
  totalDuration: number;
  /** Maximum depth */
  maxDepth: number;
}

/**
 * Flame graph node
 */
export interface FlameGraphNode {
  /** Node name */
  name: string;
  /** Node value (duration) */
  value: number;
  /** Child nodes */
  children: FlameGraphNode[];
}

/**
 * Profiling analysis result
 */
export interface ProfilingAnalysis {
  /** Total operations */
  totalOperations: number;
  /** Total duration */
  totalDuration: number;
  /** Average operation duration */
  averageDuration: number;
  /** Slowest operations */
  slowest: OperationProfile[];
  /** Most frequent operations */
  mostFrequent: OperationProfile[];
}

/**
 * Performance bottleneck
 */
export interface Bottleneck {
  /** Operation name */
  operation: string;
  /** Duration in ms */
  duration: number;
  /** Percentage of total time */
  percentage: number;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Profiler-specific bottleneck interface (extends Bottleneck)
 */
export interface ProfilerBottleneck extends Bottleneck {}

/**
 * Memory snapshot
 */
export interface MemorySnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Heap used (bytes) */
  heapUsed: number;
  /** Heap total (bytes) */
  heapTotal: number;
  /** External memory (bytes) */
  external: number;
  /** Object counts */
  objects: {
    /** Number of rows */
    rows: number;
    /** Number of columns */
    columns: number;
    /** Number of cells */
    cells: number;
    /** Number of subscriptions */
    subscriptions: number;
  };
}

/**
 * Memory difference between two snapshots
 */
export interface MemoryDiff {
  /** Time difference */
  timeDelta: number;
  /** Heap used difference */
  heapUsedDelta: number;
  /** Heap total difference */
  heapTotalDelta: number;
  /** External memory difference */
  externalDelta: number;
  /** Object count differences */
  objectDeltas: {
    rows: number;
    columns: number;
    cells: number;
    subscriptions: number;
  };
}

/**
 * Memory leak detection result
 */
export interface MemoryLeak {
  /** Leak type */
  type: 'row' | 'column' | 'subscription' | 'listener';
  /** Number of leaked objects */
  count: number;
  /** Estimated size in bytes */
  size: number;
  /** Weak references to leaked objects */
  objects: WeakRef<any>[];
  /** Leak severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Tracked object for leak detection
 */
export interface TrackedObject {
  /** Object label */
  label: string;
  /** Weak reference */
  ref: WeakRef<any>;
  /** Creation timestamp */
  created: number;
  /** Last accessed timestamp */
  lastAccessed: number;
}

/**
 * Memory growth report
 */
export interface MemoryGrowthReport {
  /** Time period (ms) */
  period: number;
  /** Total growth (bytes) */
  totalGrowth: number;
  /** Growth rate (bytes/ms) */
  growthRate: number;
  /** Growth by type */
  byType: Record<string, number>;
  /** Is growth concerning */
  isConcerning: boolean;
}

/**
 * Retained object (not garbage collected)
 */
export interface RetainedObject {
  /** Object type */
  type: string;
  /** Estimated size */
  size: number;
  /** Retention path */
  retentionPath: string[];
}

/**
 * Heap snapshot
 */
export interface HeapSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Total size */
  totalSize: number;
  /** Object types and counts */
  objectTypes: Record<string, number>;
  /** Retention paths */
  retentionPaths: string[][];
}

/**
 * Event replay options
 */
export interface ReplayOptions {
  /** Replay speed (1 = real-time, 2 = 2x speed) */
  speed?: number;
  /** Pause replay on error */
  pauseOnError?: boolean;
  /** Skip validation during replay */
  skipValidation?: boolean;
  /** Emit events during replay */
  emitEvents?: boolean;
}

/**
 * Complete debug information
 */
export interface DebugInfo {
  /** Debug configuration */
  config: DebugConfig;
  /** Event history */
  events: {
    total: number;
    recent: GridEvent[];
  };
  /** Performance metrics */
  performance: {
    profiles: ProfilingResult[];
    bottlenecks: Bottleneck[];
  };
  /** Memory statistics */
  memory: {
    current: MemorySnapshot;
    leaks: MemoryLeak[];
  };
  /** Time travel state */
  timeTravel: {
    snapshots: number;
    currentSnapshot: number;
  };
}

/**
 * Circular buffer for efficient snapshot storage
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private tail = 0;
  private size = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) {
      return undefined;
    }
    const actualIndex = (this.head + index) % this.capacity;
    return this.buffer[actualIndex];
  }

  getAll(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.capacity;
  }
}
