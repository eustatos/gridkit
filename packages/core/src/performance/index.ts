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

// Metrics types (enhanced)
export type {
  OperationMetrics,
  MemoryMetrics as EnhancedMemoryMetrics,
  PerformanceBudget,
  BudgetViolation as EnhancedBudgetViolation,
  PerformanceMemoryLeak,
  PerformanceReportOptions,
  PerformanceReport,
  PerformanceReportSummary,
  ReportBudgetAnalysis,
  AlertDestination,
  AlertDestinationType,
  CustomAlertPayload,
} from './types/metrics';

// Budgets
export {
  BudgetValidatorImpl as BudgetValidator,
  BudgetViolationFactory,
  createDefaultBudgets,
  createBudgets,
} from './budgets/PerformanceBudgets';

// Budget presets
export {
  FRAME_BUDGET,
  INTERACTIVE_BUDGETS,
  RENDERING_BUDGETS,
  BACKGROUND_BUDGETS,
  STRICT_BUDGETS,
  RELAXED_BUDGETS,
  DEFAULT_BUDGETS,
  createBudgets as createBudgetsFromConfig,
  createBudgetPreset,
  createCustomBudgets,
} from './budgets/presets';

// Monitor
export type { Unsubscribe } from './monitor/PerformanceMonitor';
export { PerformanceMonitorImpl } from './monitor/PerformanceMonitorImpl';
export { createNoopMonitor } from './monitor/NoopMonitor';
export { createPerformanceMonitor, isMonitorEnabled } from './monitor/factory';

// Enhanced Monitor
export { EnhancedPerformanceMonitor } from './monitor/EnhancedPerformanceMonitor';

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

// Table performance integration
export {
  TablePerformanceIntegration,
  createTablePerformanceIntegration,
} from './integration/TablePerformanceIntegration';

// Alert destinations
export {
  BaseAlertDestination,
  ConsoleAlertDestination,
  createConsoleAlertDestination,
  SentryAlertDestination,
  createSentryAlertDestination,
  DataDogAlertDestination,
  createDataDogAlertDestination,
  NewRelicAlertDestination,
  createNewRelicAlertDestination,
} from './alerts';

// Constants
export { EMPTY_METRICS, EMPTY_STATS } from './types';

