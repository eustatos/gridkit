import { createColumnRegistry, createColumns } from '../../column';
import { createEventBus } from '../../events/core';
import { createPerformanceMonitor, type PerformanceMetrics } from '../../performance';
import { createRowFactory } from '../../row';
import { createStore } from '../../state';
import type { Table, ValidatedTableOptions, TableState, RowData, Column, GridId, RowId, RowModel, ColumnId, Row } from '../../types';
import { buildRowModel } from '../builders/model-builder';
import { buildInitialState } from '../builders/state-builder';
import { shallowEqual } from '../../state/utils/equality';

/**
 * Creates the table instance with proper memory management.
 * Uses weak references and cleanup systems.
 *
 * @template TData - Row data type (must extend RowData)
 * @param options - Validated table configuration
 * @returns Fully initialized, memory-safe table instance
 */
function createTableInstance<TData extends RowData>(
  options: ValidatedTableOptions<TData>
): Table<TData> {
  // === State Management ===
  const initialState: TableState<TData> = buildInitialState(options);
  const stateStore = createStore<TableState<TData>>(initialState);

  // === Column System ===
  const columnRegistry = createColumnRegistry<TData>();

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

  // Table ID (can be nullified on destroy for memory safety)
  let tableId: GridId | null = `table-${Date.now()}` as GridId;

  // === Build a partial instance first (for column creation) ===
  // We need to create columns BEFORE the full instance so that
  // the row factory has access to registered columns
  const partialInstance: Table<TData> = {
    // Identification
    get id(): GridId {
      return tableId as GridId;
    },

    // State Management (stubbed for now)
    getState: () => stateStore.getState(),
    setState: () => {},
    subscribe: () => () => {},

    // Data Access (stubbed for now)
    getRowModel: () => {
      throw new Error('getRowModel not yet initialized - columns not created');
    },
    getRow: () => undefined,

    // Column Access (stubbed for now)
    getAllColumns: () => [],
    getVisibleColumns: () => [],
    getColumn: () => undefined,

    // Header Groups
    getHeaderGroups: () => [],

    // Lifecycle
    reset: () => {},
    destroy: () => {},

    // Metadata
    get options(): Readonly<Table<TData>['options']> {
      return Object.freeze(options);
    },
    get metrics(): PerformanceMetrics | undefined {
      return performanceMonitor?.getMetrics() as PerformanceMetrics | undefined;
    },

    // Internal properties
    _internal: {
      eventBus,
      performanceMonitor,
    },
  };

  // Wire up circular dependencies
  // Set table reference on registry
  columnRegistry.setTable(partialInstance as any);

  // === Row System ===
  const rowFactory = createRowFactory({
    getRowId: options.getRowId as (row: RowData, index: number) => string,
    columnRegistry,
  });

  // Now create and register all columns (before building full instance)
  const columns = createColumns({
    columnDefs: options.columns,
    table: partialInstance,
    registry: columnRegistry,
  });

  // === Build the Full Instance (with columns now registered) ===
  const instance: Table<TData> = {
    // Identification
    get id(): GridId {
      return tableId as GridId;
    },

    // State Management
    getState: () => stateStore.getState(),
    setState: (updater) => {
      const stop = performanceMonitor?.start('stateUpdate', {
        tableId: instance.id,
        operation: typeof updater === 'function' ? 'function' : 'direct',
      });

      try {
        const prev = stateStore.getState();
        const newState = stateStore.setState(updater);
        const updatedState = stateStore.getState();
        
        // Emit state update event
        eventBus.emit('state:update', {
          tableId: instance.id,
          timestamp: Date.now(),
          newState: updatedState,
        });

        // Emit specific events for changed properties
        if (!shallowEqual(prev.sorting, updatedState.sorting)) {
          eventBus.emit('sorting:change', {
            tableId: instance.id,
            timestamp: Date.now(),
            sorting: updatedState.sorting,
          });
        }

        if (!shallowEqual(prev.filtering, updatedState.filtering)) {
          eventBus.emit('filtering:change', {
            tableId: instance.id,
            timestamp: Date.now(),
            filtering: updatedState.filtering,
          });
        }

        if (!shallowEqual(prev.pagination, updatedState.pagination)) {
          eventBus.emit('pagination:change', {
            tableId: instance.id,
            timestamp: Date.now(),
            pagination: updatedState.pagination,
          });
        }

        if (!shallowEqual(prev.columnVisibility, updatedState.columnVisibility)) {
          eventBus.emit('column:visibility', {
            tableId: instance.id,
            timestamp: Date.now(),
            columnVisibility: updatedState.columnVisibility,
          });
        }

        if (!shallowEqual(prev.columnOrder, updatedState.columnOrder)) {
          eventBus.emit('column:reorder', {
            tableId: instance.id,
            timestamp: Date.now(),
            columnOrder: updatedState.columnOrder,
          });
        }

        if (!shallowEqual(prev.columnPinning, updatedState.columnPinning)) {
          eventBus.emit('column:pin', {
            tableId: instance.id,
            timestamp: Date.now(),
            columnPinning: updatedState.columnPinning,
          });
        }

        if (!shallowEqual(prev.rowSelection, updatedState.rowSelection)) {
          eventBus.emit('row:select', {
            tableId: instance.id,
            timestamp: Date.now(),
            rowSelection: updatedState.rowSelection,
          });
        }

        if (!shallowEqual(prev.expanded, updatedState.expanded)) {
          eventBus.emit('expanded:change', {
            tableId: instance.id,
            timestamp: Date.now(),
            expanded: updatedState.expanded,
          });
        }
      } finally {
        stop?.();
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
        stop?.();
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
        state.columnVisibility,
        state.columnOrder as ColumnId[],
        state.columnPinning
      );
    },
    getColumn: (id: ColumnId) => columnRegistry.get<TData>(id),

    // Header Groups
    getHeaderGroups: (): Column<TData>[][] => {
      // For now, return all visible columns as a single header group
      // Header grouping support can be added later
      const visibleColumns = instance.getVisibleColumns();
      return [visibleColumns];
    },

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
      // Nullify ID to prevent memory leaks from strong references
      tableId = null;
    },

    // Metadata
    get options(): Readonly<Table<TData>['options']> {
      return Object.freeze(options);
    },
    get metrics(): PerformanceMetrics | undefined {
      return performanceMonitor?.getMetrics() as PerformanceMetrics | undefined;
    },

    // Internal properties (for plugin system and event bridge)
    _internal: {
      eventBus,
      performanceMonitor,
    },
  };

  // Wire up circular dependencies
  // Set table reference on registry
  columnRegistry.setTable(instance as any);

  return instance;
}

export { createTableInstance };
