import { createColumn } from '../column';
import { RowData, TableOptions, Table, TableState } from '../core';
import { GridKitError } from '../errors';
import {
  createEventBus,
  EventHandler,
  EventHandlerOptions,
  EventPayload,
  EventPriority,
  EventType,
} from '../events';
import { buildRowModel } from '../row';
import { createStore } from '../state';

/**
 * Creates a new table instance.
 *
 * This is the primary entry point for creating table instances in GridKit.
 * It validates configuration, initializes state, creates column/row instances,
 * and sets up the table API with lifecycle management.
 *
 * @template TData - The row data type extending RowData
 *
 * @param options - Table configuration options
 * @returns A fully initialized table instance
 *
 * @throws {GridKitError} TABLE_NO_COLUMNS - When columns array is empty
 * @throws {GridKitError} TABLE_INVALID_OPTIONS - When options are invalid
 */
export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // Validate options
  if (!options) {
    throw new GridKitError(
      'TABLE_INVALID_OPTIONS',
      'Table options are required'
    );
  }

  if (!Array.isArray(options.columns) || options.columns.length === 0) {
    throw new GridKitError(
      'TABLE_NO_COLUMNS',
      'At least one column is required'
    );
  }

  // Validate data if provided
  if (options.data !== undefined && !Array.isArray(options.data)) {
    throw new GridKitError(
      'TABLE_INVALID_OPTIONS',
      'data must be an array if provided'
    );
  }

  // Validate getRowId if provided
  if (
    options.getRowId !== undefined &&
    typeof options.getRowId !== 'function'
  ) {
    throw new GridKitError(
      'TABLE_INVALID_OPTIONS',
      'getRowId must be a function if provided'
    );
  }

  // Validate initialState if provided
  if (
    options.initialState !== undefined &&
    (typeof options.initialState !== 'object' || options.initialState === null)
  ) {
    throw new GridKitError(
      'TABLE_INVALID_OPTIONS',
      'initialState must be an object if provided'
    );
  }

  // Validate onStateChange if provided
  if (
    options.onStateChange !== undefined &&
    typeof options.onStateChange !== 'function'
  ) {
    throw new GridKitError(
      'TABLE_INVALID_OPTIONS',
      'onStateChange must be a function if provided'
    );
  }

  // Normalize options
  const normalizedOptions = {
    columns: options.columns,
    data: options.data || [],
    getRowId: options.getRowId || ((_, index) => index.toString()),
    initialState: options.initialState || {},
    debugMode: options.debugMode || false,
    onStateChange: options.onStateChange,
    defaultColumn: options.defaultColumn || {},
    meta: options.meta || {},
  };

  // Create initial state
  const initialState: TableState<TData> = {
    data: normalizedOptions.data,
    columnVisibility: {},
    columnOrder: options.columns.map((col) => col.id || col.accessorKey || ''),
    columnSizing: {},
    rowSelection: {},
    expanded: {},
    ...normalizedOptions.initialState,
  };

  // Create store
  const store = createStore(initialState);

  // Create event bus for this table instance
  const eventBus = createEventBus({
    devMode: normalizedOptions.debugMode,
    maxHandlersPerEvent: 1000,
  });

  // Track destroyed state
  let isDestroyed = false;

  // Helper function to emit state change events
  const emitStateChangeEvents = (
    oldState: TableState<TData>,
    newState: TableState<TData>
  ) => {
    if (isDestroyed) return;

    // Emit grid events
    if (oldState.data !== newState.data) {
      // Data changed - emit row events
      // Note: More sophisticated diffing could be added here
      eventBus.emit('grid:data-change', {
        oldData: oldState.data,
        newData: newState.data,
      });
    }

    // Column visibility changes
    const oldVisibility = oldState.columnVisibility;
    const newVisibility = newState.columnVisibility;
    for (const columnId in newVisibility) {
      if (oldVisibility[columnId] !== newVisibility[columnId]) {
        eventBus.emit('column:visibility-change', {
          columnId,
          visible: newVisibility[columnId] !== false,
        });
      }
    }

    // Column order changes
    if (
      JSON.stringify(oldState.columnOrder) !==
      JSON.stringify(newState.columnOrder)
    ) {
      eventBus.emit('column:order-change', {
        oldOrder: oldState.columnOrder,
        newOrder: newState.columnOrder,
      });
    }

    // Row selection changes
    const oldSelection = oldState.rowSelection;
    const newSelection = newState.rowSelection;
    const added: (string | number)[] = [];
    const removed: (string | number)[] = [];

    for (const rowId in newSelection) {
      if (newSelection[rowId] && !oldSelection[rowId]) {
        added.push(rowId);
      }
    }

    for (const rowId in oldSelection) {
      if (oldSelection[rowId] && !newSelection[rowId]) {
        removed.push(rowId);
      }
    }

    if (added.length > 0 || removed.length > 0) {
      const selectedIds = Object.keys(newSelection).filter(
        (id) => newSelection[id]
      );
      eventBus.emit('selection:change', {
        selectedIds,
      });

      if (added.length > 10 || removed.length > 10) {
        eventBus.emit('selection:bulk-change', {
          added,
          removed,
          total: selectedIds.length,
        });
      }
    }
  };

  // Create table instance with basic methods first
  const tableInstance = {
    getState: () => {
      if (isDestroyed) return initialState;
      return store.getState();
    },
    setState: (updater: any) => {
      if (isDestroyed) return;

      const oldState = store.getState();
      store.setState(updater);
      const newState = store.getState();

      // Emit state change events
      emitStateChangeEvents(oldState, newState);

      // Emit generic state change event
      eventBus.emit('grid:state-change', {
        oldState,
        newState,
        changedKeys: Object.keys(newState).filter(
          (key) =>
            JSON.stringify(oldState[key as keyof TableState<TData>]) !==
            JSON.stringify(newState[key as keyof TableState<TData>])
        ),
      });

      // Trigger callback
      if (normalizedOptions.onStateChange) {
        normalizedOptions.onStateChange(newState);
      }

      // Debug logging
      if (normalizedOptions.debugMode) {
        console.log('[GridKit] State updated:', newState);
      }
    },
    subscribe: (listener: any) => {
      if (isDestroyed) return () => {};
      return store.subscribe(listener);
    },
    getColumn: (id: string) => undefined as any, // Will be set after columns are created
  } as Table<TData>;

  // Create columns
  const columns = normalizedOptions.columns.map((columnDef) => {
    const mergedColumnDef = {
      ...normalizedOptions.defaultColumn,
      ...columnDef,
    };

    return createColumn({
      columnDef: mergedColumnDef,
      table: tableInstance,
    });
  });

  // Build row model
  let rowModel = buildRowModel({
    data: normalizedOptions.data,
    columns,
    getRowId: normalizedOptions.getRowId,
    table: tableInstance,
  });

  // Now update table instance with column methods and remaining properties
  Object.assign(tableInstance, {
    options: normalizedOptions,

    // Event bus methods
    on: <T extends EventType>(
      event: T,
      handler: EventHandler<T>,
      options?: EventHandlerOptions
    ) => {
      if (isDestroyed) return () => {};
      return eventBus.on(event, handler, options);
    },

    once: <T extends EventType>(event: T, handler: EventHandler<T>) => {
      if (isDestroyed) return () => {};
      return eventBus.once(event, handler);
    },

    off: <T extends EventType>(event: T, handler: EventHandler<T>) => {
      if (isDestroyed) return;
      eventBus.off(event, handler);
    },

    emit: <T extends EventType>(
      event: T,
      payload: EventPayload<T>,
      options?: {
        priority?: EventPriority;
        source?: string;
        metadata?: Record<string, unknown>;
      }
    ) => {
      if (isDestroyed) return;
      eventBus.emit(event, payload, options);
    },

    emitBatch: <T extends EventType>(
      events: Array<{
        event: T;
        payload: EventPayload<T>;
        priority?: EventPriority;
      }>
    ) => {
      if (isDestroyed) return;
      for (const { event, payload, priority } of events) {
        eventBus.emit(event, payload, { priority });
      }
    },

    // Event bus accessor (for internal use)
    _eventBus: eventBus,

    getAllColumns: () => columns,
    getVisibleColumns: () => {
      if (isDestroyed) return [];
      const state = store.getState();
      return columns.filter((col) => state.columnVisibility[col.id] !== false);
    },
    getColumn: (id: string) => columns.find((col) => col.id === id),

    getRowModel: () => rowModel,

    getRow: (id: string) => rowModel.rowsById.get(id),

    reset: () => {
      if (isDestroyed) return;
      const oldState = store.getState();
      store.setState(initialState);

      // Emit reset event
      eventBus.emit('grid:reset', {
        oldState,
        newState: initialState,
      });
    },

    destroy: () => {
      if (isDestroyed) return;

      // Emit destroy event with IMMEDIATE priority to ensure it's processed before cleanup
      const gridId = (tableInstance.options.meta as any)?.gridId || 'unknown';
      eventBus.emit(
        'grid:destroy',
        {
          gridId,
        },
        { priority: 0 }
      ); // EventPriority.IMMEDIATE
      // Cleanup event bus
      eventBus.clear();

      // Cleanup store and other resources
      store.destroy();
      columns.length = 0;
      // Clear row model
      rowModel.rows.length = 0;
      rowModel.flatRows.length = 0;
      rowModel.rowsById.clear();
      isDestroyed = true;
    },
  });

  // Subscribe to state changes
  store.subscribe((state) => {
    rowModel = buildRowModel({
      data: state.data,
      columns,
      getRowId: normalizedOptions.getRowId,
      table: tableInstance,
    });
  });

  // Emit initialization events asynchronously to allow handlers to be registered first
  const gridId = normalizedOptions.meta?.gridId || 'unknown';
  setTimeout(() => {
    if (!isDestroyed) {
      eventBus.emit('grid:init', {
        gridId,
      });

      // Emit ready event after initialization
      setTimeout(() => {
        if (!isDestroyed) {
          eventBus.emit('grid:ready', {
            gridId,
            timestamp: Date.now(),
            meta: normalizedOptions.meta,
          });
        }
      }, 0);
    }
  }, 0);

  return tableInstance;
}
