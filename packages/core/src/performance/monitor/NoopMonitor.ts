/**
 * No-Op Performance Monitor.
 *
 * Zero-cost implementation that returns immediately without measurement.
 * Used when performance monitoring is disabled in production.
 *
 * @module @gridkit/core/performance/monitor/noop
 */

import type { PerformanceMetrics, OperationStats, BudgetViolation } from '../types';
import { EMPTY_METRICS, EMPTY_STATS } from '../types';

/**
 * Create a no-op monitor for production environments.
 * All methods return immediately with no overhead.
 */
export function createNoopMonitor(): any {
  return {
    // === Measurement ===

    start() {
      return () => {};
    },

    measureMemory<T>(operation: () => T): T {
      return operation();
    },

    trackAsync<T>(promise: Promise<T>): Promise<T> {
      return promise;
    },

    // === Metrics Access ===

    getMetrics(): PerformanceMetrics {
      return EMPTY_METRICS;
    },

    getOperationStats(): OperationStats {
      return EMPTY_STATS;
    },

    checkBudgets(): BudgetViolation[] {
      return [];
    },

    // === Configuration ===

    setBudgets(): void {
      // No-op
    },

    clear(): void {
      // No-op
    },

    setEnabled(): void {
      // No-op
    },

    // === Event System ===

    on(): () => void {
      return () => {};
    },
  };
}
