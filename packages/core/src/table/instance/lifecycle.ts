// Lifecycle management for table instances
import type { Table, RowData } from '@/types/table';

import { buildInitialState } from '../builders/state-builder';



/**
 * Resets the table to its initial state.
 */
function resetTable<TData extends RowData>(table: Table<TData>): void {
  const initialState = buildInitialState(table.options);
  table._internal.stateStore.reset(initialState);
  table._internal.eventBus.emit('table:reset', { tableId: table.id });
}

/**
 * Destroys the table and cleans up all resources.
 * This is critical for memory safety.
 */
function destroyTable<TData extends RowData>(table: Table<TData>): void {
  // Emit destroy event first
  table._internal.eventBus.emit('table:destroy', { tableId: table.id });

  // Cleanup in reverse dependency order
  table._internal.stateStore.destroy();
  table._internal.columnRegistry.destroy();
  table._internal.eventBus.clear();
  table.metrics?.destroy();

  // Clear references for GC
  Object.keys(table).forEach((key) => {
    try {
      (table as any)[key] = null;
    } catch (e) {
      // Ignore errors when clearing properties
    }
  });
}

/**
 * Checks if the table has been destroyed.
 */
function isTableDestroyed<TData extends RowData>(table: Table<TData>): boolean {
  try {
    // If the state store has been destroyed, accessing it will throw
    table.getState();
    return false;
  } catch (e) {
    return true;
  }
}

export { resetTable, destroyTable, isTableDestroyed };
