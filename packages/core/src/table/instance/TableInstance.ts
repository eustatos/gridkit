import type { Table, ValidatedTableOptions, RowData } from '../../types';
import { createStore } from '../../state';
import { createColumnRegistry } from '../../column';
import { createEventBus } from '../../events';
import { buildInitialState } from '../builders/state-builder';
import { buildRowModel } from '../builders/model-builder';
import { createRowFactory } from '../../row';

/**
 * Creates the table instance with proper memory management.
 * Uses weak references and cleanup systems.
 */
function createTableInstance<TData>(
  options: ValidatedTableOptions<TData>
): Table<TData> {
  // === State Management ===
  const initialState = buildInitialState(options);
  const stateStore = createStore(initialState);

  // === Column System ===
  const columnRegistry = createColumnRegistry();
  // const columns = createColumns(options.columns, {
  //   table: null as any, // Will be set later
  //   registry: columnRegistry,
  //   defaultOptions: options.defaultColumn,
  // });

  // === Row System ===
  const rowFactory = createRowFactory({
    getRowId: options.getRowId,
    columnRegistry,
  });

  // === Event System ===
  const eventBus = createEventBus({
    debug: options.debug?.events,
  });

  // === Performance Monitoring ===
  // const metrics = options.debug?.performance
  //   ? createPerformanceMonitor()
  //   : undefined;

  // === Build the Instance ===
  const instance: Table<TData> = {
    // Identification
    id: `table-${Date.now()}` as any,

    // State Management
    getState: () => stateStore.getState(),
    setState: (updater) => {
      // metrics?.startMeasurement('stateUpdate');
      stateStore.setState(updater);
      // metrics?.endMeasurement('stateUpdate');
    },
    subscribe: (listener) => stateStore.subscribe(listener),

    // Data Access
    getRowModel: () =>
      buildRowModel({
        data: stateStore.getState().data,
        rowFactory,
        columnRegistry,
        table: instance,
      }),
    getRow: (id) => {
      const model = instance.getRowModel();
      return model.rowsById.get(id);
    },

    // Column Access
    getAllColumns: () => columnRegistry.getAll(),
    getVisibleColumns: () => {
      const state = stateStore.getState();
      return columnRegistry.getVisible(state.columnVisibility);
    },
    getColumn: (id) => columnRegistry.get(id),

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
      // metrics?.destroy();

      // Clear references for GC
      Object.keys(instance).forEach((key) => {
        (instance as any)[key] = null;
      });
    },

    // Metadata
    options: Object.freeze(options) as Readonly<ValidatedTableOptions<TData>>,
    meta: options.meta,
    metrics: undefined,
    _internal: {
      stateStore,
      columnRegistry,
      rowFactory,
      eventBus,
    },
  };

  // Wire up circular dependencies
  columnRegistry.setTable(instance as any);

  return instance;
}

export { createTableInstance };