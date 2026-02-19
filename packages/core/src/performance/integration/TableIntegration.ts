/**
 * Table Integration.
 *
 * Integrates performance monitoring with table lifecycle and operations.
 *
 * @module @gridkit/core/performance/integration/table
 */

import type { Table, TableOptions, RowData } from '@/types';

import { createPerformanceMonitor } from '../monitor/factory';
import type { PerformanceConfig } from '../types';


/**
 * Wrap a table with performance monitoring.
 *
 * @param table - Original table instance
 * @param config - Performance monitoring configuration
 * @returns Table with performance monitoring
 */
export function withPerformanceMonitoring<TData extends RowData>(
  table: Table<TData>,
  config?: PerformanceConfig
): Table<TData> {
  if (!config?.enabled) {
    return table;
  }

  const monitor = createPerformanceMonitor(config);

  // Wrap critical table methods
  const wrappedTable: Table<TData> = {
    // Forward all table properties
    ...table,

    // Wrap setState to monitor state updates
    setState: (updater) => {
      const stop = monitor.start('stateUpdate', {
        tableId: table.id,
        operation: typeof updater === 'function' ? 'function' : 'direct',
      });

      try {
        table.setState(updater);
      } finally {
        stop();
      }
    },

    // Wrap getRowModel to monitor row model builds
    getRowModel: () => {
      const state = table.getState();
      const stop = monitor.start('rowModelBuild', {
        tableId: table.id,
        rowCount: state.data.length,
      });

      try {
        const model = table.getRowModel();
        return model;
      } finally {
        stop();
      }
    },

    // Override destroy to clean up monitor
    destroy: () => {
      monitor.clear();
      table.destroy();
    },
  };

  return wrappedTable;
}

/**
 * Create a table with performance monitoring enabled.
 *
 * @param options - Table options with optional performance config
 * @returns Table instance with performance monitoring
 */
export function createTableWithPerformance<TData extends RowData>(
  options: TableOptions<TData> & { performance?: PerformanceConfig }
): Table<TData> {
  const { performance: perfConfig, ...tableOptions } = options;

  const table = createTableWithOptions(tableOptions);

  if (perfConfig?.enabled) {
    return withPerformanceMonitoring(table, perfConfig);
  }

  return table;
}

/**
 * Internal helper to create table with options.
 */
function createTableWithOptions<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // This would normally call createTable, but we need to avoid circular imports
  // For now, we'll use a placeholder
  throw new Error('createTableWithOptions not implemented');
}

/**
 * Add performance monitoring to an existing table.
 * This is a convenience wrapper around withPerformanceMonitoring.
 */
export function addPerformanceMonitoring<TData extends RowData>(
  table: Table<TData>,
  config: PerformanceConfig
): Table<TData> {
  return withPerformanceMonitoring(table, config);
}

/**
 * Remove performance monitoring from a table.
 * Returns the original table without monitoring.
 */
export function removePerformanceMonitoring<TData extends RowData>(
  _wrappedTable: Table<TData>,
  _originalTable: Table<TData>
): Table<TData> {
  return _originalTable;
}

/**
 * Get performance metrics from a table.
 */
export function getTableMetrics<TData extends RowData>(
  table: Table<TData>
): any {
  return (table as any).metrics;
}

/**
 * Check if a table has performance monitoring enabled.
 */
export function hasPerformanceMonitoring<TData extends RowData>(
  table: Table<TData>
): boolean {
  return (table as any).metrics !== undefined;
}
