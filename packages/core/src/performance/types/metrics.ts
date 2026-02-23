/**
 * Enhanced Performance Metrics Types.
 *
 * Advanced metrics tracking, percentiles, and memory tracking extensions.
 *
 * @module @gridkit/core/performance/types/metrics
 */

// ===================================================================
// Enhanced Operation Metrics Types
// ===================================================================

/**
 * Extended operation metrics with percentiles.
 */
export interface OperationMetrics {
  /** Operation name */
  operation: string;
  /** Number of operations tracked */
  count: number;
  /** Average time in milliseconds */
  avgTime: number;
  /** Minimum time in milliseconds */
  minTime: number;
  /** Maximum time in milliseconds */
  maxTime: number;
  /** Total time in milliseconds */
  totalTime: number;
  /** 50th percentile (median) */
  p50: number;
  /** 95th percentile */
  p95: number;
  /** 99th percentile */
  p99: number;
  /** Last execution timestamp */
  lastExecuted: number;
  /** Error count */
  errors?: number;
}

/**
 * Memory metrics with leak detection.
 */
export interface MemoryMetrics {
  /** Heap used in bytes */
  heapUsed: number;
  /** Heap total in bytes */
  heapTotal: number;
  /** External memory in bytes */
  external: number;
  /** Array buffers in bytes */
  arrayBuffers: number;
  /** Leaked rows count */
  leakedRows: number;
  /** Leaked columns count */
  leakedColumns: number;
  /** Peak heap used */
  peakHeapUsed: number;
  /** Allocation count */
  allocations: number;
  /** Deallocation count */
  deallocations: number;
}

/**
 * Performance budget definition.
 */
export interface PerformanceBudget {
  /** Operation name */
  operation: string;
  /** Budget in milliseconds */
  budgetMs: number;
  /** Whether budget is enabled */
  enabled: boolean;
  /** Violation severity */
  severity: 'warning' | 'error' | 'critical';
}

/**
 * Budget violation record.
 */
export interface BudgetViolation {
  /** Operation that violated budget */
  operation: string;
  /** Actual duration in milliseconds */
  actual: number;
  /** Budget duration in milliseconds */
  budget: number;
  /** Severity level */
  severity: 'warning' | 'error' | 'critical';
  /** Timestamp of violation */
  timestamp: number;
  /** Impact assessment */
  impact: 'userVisible' | 'background';
  /** Percentage over budget */
  percentageOver: number;
}

/**
 * Memory leak detection result.
 */
export interface MemoryLeak {
  /** Category of leaked objects */
  category: string;
  /** Number of leaked objects */
  count: number;
  /** Estimated size in bytes */
  estimatedSize: number;
  /** Growth rate per second */
  growthRate: number;
  /** First seen timestamp */
  firstSeen: number;
  /** Last seen timestamp */
  lastSeen: number;
}

/**
 * Report generation options.
 */
export interface ReportOptions {
  /** Include detailed operation data */
  detailed?: boolean;
  /** Include memory analysis */
  memory?: boolean;
  /** Include budget analysis */
  budgets?: boolean;
  /** Time range (ms) for report */
  timeRange?: number;
}

/**
 * Performance report.
 */
export interface PerformanceReport {
  /** Report generation timestamp */
  timestamp: number;
  /** Summary statistics */
  summary: ReportSummary;
  /** Operation metrics */
  operations: Record<string, OperationMetrics>;
  /** Memory metrics */
  memory?: MemoryMetrics;
  /** Budget analysis */
  budgets?: ReportBudgetAnalysis;
  /** Detected leaks */
  leaks?: MemoryLeak[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Report summary.
 */
export interface ReportSummary {
  /** Total operations tracked */
  totalOperations: number;
  /** Operations with budget violations */
  budgetViolations: number;
  /** Average operation time */
  avgOperationTime: number;
  /** Max operation time */
  maxOperationTime: number;
  /** Memory usage */
  memoryUsage: number;
  /** Memory peak */
  memoryPeak: number;
}

/**
 * Budget analysis report.
 */
export interface ReportBudgetAnalysis {
  /** Budgets defined */
  budgets: PerformanceBudget[];
  /** Violations count */
  violations: number;
  /** Violations by severity */
  bySeverity: {
    warning: number;
    error: number;
    critical: number;
  };
  /** Overloaded operations */
  overloaded: string[];
  /** Efficient operations */
  efficient: string[];
}

/**
 * Alert destination type.
 */
export type AlertDestinationType = 'console' | 'sentry' | 'datadog' | 'newrelic' | 'custom';

/**
 * Alert destination interface.
 */
export interface AlertDestination {
  /** Unique identifier */
  id: string;
  /** Destination type */
  type: AlertDestinationType;
  /** Send alert */
  send(violation: BudgetViolation): Promise<void>;
  /** Get configuration */
  getConfig?(): Record<string, unknown>;
}

/**
 * Custom alert payload.
 */
export interface CustomAlertPayload {
  type: string;
  message: string;
  data: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}
