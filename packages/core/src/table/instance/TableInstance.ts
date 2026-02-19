import { createColumnRegistry } from '../../column';
import { createEventBus } from '../../events/core';
import { createPerformanceMonitor, type PerformanceMetrics } from '../../performance';
import { createRowFactory } from '../../row';
import { createStore } from '../../state';
import type { Table, ValidatedTableOptions, TableState, RowData, Column, GridId, RowId, RowModel, ColumnId, Row } from '../../types';
import { buildRowModel } from '../builders/model-builder';
import { buildInitialState } from '../builders/state-builder';

/**
 * Creates the table instance with proper memory management.
 * Uses weak references and cleanup systems.
 *
 * @template TData - Row data type (must extend RowData)
 * @param options - Validated table configuration
 * @returns Table instance
 */
function createTableInstance<TData extends RowData>(
  options: ValidatedTableOptions<TData>
): Table<TData> {
  // === State Management ===
  const initialState: TableState<TData> = buildInitialState(options);
  const stateStore = createStore<TableState<TData>>(initialState);

  // === Column System ===
  const columnRegistry = createColumnRegistry<TData>();
  // const columns = createColumns(options.columns, {
  //   table: null as any, // Will be set later
  //   registry: columnRegistry,
  //   defaultOptions: options.defaultColumn,
  // });

  // === Row System ===
  const rowFactory = createRowFactory({
    getRowId: options.getRowId as (row: RowData, index: number) => string,
    columnRegistry,
  });

  // === Event System ===
  // Enable devMode for debugging features
  const eventBus = createEventBus({
    devMode: Boolean(
      options.debug.events || options.debug.validation || options.debug.memory
    ),
  });

  // === Performance Monitoring ===
  const performanceMonitor = options.debug.performance
    ? createPerformanceMonitor({
        enabled: true,
        budgets: options.performanceBudgets,
      })
    : undefined;

  // === Build the Instance ===
  const instance: Table<TData> = {
    // Identification
    id: `table-${Date.now()}` as GridId,

    // State Management
    getState: () => stateStore.getState(),
    setState: (updater) => {
      const stop = performanceMonitor?.start('stateUpdate', {
        tableId: instance.id,
        operation: typeof updater === 'function' ? 'function' : 'direct',
      });

      try {
        stateStore.setState(updater);
      } finally {
        stop();
      }
    },
    subscribe: (listener) => stateStore.subscribe(listener as any),

    // Data Access
    getRowModel: (): RowModel<TData> => {
      const stop = performanceMonitor?.start('rowModelBuild', {
        tableId: instance.id,
        rowCount: stateStore.getState().data.length,
      });

      try {
        const model = buildRowModel({
          data: stateStore.getState().data as TData[],
          rowFactory,
          columnRegistry,
          table: instance,
        });
        return model as unknown as RowModel<TData>;
      } finally {
        stop();
      }
    },
    getRow: (id: RowId): Row<TData> | undefined => {
      const model = instance.getRowModel();
      return model.rowsById.get(id);
    },

    // Column Access
    getAllColumns: () => columnRegistry.getAll(),
    getVisibleColumns: () => {
      const state = stateStore.getState();
      return columnRegistry.getVisible(
        state.columnVisibility
      );
    },
    getColumn: (id: ColumnId) => columnRegistry.get<TData>(id),

    // Lifecycle
    reset: () => {
      stateStore.reset();
      eventBus.emit('table:reset', { tableId: instance.id });
    },
    destroy: () => {
      // Cleanup in reverse dependency order
      eventBus.emit('table:destroy', { tableId: instance.id });
      stateStore.destroy();
      columnRegistry.destroy();
      eventBus.clear();
      performanceMonitor?.clear();
    },

    // Metadata
    get options(): Readonly<Table<TData>['options']> {
      return Object.freeze(options);
    },
    get metrics(): PerformanceMetrics | undefined {
      return performanceMonitor?.getMetrics() as PerformanceMetrics | undefined;
    },
  };

  // Wire up circular dependencies
  columnRegistry.setTable(instance as any);

  return instance;
}

export { createTableInstance };
