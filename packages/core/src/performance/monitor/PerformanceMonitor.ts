/**
 * Performance Monitor Interface.
 *
 * Zero-overhead performance monitor for GridKit tables.
 * Collects metrics only when explicitly enabled via debug mode.
 *
 * @module @gridkit/core/performance/monitor
 */

/**
 * Unsubscribe function type.
 */
export type Unsubscribe = () => void;

/**
 * Performance monitor interface.
 */
export interface PerformanceMonitor {
  // === Measurement ===

  /**
   * Start timing an operation with optional metadata.
   * Returns cleanup function that records duration.
   */
  start(operation: string, meta?: any): () => void;

  /**
   * Measure memory usage delta for an operation.
   */
  measureMemory<T>(operation: () => T, context?: string): T;

  /**
   * Track async operation with Promise wrapper.
   */
  trackAsync<T>(promise: Promise<T>, operation: string): Promise<T>;

  // === Metrics Access ===

  /**
   * Get current performance metrics snapshot.
   */
  getMetrics(): any;

  /**
   * Get operation-specific statistics.
   */
  getOperationStats(operation: string): any;

  /**
   * Check if any performance budgets are violated.
   */
  checkBudgets(): any[];

  // === Configuration ===

  /**
   * Update performance budgets at runtime.
   */
  setBudgets(budgets: any): void;

  /**
   * Clear all collected metrics.
   */
  clear(): void;

  /**
   * Enable/disable monitoring at runtime.
   */
  setEnabled(enabled: boolean): void;

  // === Event System ===

  /**
   * Subscribe to performance events.
   */
  on(
    event: 'budgetViolation' | 'metricUpdate',
    handler: (data: any) => void
  ): Unsubscribe;
}
