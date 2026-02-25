/**
 * Enhanced Performance Monitor.
 *
 * Advanced performance monitoring with percentiles, budget management,
 * alert destinations, and comprehensive metrics tracking.
 *
 * @module @gridkit/core/performance/monitor/enhanced
 */

import type {
  OperationMetrics,
  MemoryMetrics,
  PerformanceBudget,
  BudgetViolation,
  PerformanceMemoryLeak,
  PerformanceReportOptions,
  PerformanceReport,
  AlertDestination,
  PerformanceReportSummary,
  ReportBudgetAnalysis,
} from '../types/metrics';

import type { PerformanceMonitor } from '../monitor/PerformanceMonitor';

/**
 * Enhanced performance monitor with comprehensive tracking capabilities.
 */
export class EnhancedPerformanceMonitor implements PerformanceMonitor {
  private metrics = new Map<string, OperationMetrics>();
  private budgets = new Map<string, PerformanceBudget>();
  private alertDestinations = new Map<string, AlertDestination>();
  private measurements = new Map<string, number[]>();
  private enabled: boolean;
  private memoryMetrics: MemoryMetrics = {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    arrayBuffers: 0,
    leakedRows: 0,
    leakedColumns: 0,
    peakHeapUsed: 0,
    allocations: 0,
    deallocations: 0,
  };
  private memoryLeakCategories = new Map<string, number[]>();

  constructor(enabled: boolean = false) {
    this.enabled = enabled;
  }

  // ===================================================================
  // Measurement Methods (from PerformanceMonitor)
  // ===================================================================

  start(operation: string, meta?: any): () => void {
    if (!this.enabled) {
      return () => {};
    }

    const startTime = performance.now();
    const startMemory = this.measureMemoryUsage();

    return () => {
      const duration = performance.now() - startTime;
      const memoryDelta = this.measureMemoryUsage() - startMemory;

      this.trackOperation(operation, duration, memoryDelta, meta);
    };
  }

  measureMemory<T>(operation: () => T, context?: string): T {
    if (!this.enabled) {
      return operation();
    }

    const startMemory = this.measureMemoryUsage();
    this.memoryMetrics.allocations++;

    try {
      const result = operation();
      return result;
    } finally {
      const endMemory = this.measureMemoryUsage();
      const memoryDelta = endMemory - startMemory;

      if (context) {
        this.trackMemoryOperation(context, memoryDelta);
      }
    }
  }

  trackAsync<T>(promise: Promise<T>, operation: string): Promise<T> {
    if (!this.enabled) {
      return promise;
    }

    const startTime = performance.now();
    const startMemory = this.measureMemoryUsage();
    this.memoryMetrics.allocations++;

    return promise
      .then((result) => {
        const duration = performance.now() - startTime;
        const memoryDelta = this.measureMemoryUsage() - startMemory;

        this.trackOperation(operation, duration, memoryDelta);
        return result;
      })
      .catch((error) => {
        const duration = performance.now() - startTime;
        this.trackOperation(operation, duration, 0, { error: true });
        throw error;
      });
  }

  // ===================================================================
  // Metrics Tracking
  // ===================================================================

  /**
   * Track an operation execution.
   */
  trackOperation(operation: string, durationMs: number, memoryDelta: number = 0, meta?: any): void {
    if (!this.enabled) return;

    // Update measurements array
    let measurements = this.measurements.get(operation);
    if (!measurements) {
      measurements = [];
      this.measurements.set(operation, measurements);
    }
    measurements.push(durationMs);

    // Limit stored samples
    if (measurements.length > 1000) {
      measurements.shift();
    }

    // Update metrics
    this.updateOperationMetrics(operation, durationMs, meta);
    this.updateMemoryMetrics(memoryDelta);

    // Check budget
    this.checkBudget(operation, durationMs);
  }

  /**
   * Get operation statistics.
   */
  getOperationStats(operation: string): OperationMetrics | undefined {
    if (!this.enabled) return undefined;

    return this.metrics.get(operation);
  }

  /**
   * Get all operation statistics.
   */
  getAllStats(): OperationMetrics[] {
    if (!this.enabled) return [];

    return Array.from(this.metrics.values());
  }

  // ===================================================================
  // Budget Management
  // ===================================================================

  /**
   * Set a performance budget.
   */
  setBudget(budget: PerformanceBudget): void {
    if (!this.enabled) return;

    this.budgets.set(budget.operation, budget);
  }

  /**
   * Get a performance budget.
   */
  getBudget(operation: string): PerformanceBudget | undefined {
    return this.budgets.get(operation);
  }

  /**
   * Check if an operation exceeded its budget.
   */
  checkBudget(operation: string, durationMs: number): BudgetViolation | null {
    if (!this.enabled) return null;

    const budget = this.budgets.get(operation);
    if (!budget || !budget.enabled) return null;

    if (durationMs > budget.budgetMs) {
      const violation: BudgetViolation = {
        operation,
        actual: durationMs,
        budget: budget.budgetMs,
        severity: budget.severity,
        timestamp: Date.now(),
        impact: this.assessImpact(operation, durationMs),
        percentageOver: (durationMs / budget.budgetMs - 1) * 100,
      };

      this.sendViolation(violation);
      return violation;
    }

    return null;
  }

  /**
   * Assess impact of a violation.
   */
  private assessImpact(operation: string, durationMs: number): 'userVisible' | 'background' {
    const userVisibleOps = [
      'renderCycle',
      'rowModelBuild',
      'sorting',
      'filtering',
      'selection',
      'pagination',
    ];

    const isUserVisible = userVisibleOps.some((op) => operation.includes(op));
    const isSlow = durationMs > 100;

    return isUserVisible && isSlow ? 'userVisible' : 'background';
  }

  /**
   * Send violation to all alert destinations.
   */
  private sendViolation(violation: BudgetViolation): void {
    this.alertDestinations.forEach((destination) => {
      destination.send(violation).catch((error) => {
        console.error(`Failed to send alert to ${destination.id}:`, error);
      });
    });
  }

  // ===================================================================
  // Memory Tracking
  // ===================================================================

  /**
   * Track memory usage.
   */
  trackMemoryUsage(): void {
    if (!this.enabled) return;

    this.memoryMetrics.heapUsed = this.measureMemoryUsage();
    this.memoryMetrics.heapTotal = this.memoryMetrics.heapUsed * 2;
    this.memoryMetrics.external = 0;
    this.memoryMetrics.arrayBuffers = 0;
  }

  /**
   * Get memory metrics.
   */
  getMemoryMetrics(): MemoryMetrics {
    if (!this.enabled) {
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
        leakedRows: 0,
        leakedColumns: 0,
        peakHeapUsed: 0,
        allocations: 0,
        deallocations: 0,
      };
    }

    return { ...this.memoryMetrics };
  }

  /**
   * Detect memory leaks.
   */
  detectPerformanceMemoryLeaks(): PerformanceMemoryLeak[] {
    if (!this.enabled) return [];

    const leaks: PerformanceMemoryLeak[] = [];

    for (const [category, durations] of this.memoryLeakCategories.entries()) {
      if (durations.length < 2) continue;

      const growthRate = this.calculateGrowthRate(durations);
      if (growthRate > 0.1) {
        leaks.push({
          category,
          count: durations.length,
          estimatedSize: durations.length * 1024, // Estimate 1KB per object
          growthRate,
          firstSeen: durations[0],
          lastSeen: durations[durations.length - 1],
        });
      }
    }

    return leaks;
  }

  // ===================================================================
  // Alert Destinations
  // ===================================================================

  /**
   * Add an alert destination.
   */
  addAlertDestination(destination: AlertDestination): void {
    if (!this.enabled) return;

    this.alertDestinations.set(destination.id, destination);
  }

  /**
   * Remove an alert destination.
   */
  removeAlertDestination(id: string): void {
    this.alertDestinations.delete(id);
  }

  // ===================================================================
  // Reports
  // ===================================================================

  /**
   * Generate a performance report.
   */
  generateReport(options: PerformanceReportOptions = {}): PerformanceReport {
    if (!this.enabled) {
      return {
        timestamp: Date.now(),
        summary: {
          totalOperations: 0,
          budgetViolations: 0,
          avgOperationTime: 0,
          maxOperationTime: 0,
          memoryUsage: 0,
          memoryPeak: 0,
        },
        operations: {},
        recommendations: [],
      };
    }

    const operations = this.computeOperationMetrics();
    const violations = this.countViolations();
    const memory = this.getMemoryMetrics();
    const leaks = this.detectPerformanceMemoryLeaks();

    return {
      timestamp: Date.now(),
      summary: this.computeSummary(operations, violations, memory),
      operations,
      memory,
      budgets: this.computeBudgetAnalysis(),
      leaks,
      recommendations: this.generateRecommendations(operations, memory, leaks),
    };
  }

  /**
   * Export metrics to JSON or CSV.
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (!this.enabled) return format === 'json' ? '{}' : '';

    const metrics = this.generateReport();

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }

    return this.convertToCSV(metrics);
  }

  // ===================================================================
  // Configuration
  // ===================================================================

  clear(): void {
    this.metrics.clear();
    this.measurements.clear();
    this.budgets.clear();
    this.memoryMetrics = {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      leakedRows: 0,
      leakedColumns: 0,
      peakHeapUsed: 0,
      allocations: 0,
      deallocations: 0,
    };
    this.memoryLeakCategories.clear();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // ===================================================================
  // Event System (from PerformanceMonitor)
  // ===================================================================

  on(
    event: 'budgetViolation' | 'metricUpdate',
    handler: (data: any) => void
  ): () => void {
    // Basic event implementation
    // In production, use EnhancedEventBus for full event system
    return () => {};
  }

  getMetrics(): any {
    if (!this.enabled) return null;

    return {
      operations: this.computeOperationMetrics(),
      memory: this.getMemoryMetrics(),
      budgets: Array.from(this.budgets.values()),
    };
  }

  checkBudgets(): any[] {
    if (!this.enabled) return [];

    const violations: any[] = [];
    const now = Date.now();

    this.metrics.forEach((metric, operation) => {
      const budget = this.budgets.get(operation);
      if (budget && budget.enabled && metric.avgTime > budget.budgetMs) {
        violations.push({
          type: 'timing' as const,
          operation,
          actual: metric.avgTime,
          budget: budget.budgetMs,
          severity: budget.severity,
          timestamp: now,
          context: {},
        });
      }
    });

    return violations;
  }

  setBudgets(budgets: any): void {
    if (!this.enabled) return;

    budgets.forEach((budget: PerformanceBudget) => {
      this.budgets.set(budget.operation, budget);
    });
  }

  // ===================================================================
  // Private Methods
  // ===================================================================

  private updateOperationMetrics(operation: string, duration: number, meta?: any): void {
    const current = this.metrics.get(operation);
    const measurements = this.measurements.get(operation) || [];

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = measurements.length;
    const totalTime = measurements.reduce((sum, d) => sum + d, 0);
    const minTime = sorted[0] || 0;
    const maxTime = sorted[sorted.length - 1] || 0;
    const avgTime = count > 0 ? totalTime / count : 0;
    const p50Index = Math.floor(count * 0.5);
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);
    const p50 = sorted[p50Index] || 0;
    const p95 = sorted[p95Index] || 0;
    const p99 = sorted[p99Index] || 0;
    const errors = meta?.error ? 1 : 0;

    this.metrics.set(operation, {
      operation,
      count,
      avgTime,
      minTime,
      maxTime,
      totalTime,
      p50,
      p95,
      p99,
      lastExecuted: Date.now(),
      errors,
    });
  }

  private updateMemoryMetrics(delta: number): void {
    this.memoryMetrics.allocations++;
    this.memoryMetrics.heapUsed = Math.max(0, this.memoryMetrics.heapUsed + delta);
    this.memoryMetrics.peakHeapUsed = Math.max(
      this.memoryMetrics.peakHeapUsed,
      this.memoryMetrics.heapUsed
    );
  }

  private trackMemoryOperation(operation: string, memoryDelta: number): void {
    let durations = this.memoryLeakCategories.get(operation);
    if (!durations) {
      durations = [];
      this.memoryLeakCategories.set(operation, durations);
    }
    durations.push(performance.now());
  }

  private computeOperationMetrics(): Record<string, OperationMetrics> {
    const result: Record<string, OperationMetrics> = {};

    this.metrics.forEach((metric, operation) => {
      result[operation] = { ...metric };
    });

    return result;
  }

  private computeSummary(
    operations: Record<string, OperationMetrics>,
    violations: number,
    memory: MemoryMetrics
  ): PerformanceReportSummary {
    const allTimes = Object.values(operations).map((m) => m.avgTime);
    const avgTime = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
    const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 0;

    return {
      totalOperations: Object.keys(operations).length,
      budgetViolations: violations,
      avgOperationTime: avgTime,
      maxOperationTime: maxTime,
      memoryUsage: memory.heapUsed,
      memoryPeak: memory.peakHeapUsed,
    };
  }

  private countViolations(): number {
    let count = 0;
    this.metrics.forEach((metric, operation) => {
      const budget = this.budgets.get(operation);
      if (budget && metric.avgTime > budget.budgetMs) {
        count++;
      }
    });
    return count;
  }

  private computeBudgetAnalysis(): ReportBudgetAnalysis | undefined {
    if (this.budgets.size === 0) return undefined;

    const bySeverity = { warning: 0, error: 0, critical: 0 };
    const overloaded: string[] = [];
    const efficient: string[] = [];

    this.budgets.forEach((budget, operation) => {
      const metric = this.metrics.get(operation);
      if (metric && metric.avgTime > budget.budgetMs) {
        overloaded.push(operation);
        bySeverity[budget.severity]++;
      } else if (metric && metric.avgTime < budget.budgetMs * 0.5) {
        efficient.push(operation);
      }
    });

    return {
      budgets: Array.from(this.budgets.values()),
      violations: Object.values(bySeverity).reduce((a, b) => a + b, 0),
      bySeverity,
      overloaded,
      efficient,
    };
  }

  private generateRecommendations(
    operations: Record<string, OperationMetrics>,
    memory: MemoryMetrics,
    leaks: PerformanceMemoryLeak[]
  ): string[] {
    const recommendations: string[] = [];

    // Budget recommendations
    Object.entries(operations).forEach(([operation, metric]) => {
      const budget = this.budgets.get(operation);
      if (budget && metric.avgTime > budget.budgetMs * 1.5) {
        recommendations.push(
          `Consider optimizing ${operation}: avg ${metric.avgTime.toFixed(2)}ms (budget: ${budget.budgetMs}ms)`
        );
      }
    });

    // Memory recommendations
    if (memory.heapUsed > 10 * 1024 * 1024) {
      recommendations.push('High memory usage detected. Consider pagination or virtualization.');
    }

    if (leaks.length > 0) {
      recommendations.push(`Memory leaks detected in ${leaks.length} category/categories.`);
    }

    // General recommendations
    if (Object.keys(operations).length === 0) {
      recommendations.push('No operations tracked yet. Enable performance monitoring.');
    }

    return recommendations;
  }

  private convertToCSV(report: PerformanceReport): string {
    const rows: string[] = [];

    rows.push('Operation,Count,AvgTime,MinTime,MaxTime,P50,P95,P99,TotalTime,LastExecuted');

    Object.entries(report.operations).forEach(([operation, metric]) => {
      rows.push(
        `${operation},${metric.count},${metric.avgTime.toFixed(2)},${metric.minTime.toFixed(2)},${metric.maxTime.toFixed(2)},${metric.p50.toFixed(2)},${metric.p95.toFixed(2)},${metric.p99.toFixed(2)},${metric.totalTime.toFixed(2)},${metric.lastExecuted}`
      );
    });

    return rows.join('\n');
  }

  private calculateGrowthRate(durations: number[]): number {
    if (durations.length < 2) return 0;

    const first = durations[0];
    const last = durations[durations.length - 1];
    const timeSpan = last - first;

    if (timeSpan <= 0) return 0;

    return (durations.length / timeSpan) * 1000;
  }

  private measureMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      try {
        const usage = process.memoryUsage();
        return usage.heapUsed + usage.external + usage.arrayBuffers;
      } catch {
        // Fall back to placeholder
      }
    }
    return 0;
  }
}
