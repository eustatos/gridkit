/**
 * Performance Metrics Collection.
 *
 * Collects, aggregates, and reports performance metrics for GridKit tables.
 *
 * @module @gridkit/core/performance/metrics
 */

import type {
  TimingMetrics,
  PerformanceBudgets,
  BudgetViolation,
  Measurement,
} from '../types';
import { DEFAULT_BUDGETS } from '../types';

/**
 * Metrics aggregator for performance data.
 */
export class MetricsAggregator {
  private measurements = new Map<string, Measurement[]>();
  private budgets: Required<any>;
  private timings = {
    tableCreation: 0,
    stateUpdate: 0,
    rowModelBuild: 0,
    renderCycle: 0,
    eventProcessing: 0,
  };
  private memoryMetrics: any = {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    arrayBuffers: 0,
    peakHeapUsed: 0,
    allocations: 0,
    deallocations: 0,
    leakedBytes: 0,
  };
  private violations: BudgetViolation[] = [];

  constructor(budgets?: PerformanceBudgets) {
    this.budgets = {
      ...DEFAULT_BUDGETS,
      ...budgets,
    };
  }

  /**
   * Record a measurement.
   */
  recordMeasurement(
    operation: string,
    duration: number,
    memoryDelta: number,
    meta?: any
  ): void {
    const measurement: Measurement = {
      duration,
      memoryDelta,
      timestamp: performance.now(),
      meta,
    };

    let measurements = this.measurements.get(operation);
    if (!measurements) {
      measurements = [];
      this.measurements.set(operation, measurements);
    }

    measurements.push(measurement);

    // Limit stored samples
    const maxSamples = 1000;
    if (measurements.length > maxSamples) {
      measurements.shift();
    }
  }

  /**
   * Update timing metric.
   */
  updateTiming(name: keyof TimingMetrics, duration: number): void {
    (this.timings as any)[name] = duration;
  }

  /**
   * Update memory metric.
   */
  updateMemory(usage: number): void {
    this.memoryMetrics.heapUsed = usage;
    this.memoryMetrics.peakHeapUsed = Math.max(
      this.memoryMetrics.peakHeapUsed,
      usage
    );
  }

  /**
   * Add budget violation.
   */
  addViolation(violation: BudgetViolation): void {
    this.violations.push(violation);
    // Keep only last 100 violations
    if (this.violations.length > 100) {
      this.violations.shift();
    }
  }

  /**
   * Get current metrics.
   */
  getMetrics(): any {
    return {
      operations: this.computeOperationStats(),
      memory: this.memoryMetrics,
      timings: this.timings,
      budgets: this.budgets,
      violations: this.violations,
    };
  }

  /**
   * Get operation stats.
   */
  getOperationStats(operation: string): any {
    const measurements = this.measurements.get(operation) || [];
    return this.calculateStats(measurements);
  }

  /**
   * Check budget violations.
   */
  checkBudgets(): BudgetViolation[] {
    return this.violations;
  }

  /**
   * Clear all metrics.
   */
  clear(): void {
    this.measurements.clear();
    this.timings = {
      tableCreation: 0,
      stateUpdate: 0,
      rowModelBuild: 0,
      renderCycle: 0,
      eventProcessing: 0,
    };
    this.memoryMetrics = {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      peakHeapUsed: 0,
      allocations: 0,
      deallocations: 0,
      leakedBytes: 0,
    };
    this.violations = [];
  }

  // ===================================================================
  // Private Methods
  // ===================================================================

  private computeOperationStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [operation, measurements] of this.measurements.entries()) {
      stats[operation] = this.calculateStats(measurements);
    }

    return stats;
  }

  private calculateStats(measurements: Measurement[]): any {
    if (measurements.length === 0) {
      return { count: 0, totalTime: 0, avgTime: 0, minTime: 0, maxTime: 0, p95Time: 0, errors: 0, lastExecuted: 0 };
    }

    const durations = measurements.map((m) => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);

    const totalTime = durations.reduce((sum, d) => sum + d, 0);
    const count = measurements.length;
    const minTime = sorted[0];
    const maxTime = sorted[sorted.length - 1];
    const avgTime = totalTime / count;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95Time = sorted[p95Index] || maxTime;
    const lastExecuted = measurements[measurements.length - 1].timestamp;

    return {
      count,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      p95Time,
      errors: measurements.filter((m) => (m.meta as any)?.error).length,
      lastExecuted,
    };
  }
}

/**
 * Creates a metrics aggregator.
 */
export function createMetricsAggregator(budgets?: PerformanceBudgets): MetricsAggregator {
  return new MetricsAggregator(budgets);
}

/**
 * Format a number of bytes as a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format a number of milliseconds as a human-readable string.
 */
export function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Format a percentage as a human-readable string.
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
