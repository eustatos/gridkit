/**
 * Table Performance Integration.
 *
 * Integrates performance monitoring with table lifecycle and operations.
 *
 * @module @gridkit/core/performance/integration/table-performance
 */

import type { TableInstance } from '../../../table/instance/TableInstance';
import type { EnhancedPerformanceMonitor } from '../monitor/EnhancedPerformanceMonitor';
import type { BudgetViolation } from '../types/metrics';

/**
 * Integration layer between table and performance monitor.
 */
export class TablePerformanceIntegration {
  private table: TableInstance;
  private monitor: EnhancedPerformanceMonitor;
  private initialized = false;

  constructor(
    table: TableInstance,
    monitor: EnhancedPerformanceMonitor
  ) {
    this.table = table;
    this.monitor = monitor;
  }

  /**
   * Initialize the integration.
   */
  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.setupOperationTracking();
    this.setupEventListeners();
  }

  /**
   * Destroy the integration.
   */
  destroy(): void {
    this.initialized = false;
    this.monitor.clear();
  }

  // ===================================================================
  // Operation Tracking
  // ===================================================================

  /**
   * Track row model build operations.
   */
  trackRowModelBuild(): void {
    const operation = 'rowModelBuild';
    const start = performance.now();

    try {
      // The actual operation is wrapped at the table level
    } finally {
      const duration = performance.now() - start;
      const rowCount = this.table.getState().data.length;

      this.monitor.trackOperation(operation, duration, 0, {
        tableId: this.table.id,
        rowCount,
      });
    }
  }

  /**
   * Track sorting operations.
   */
  trackSorting(): void {
    const operation = 'sorting';
    const start = performance.now();

    try {
      // The actual operation is wrapped at the table level
    } finally {
      const duration = performance.now() - start;
      const rowCount = this.table.getState().data.length;

      this.monitor.trackOperation(operation, duration, 0, {
        tableId: this.table.id,
        rowCount,
      });
    }
  }

  /**
   * Track filtering operations.
   */
  trackFiltering(): void {
    const operation = 'filtering';
    const start = performance.now();

    try {
      // The actual operation is wrapped at the table level
    } finally {
      const duration = performance.now() - start;
      const rowCount = this.table.getState().data.length;

      this.monitor.trackOperation(operation, duration, 0, {
        tableId: this.table.id,
        rowCount,
      });
    }
  }

  /**
   * Track pagination operations.
   */
  trackPagination(): void {
    const operation = 'pagination';
    const start = performance.now();

    try {
      // The actual operation is wrapped at the table level
    } finally {
      const duration = performance.now() - start;
      const rowCount = this.table.getState().data.length;

      this.monitor.trackOperation(operation, duration, 0, {
        tableId: this.table.id,
        rowCount,
      });
    }
  }

  /**
   * Track selection operations.
   */
  trackSelection(): void {
    const operation = 'selection';
    const start = performance.now();

    try {
      // The actual operation is wrapped at the table level
    } finally {
      const duration = performance.now() - start;

      this.monitor.trackOperation(operation, duration, 0, {
        tableId: this.table.id,
      });
    }
  }

  /**
   * Track column resize operations.
   */
  trackColumnResize(): void {
    const operation = 'columnResize';
    const start = performance.now();

    try {
      // The actual operation is wrapped at the table level
    } finally {
      const duration = performance.now() - start;

      this.monitor.trackOperation(operation, duration, 0, {
        tableId: this.table.id,
      });
    }
  }

  // ===================================================================
  // Event Listeners
  // ===================================================================

  /**
   * Set up event listeners for budget violations.
   */
  private setupEventListeners(): void {
    // Budget violations are handled by the monitor
    // This method can be extended for custom event handling
  }

  /**
   * Handle a budget violation.
   */
  private handleBudgetViolation(violation: BudgetViolation): void {
    console.error(
      `[Performance] Budget violated for ${violation.operation}:`,
      `${violation.actual.toFixed(2)}ms > ${violation.budget.toFixed(2)}ms`,
      `(${violation.severity}, ${violation.impact})`
    );
  }

  // ===================================================================
  // Utility Methods
  // ===================================================================

  /**
   * Get table metrics.
   */
  getMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Check if integration is initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Create a table performance integration.
 */
export function createTablePerformanceIntegration(
  table: TableInstance,
  monitor: EnhancedPerformanceMonitor
): TablePerformanceIntegration {
  return new TablePerformanceIntegration(table, monitor);
}
