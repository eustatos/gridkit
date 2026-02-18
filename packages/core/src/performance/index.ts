/**
 * Performance Monitoring System.
 *
 * Zero-overhead performance monitoring for GridKit tables.
 * Collects metrics only when explicitly enabled via debug mode.
 *
 * @module @gridkit/core/performance
 */

// Types
export type {
  PerformanceMetrics,
  OperationStats,
  MemoryMetrics,
  TimingMetrics,
  PerformanceBudgets,
  MemoryBudgets,
  BudgetViolation,
  ViolationContext,
  SuspectedLeak,
  LeakDetectionStats,
  CategoryStats,
  PerformanceConfig,
  PerformanceCollector,
  MetricData,
  OperationMeta,
  Measurement,
} from './types';

// Budgets
export {
  BudgetValidatorImpl as BudgetValidator,
  BudgetViolationFactory,
  createDefaultBudgets,
  createBudgets,
} from './budgets/PerformanceBudgets';

// Monitor
export type { Unsubscribe } from './monitor/PerformanceMonitor';
export { PerformanceMonitorImpl } from './monitor/PerformanceMonitorImpl';
export { createNoopMonitor } from './monitor/NoopMonitor';
export { createPerformanceMonitor, isMonitorEnabled } from './monitor/factory';

// Memory
export { MemoryLeakDetectorImpl, createMemoryLeakDetector } from './memory/MemoryLeakDetector';
export { WeakObjectPool, SafeWeakRefTracker, createSafeWeakRefTracker, createWeakObjectPool } from './memory/WeakRefTracker';

// Metrics
export {
  MetricsAggregator,
  createMetricsAggregator,
  formatBytes,
  formatTime,
  formatPercentage,
} from './metrics/PerformanceMetrics';

// Integration
export {
  withPerformanceMonitoring,
  createTableWithPerformance,
  addPerformanceMonitoring,
  removePerformanceMonitoring,
  getTableMetrics,
  hasPerformanceMonitoring,
} from './integration/TableIntegration';
export {
  createEventPerformanceMonitor,
  createEventMonitoringMiddleware,
} from './integration/EventIntegration';

// Constants
export { DEFAULT_BUDGETS, EMPTY_METRICS, EMPTY_STATS } from './types';
