/**
 * Debug configuration options.
 */
export interface DebugOptions {
  /** Log state changes to console */
  readonly logStateChanges?: boolean;

  /** Log performance metrics */
  readonly logPerformance?: boolean;

  /** Validate state on every change */
  readonly validateState?: boolean;

  /** Enable DevTools integration */
  readonly devTools?: boolean;
}

/**
 * Performance metrics (debug mode only).
 */
export interface TableMetrics {
  /** Total render count */
  readonly renderCount: number;

  /** Average render time */
  readonly avgRenderTime: number;

  /** Peak memory usage */
  readonly peakMemory: number;

  /** State update count */
  readonly updateCount: number;
}
