// Lifecycle management for table instances
import type { Table } from '@/types/table';
import type { RowData } from '@/types';

import { buildInitialState } from '../builders/state-builder';



/**
 * Resets the table to its initial state.
 */
function resetTable<TData extends RowData>(table: Table<TData>): void {
  const initialState = buildInitialState(table.options as any);
  (table as any)._internal.stateStore.reset(initialState);
  (table as any)._internal.eventBus.emit('table:reset', { tableId: table.id });
}

/**
 * Destroys the table and cleans up all resources.
 * This is critical for memory safety.
 */
function destroyTable<TData extends RowData>(table: Table<TData>): void {
  // Emit destroy event first
  (table as any)._internal.eventBus.emit('table:destroy', { tableId: table.id });

  // Cleanup in reverse dependency order
  (table as any)._internal.stateStore.destroy();
  (table as any)._internal.columnRegistry.destroy();
  (table as any)._internal.eventBus.clear();
  (table as any).metrics?.destroy();

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
