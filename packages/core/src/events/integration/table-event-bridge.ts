/**
 * Table Event Bridge Implementation.
 *
 * Creates a bridge between table instances and the event system,
 * translating table operations into events and providing event subscription methods.
 *
 * @module @gridkit/core/events/integration
 */

import type { Table, RowData, GridId , RowId } from '@/types';

import { EventBus } from '../EventBus';
import type { TableEventBridge, DataChangeType } from '../types/event-bridge';


// Helper to detect changed keys between states
function detectChangedKeys<TData extends RowData>(
  previous: Record<string, any> | undefined,
  current: Record<string, any>
): Array<keyof TableState<TData>> {
  if (!previous) {
    return Object.keys(current) as Array<keyof TableState<TData>>;
  }

  const changed: Array<keyof TableState<TData>> = [];
  for (const key in current) {
    if (hasKey(current, key) && !shallowEqual(previous[key], current[key])) {
      changed.push(key as keyof TableState<TData>);
    }
  }
  return changed;
}

// Type guard for hasOwnProperty
function hasKey<T>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// Shallow equality check for state detection
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
    if (!hasKey(b, key) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Creates an event bridge for a table instance.
 * Connects table state changes to the event system.
 *
 * @template TData - Row data type
 * @param table - Table instance to bridge
 * @param eventBus - Event bus to use
 * @returns Event bridge instance
 */
export function createTableEventBridge<TData extends RowData>(
  table: Table<TData>,
  eventBus: EventBus
): TableEventBridge<TData> {
  const tableId = table.id;

  // Track previous state for change detection
  let previousState: TableState<TData> | undefined;

  // Track cleanup functions for bridge-managed subscriptions
  const cleanupFunctions: Array<() => void> = [];

  // 1. Wire up table state changes to events
  const unsubscribeState = table.subscribe((state) => {
    // Detect what changed
    const changedKeys = detectChangedKeys<TData>(
      previousState,
      state as Record<string, any>
    );

    if (changedKeys.length > 0) {
      // Emit general state update event
      eventBus.emit(
        'state:update',
        {
          tableId,
          previousState: previousState,
          newState: state,
          changedKeys,
          timestamp: Date.now(),
        },
        { source: 'table' }
      );

      // Emit specific events based on changed keys
      if (changedKeys.includes('columnVisibility')) {
        eventBus.emit(
          'column:visibility:update',
          {
            tableId,
            columnVisibility: state.columnVisibility,
            timestamp: Date.now(),
            source: 'table',
          },
          { source: 'table' }
        );
      }

      if (changedKeys.includes('rowSelection')) {
        eventBus.emit(
          'selection:update',
          {
            tableId,
            rowSelection: state.rowSelection,
            timestamp: Date.now(),
            source: 'table',
          },
          { source: 'table' }
        );
      }

      if (changedKeys.includes('sorting')) {
        eventBus.emit(
          'sorting:update',
          {
            tableId,
            sorting: state.sorting,
            timestamp: Date.now(),
            source: 'table',
          },
          { source: 'table' }
        );
      }

      if (changedKeys.includes('filtering')) {
        eventBus.emit(
          'filtering:update',
          {
            tableId,
            filtering: state.filtering,
            timestamp: Date.now(),
            source: 'table',
          },
          { source: 'table' }
        );
      }

      if (changedKeys.includes('expanded')) {
        eventBus.emit(
          'row:expand',
          {
            tableId,
            expanded: state.expanded,
            timestamp: Date.now(),
            source: 'table',
          },
          { source: 'table' }
        );
      }

      // Update previous state
      previousState = state;
    }
  });

  // Add unsubscribeState to cleanup functions
  cleanupFunctions.push(unsubscribeState);

  // 2. Create bridge instance
  const bridge: TableEventBridge<TData> = {
    // Event emission methods
    emitEvent: <T extends string>(
      event: T,
      payload: any
    ) => {
      eventBus.emit(event, {
        ...payload,
        tableId,
        timestamp: Date.now(),
        source: 'table',
      });
    },

    emitStateUpdate: (
      prev: TableState<TData>,
      curr: TableState<TData>,
      changed: Array<keyof TableState<TData>>
    ) => {
      eventBus.emit(
        'state:update',
        {
          tableId,
          previousState: prev,
          newState: curr,
          changedKeys: changed,
          timestamp: Date.now(),
        },
        { source: 'table' }
      );
    },

    emitDataChange: (
      changeType: DataChangeType,
      rowIds: RowId[],
      data?: TData[],
      previousData?: TData[]
    ) => {
      eventBus.emit(
        'data:change',
        {
          tableId,
          changeType,
          rowIds,
          data,
          previousData,
          timestamp: Date.now(),
          source: 'table',
        },
        { source: 'table' }
      );
    },

    // Event subscription methods
    on: <T extends string>(
      event: T,
      handler: (e: any) => void,
      options?: any
    ) => {
      const cleanup = eventBus.on(event, handler, options);
      cleanupFunctions.push(cleanup);
      return cleanup;
    },

    once: <T extends string>(
      event: T,
      handler: (e: any) => void
    ) => {
      const cleanup = eventBus.once(event, handler);
      cleanupFunctions.push(cleanup);
      return cleanup;
    },

    off: <T extends string>(
      event: T,
      handler: (e: any) => void
    ) => {
      eventBus.off(event, handler);
    },

    // Lifecycle
    destroy: () => {
      // Clean up all bridge-managed subscriptions
      cleanupFunctions.forEach((cleanup) => cleanup());
      cleanupFunctions.length = 0;
    },

    // Metadata
    eventBus,
    tableId,
  };

  // 3. Emit initialization events
  eventBus.emit(
    'table:init',
    {
      tableId,
      timestamp: Date.now(),
      columnCount: table.getAllColumns().length,
      rowCount: table.getRowModel().rows.length,
    },
    { source: 'table' }
  );

  return bridge;
}

// Re-export for convenience
import type { TableState } from '@/types';
