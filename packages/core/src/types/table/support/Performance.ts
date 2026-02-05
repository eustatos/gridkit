/**
 * Performance budgets for validation.
 */
export interface PerformanceBudgets {
  /** Maximum render time in milliseconds */
  readonly maxRenderTime?: number;

  /** Maximum state update time */
  readonly maxUpdateTime?: number;

  /** Maximum memory usage in MB */
  readonly maxMemoryUsage?: number;
}
