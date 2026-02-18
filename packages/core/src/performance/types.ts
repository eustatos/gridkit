/**
 * Performance monitoring system types.
 *
 * Defines all interfaces, budgets, and metrics for GridKit's
 * zero-overhead performance monitoring system.
 *
 * @module @gridkit/core/performance/types
 */

import type { GridId } from '@/types';

// ===================================================================
// Performance Metrics Types
// ===================================================================

/**
 * Performance metrics collected by the monitor.
 */
export interface PerformanceMetrics {
  readonly operations: Record<string, OperationStats>;
  readonly memory: MemoryMetrics;
  readonly timings: TimingMetrics;
  readonly budgets: PerformanceBudgets;
  readonly violations: BudgetViolation[];
}

/**
 * Operation-specific statistics.
 */
export interface OperationStats {
  readonly count: number;
  readonly totalTime: number;
  readonly avgTime: number;
  readonly minTime: number;
  readonly maxTime: number;
  readonly p95Time: number;
  readonly errors: number;
  readonly lastExecuted: number;
}

/**
 * Memory usage metrics.
 */
export interface MemoryMetrics {
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
  readonly arrayBuffers: number;
  readonly peakHeapUsed: number;
  readonly allocations: number;
  readonly deallocations: number;
  readonly leakedBytes: number;
}

/**
 * Timing metrics for critical paths.
 */
export interface TimingMetrics {
  readonly tableCreation: number;
  readonly stateUpdate: number;
  readonly rowModelBuild: number;
  readonly renderCycle: number;
  readonly eventProcessing: number;
}

// ===================================================================
// Budget System Types
// ===================================================================

/**
 * Performance budgets for GridKit tables.
 * All values are in milliseconds unless specified.
 */
export interface PerformanceBudgets {
  // === Timing Budgets ===

  /** Maximum table creation time (ms) */
  readonly tableCreation?: number;

  /** Maximum state update time (ms) */
  readonly stateUpdate?: number;

  /** Maximum render cycle time (ms) - 60fps budget */
  readonly renderCycle?: number;

  /** Maximum row model build time (ms) */
  readonly rowModelBuild?: number;

  /** Maximum event processing time (ms) */
  readonly eventProcessing?: number;

  // === Memory Budgets ===

  readonly memory?: MemoryBudgets;

  // === Custom Operation Budgets ===

  readonly operations?: Record<string, number>;

  // === Thresholds ===

  /** Warning threshold (percentage of budget) */
  readonly warningThreshold?: number;

  /** Critical threshold (percentage of budget) */
  readonly criticalThreshold?: number;
}

/**
 * Memory usage budgets in bytes.
 */
export interface MemoryBudgets {
  /** Base framework overhead (bytes) */
  readonly baseOverhead: number;

  /** Memory per row (estimated) (bytes) */
  readonly perRow: number;

  /** Maximum memory increase per update (bytes) */
  readonly maxIncreasePerUpdate: number;

  /** Memory leak detection threshold (%) */
  readonly leakThreshold: number;
}

/**
 * Detected budget violation.
 */
export interface BudgetViolation {
  readonly type: 'timing' | 'memory' | 'custom';
  readonly operation: string;
  readonly actual: number;
  readonly budget: number;
  readonly percentage: number;
  readonly severity: 'warning' | 'critical';
  readonly timestamp: number;
  readonly context: ViolationContext;
}

/**
 * Context for budget violations.
 */
export interface ViolationContext {
  readonly tableId?: GridId;
  readonly rowCount?: number;
  readonly columnCount?: number;
  readonly operationData?: Record<string, unknown>;
  readonly stackTrace?: string;
}

// ===================================================================
// Memory Leak Detection Types
// ===================================================================

/**
 * Suspected memory leak detection.
 */
export interface SuspectedLeak {
  readonly category: string;
  readonly count: number;
  readonly expectedCount?: number;
  readonly growthRate: number;
  readonly firstSeen: number;
  readonly lastSeen: number;
  readonly sampleObjects: WeakRef<object>[];
}

/**
 * Leak detection statistics.
 */
export interface LeakDetectionStats {
  readonly trackedObjects: number;
  readonly collectedObjects: number;
  readonly retainedObjects: number;
  readonly suspectedLeaks: number;
  readonly categories: Record<string, CategoryStats>;
}

/**
 * Category-specific leak stats.
 */
export interface CategoryStats {
  readonly current: number;
  readonly peak: number;
  readonly collected: number;
  readonly growthRate: number;
}

// ===================================================================
// Configuration Types
// ===================================================================

/**
 * Performance monitor configuration.
 */
export interface PerformanceConfig {
  /** Enable/disable monitoring */
  readonly enabled?: boolean;

  /** Performance budgets */
  readonly budgets?: PerformanceBudgets;

  /** Enable memory leak detection */
  readonly detectMemoryLeaks?: boolean;

  /** Sampling rate (0-1) for high-frequency operations */
  readonly samplingRate?: number;

  /** Maximum number of stored samples per operation */
  readonly maxSamples?: number;

  /** Callback for budget violations */
  readonly onViolation?: (violation: BudgetViolation) => void;

  /** Custom metrics collectors */
  readonly collectors?: PerformanceCollector[];
}

/**
 * Custom performance metric collector.
 */
export interface PerformanceCollector {
  readonly name: string;
  collect(): Promise<MetricData> | MetricData;
}

/**
 * Metric data from custom collectors.
 */
export interface MetricData {
  [key: string]: number | string | boolean | null;
}

// ===================================================================
// Internal Types
// ===================================================================

/**
 * Measurement metadata.
 */
export interface OperationMeta {
  readonly tableId?: GridId;
  readonly rowCount?: number;
  readonly [key: string]: unknown;
}

/**
 * Single measurement sample.
 */
export interface Measurement {
  readonly duration: number;
  readonly memoryDelta: number;
  readonly timestamp: number;
  readonly meta?: OperationMeta;
}

// ===================================================================
// Default Values
// ===================================================================

/** Default performance budgets */
export const DEFAULT_BUDGETS: Required<PerformanceBudgets> = {
  tableCreation: 100,
  stateUpdate: 5,
  renderCycle: 16,
  rowModelBuild: 10,
  eventProcessing: 2,
  memory: {
    baseOverhead: 5 * 1024 * 1024, // 5MB
    perRow: 1024, // 1KB per row
    maxIncreasePerUpdate: 1024 * 1024, // 1MB
    leakThreshold: 20, // 20% increase
  },
  operations: {},
  warningThreshold: 0.8, // 80%
  criticalThreshold: 0.95, // 95%
};

/** Empty metrics object */
export const EMPTY_METRICS: PerformanceMetrics = {
  operations: {},
  memory: {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    arrayBuffers: 0,
    peakHeapUsed: 0,
    allocations: 0,
    deallocations: 0,
    leakedBytes: 0,
  },
  timings: {
    tableCreation: 0,
    stateUpdate: 0,
    rowModelBuild: 0,
    renderCycle: 0,
    eventProcessing: 0,
  },
  budgets: DEFAULT_BUDGETS,
  violations: [],
};

/** Empty operation stats */
export const EMPTY_STATS: OperationStats = {
  count: 0,
  totalTime: 0,
  avgTime: 0,
  minTime: 0,
  maxTime: 0,
  p95Time: 0,
  errors: 0,
  lastExecuted: 0,
};

/** Empty timing metrics */
export const EMPTY_TIMING_METRICS: TimingMetrics = {
  tableCreation: 0,
  stateUpdate: 0,
  rowModelBuild: 0,
  renderCycle: 0,
  eventProcessing: 0,
};

/** Empty memory metrics */
export const EMPTY_MEMORY_METRICS: MemoryMetrics = {
  heapUsed: 0,
  heapTotal: 0,
  external: 0,
  arrayBuffers: 0,
  peakHeapUsed: 0,
  allocations: 0,
  deallocations: 0,
  leakedBytes: 0,
};
