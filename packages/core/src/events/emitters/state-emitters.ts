/**
 * State Change Event Emitters.
 *
 * Provides functions to emit events based on table state changes.
 * These emitters translate state changes into specific event types.
 *
 * @module @gridkit/core/events/emitters
 */

import { EventBus } from '../EventBus';

import type { Table, RowData, TableState, ColumnId, RowId } from '@/types';

// Track previous state per table for change detection
const previousStateMap = new Map<string, TableState<any>>();

/**
 * Emit events for state changes.
 * Detects what changed and emits specific events for each change type.
 *
 * @template TData - Row data type
 * @param state - Current table state
 * @param table - Table instance
 * @param eventBus - Event bus to emit events on
 */
export function emitStateEvents<TData extends RowData>(
  state: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const tableId = table.id as string;

  // Get previous state for this table
  const previousState = previousStateMap.get(tableId);

  // Detect what changed
  const changedKeys = detectChangedKeys(previousState, state);

  if (changedKeys.length > 0) {
    // Emit general state update event
    eventBus.emit(
      'state:update',
      {
        tableId: table.id as string,
        previousState: previousState as TableState<TData>,
        newState: state,
        changedKeys,
        timestamp: Date.now(),
      },
      { source: 'table' }
    );

    // Emit specific events based on changed keys
    if (changedKeys.includes('columnVisibility')) {
      emitColumnVisibilityEvents(
        previousState!,
        state,
        table,
        eventBus
      );
    }

    if (changedKeys.includes('rowSelection')) {
      emitRowSelectionEvents(
        previousState!,
        state,
        table,
        eventBus
      );
    }

    if (changedKeys.includes('sorting')) {
      emitSortingEvents(
        previousState!,
        state,
        table,
        eventBus
      );
    }

    if (changedKeys.includes('filtering')) {
      emitFilteringEvents(
        previousState!,
        state,
        table,
        eventBus
      );
    }

    if (changedKeys.includes('expanded')) {
      emitExpansionEvents(previousState!, state, table, eventBus);
    }

    if (changedKeys.includes('data')) {
      emitDataEvents(previousState!, state, table, eventBus);
    }

    // Update previous state for next comparison
    previousStateMap.set(tableId, state);
  }
}

/**
 * Detect which keys have changed between states.
 *
 * @template TData - Row data type
 * @param previous - Previous state (or undefined for initial)
 * @param current - Current state
 * @returns Array of changed key names
 */
export function detectChangedKeys<TData extends RowData>(
  previous: TableState<TData> | undefined,
  current: TableState<TData>
): Array<keyof TableState<TData>> {
  if (!previous) {
    return Object.keys(current) as Array<keyof TableState<TData>>;
  }

  const changed: Array<keyof TableState<TData>> = [];
  for (const key in current) {
    if (
      Object.prototype.hasOwnProperty.call(current, key) &&
      !shallowEqual((previous as any)[key], (current as any)[key])
    ) {
      changed.push(key as keyof TableState<TData>);
    }
  }
  return changed;
}

// Shallow equality check
function shallowEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  if (
    typeof a !== 'object' ||
    a === null ||
    typeof b !== 'object' ||
    b === null
  ) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

// ===================================================================
// Specific Event Emitters
// ===================================================================

/**
 * Emit events for column visibility changes.
 */
function emitColumnVisibilityEvents<TData extends RowData>(
  previous: TableState<TData>,
  current: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const tableId = table.id as string;

  // Find which columns changed visibility
  const changedColumns: string[] = [];
  const allColumnIds = new Set([
    ...Object.keys(previous.columnVisibility),
    ...Object.keys(current.columnVisibility),
  ]);

  for (const columnId of allColumnIds) {
    const prevVisible = previous.columnVisibility[columnId as ColumnId];
    const currVisible = current.columnVisibility[columnId as ColumnId];
    if (prevVisible !== currVisible) {
      changedColumns.push(columnId);
    }
  }

  if (changedColumns.length > 0) {
    eventBus.emit(
      'column:visibility:update',
      {
        tableId,
        changedColumns,
        previousVisibility: previous.columnVisibility,
        currentVisibility: current.columnVisibility,
        timestamp: Date.now(),
      },
      { source: 'table' }
    );
  }
}

/**
 * Emit events for row selection changes.
 */
function emitRowSelectionEvents<TData extends RowData>(
  previous: TableState<TData>,
  current: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const tableId = table.id as string;

  // Find which rows changed selection
  const changedRows: string[] = [];
  const allRowIds = new Set([
    ...Object.keys(previous.rowSelection),
    ...Object.keys(current.rowSelection),
  ]);

  for (const rowId of allRowIds) {
    const prevSelected = previous.rowSelection[rowId as RowId];
    const currSelected = current.rowSelection[rowId as RowId];
    if (prevSelected !== currSelected) {
      changedRows.push(rowId);
    }
  }

  if (changedRows.length > 0) {
    eventBus.emit(
      'selection:update',
      {
        tableId,
        changedRows,
        previousSelection: previous.rowSelection,
        currentSelection: current.rowSelection,
        timestamp: Date.now(),
      },
      { source: 'table' }
    );
  }
}

/**
 * Emit events for sorting changes.
 */
function emitSortingEvents<TData extends RowData>(
  previous: TableState<TData>,
  current: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const tableId = table.id as string;

  // Check if sorting changed
  const prevSorting = JSON.stringify(previous.sorting);
  const currSorting = JSON.stringify(current.sorting);

  if (prevSorting !== currSorting) {
    eventBus.emit(
      'sorting:update',
      {
        tableId,
        previousSorting: previous.sorting,
        currentSorting: current.sorting,
        timestamp: Date.now(),
      },
      { source: 'table' }
    );
  }
}

/**
 * Emit events for filtering changes.
 */
function emitFilteringEvents<TData extends RowData>(
  previous: TableState<TData>,
  current: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const tableId = table.id as string;

  // Check if filtering changed
  const prevFiltering = JSON.stringify(previous.filtering);
  const currFiltering = JSON.stringify(current.filtering);

  if (prevFiltering !== currFiltering) {
    eventBus.emit(
      'filtering:update',
      {
        tableId,
        previousFiltering: previous.filtering,
        currentFiltering: current.filtering,
        timestamp: Date.now(),
      },
      { source: 'table' }
    );
  }
}

/**
 * Emit events for row expansion changes.
 */
function emitExpansionEvents<TData extends RowData>(
  previous: TableState<TData>,
  current: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const tableId = table.id as string;

  // Find which rows changed expansion
  const changedRows: string[] = [];
  const allRowIds = new Set([
    ...Object.keys(previous.expanded),
    ...Object.keys(current.expanded),
  ]);

  for (const rowId of allRowIds) {
    const prevExpanded = previous.expanded[rowId as RowId];
    const currExpanded = current.expanded[rowId as RowId];
    if (prevExpanded !== currExpanded) {
      changedRows.push(rowId);
    }
  }

  if (changedRows.length > 0) {
    eventBus.emit(
      'row:expand',
      {
        tableId,
        changedRows,
        previousExpanded: previous.expanded,
        currentExpanded: current.expanded,
        timestamp: Date.now(),
      },
      { source: 'table' }
    );
  }
}

/**
 * Emit events for data changes.
 */
function emitDataEvents<TData extends RowData>(
  previous: TableState<TData>,
  current: TableState<TData>,
  table: Table<TData>,
  eventBus: EventBus
): void {
  const tableId = table.id as string;

  const prevLength = previous.data.length;
  const currLength = current.data.length;

  let changeType: 'add' | 'update' | 'delete' | 'replace' | 'bulk';

  if (prevLength === 0 && currLength > 0) {
    changeType = 'add';
  } else if (prevLength > 0 && currLength === 0) {
    changeType = 'delete';
  } else if (prevLength !== currLength) {
    changeType = 'bulk';
  } else {
    changeType = 'replace';
  }

  eventBus.emit(
    'data:change',
    {
      tableId,
      changeType,
      previousData: previous.data,
      data: current.data,
      timestamp: Date.now(),
      source: 'table',
    },
    { source: 'table' }
  );
}

/**
 * Clear state tracking for a table.
 * Call when a table is destroyed.
 *
 * @param tableId - Table ID to clear
 */
export function clearTableStateTracking(tableId: string): void {
  previousStateMap.delete(tableId);
}

/**
 * Clear all state tracking.
 * Call when event system is reset.
 */
export function clearAllStateTracking(): void {
  previousStateMap.clear();
}
