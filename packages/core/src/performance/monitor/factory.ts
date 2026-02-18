/**
 * Performance Monitor Factory.
 *
 * Creates performance monitors with zero-cost no-op implementation
 * when disabled, and full implementation when enabled.
 *
 * @module @gridkit/core/performance/monitor/factory
 */

import type { PerformanceConfig } from '../types';
import { PerformanceMonitorImpl } from './PerformanceMonitorImpl';
import { createNoopMonitor } from './NoopMonitor';

/**
 * Creates a performance monitor instance.
 * Zero-cost when disabled - all methods become no-ops.
 *
 * @param config - Performance monitor configuration
 * @returns Performance monitor instance
 *
 * @example
 * ```typescript
 * // Disabled (production)
 * const monitor = createPerformanceMonitor();
 *
 * // Enabled (development/debug)
 * const monitor = createPerformanceMonitor({
 *   enabled: true,
 *   budgets: { renderCycle: 16 },
 *   detectMemoryLeaks: true,
 * });
 * ```
 */
export function createPerformanceMonitor(config: PerformanceConfig = {}): any {
  const enabled = config.enabled ?? false;

  if (!enabled) {
    // Return no-op implementation with zero overhead
    return createNoopMonitor();
  }

  // Create enabled monitor with actual implementation
  return new PerformanceMonitorImpl(config);
}

/**
 * Get whether performance monitoring is enabled.
 *
 * @param monitor - Performance monitor instance
 * @returns True if monitoring is enabled
 */
export function isMonitorEnabled(monitor: any): boolean {
  // Check if the monitor has any measurable overhead
  // No-op monitor will return immediately
  const start = performance.now();
  const stop = monitor.start('test');
  stop();
  const duration = performance.now() - start;

  // If it took more than 0.001ms, it's not a no-op
  return duration > 0.001;
}
