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

  // Track destroyed state
  let isDestroyed = false;

  // Create table instance with basic methods first
  const tableInstance = {
    getState: () => {
      if (isDestroyed) return initialState;
      return store.getState();
    },
    setState: (updater: any) => {
      if (isDestroyed) return;
      store.setState(updater);

      // Trigger callback
      if (normalizedOptions.onStateChange) {
        normalizedOptions.onStateChange(store.getState());
      }

      // Debug logging
      if (normalizedOptions.debugMode) {
        console.log('[GridKit] State updated:', store.getState());
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
      store.setState(initialState);
    },

    destroy: () => {
      if (isDestroyed) return;
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

  return tableInstance;
}

import type { RowData } from '../types/base';
import type { Table, TableOptions, TableState } from '../types/table';
import { createStore } from '../state';
import { createColumn } from '../column';
import { buildRowModel } from '../row';
import { GridKitError } from '../errors';
