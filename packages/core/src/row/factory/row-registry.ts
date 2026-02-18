/**
 * Row registry for efficient row indexing and O(1) lookups.
 * 
 * Provides fast row retrieval by ID, original index, and parent-child relationships.
 * Memory-efficient with automatic cleanup support.
 * 
 * @module @gridkit/core/row/factory/row-registry
 */

import type { RowData } from '@/types';
import type { Row } from '@/types/row/Row';
import type { RowId } from '@/types';

/**
 * Row registry with multiple indexing strategies.
 * 
 * Supports:
 * - O(1) lookups by row ID
 * - O(1) lookups by original index
 * - O(1) lookups by parent row
 * 
 * @template TData - Row data type
 */
export class RowRegistry<TData extends RowData> {
  private byId = new Map<RowId, Row<TData>>();
  private byOriginalIndex = new Map<number, Row<TData>>();
  private byParent = new Map<RowId, Row<TData>[]>();
  private tableId?: string;

  /**
   * Set the table ID for this registry.
   * Used for debugging and tracking.
   */
  setTableId(tableId: string): void {
    this.tableId = tableId;
  }

  /**
   * Get the table ID.
   */
  getTableId(): string | undefined {
    return this.tableId;
  }

  /**
   * Add a row to the registry with all indexing strategies.
   * 
   * @param row - Row instance to register
   * 
   * @example
   * ```typescript
   * const registry = new RowRegistry<User>();
   * const row = createRow({ ... });
   * registry.add(row);
   * 
   * // O(1) lookups
   * const found = registry.getById(row.id);
   * const byIndex = registry.getByOriginalIndex(row.originalIndex);
   * const children = registry.getChildren(row.id);
   * ```
   */
  add(row: Row<TData>): void {
    // Index by row ID
    this.byId.set(row.id, row);

    // Index by original index
    this.byOriginalIndex.set(row.originalIndex, row);

    // Index by parent for hierarchical data
    if (row.parentRow) {
      const siblings = this.byParent.get(row.parentRow.id) || [];
      siblings.push(row);
      this.byParent.set(row.parentRow.id, siblings);
    }
  }

  /**
   * Remove a row from the registry.
   * 
   * @param rowId - Row ID to remove
   * @returns true if row was removed, false if not found
   */
  remove(rowId: RowId): boolean {
    const row = this.byId.get(rowId);
    if (!row) return false;

    // Remove from byId
    this.byId.delete(rowId);

    // Remove from byOriginalIndex
    this.byOriginalIndex.delete(row.originalIndex);

    // Remove from byParent
    if (row.parentRow) {
      const siblings = this.byParent.get(row.parentRow.id);
      if (siblings) {
        const index = siblings.findIndex((r) => r.id === rowId);
        if (index !== -1) {
          siblings.splice(index, 1);
        }
      }
    }

    return true;
  }

  /**
   * Get row by ID with O(1) lookup.
   * 
   * @param rowId - Row ID to find
   * @returns Row instance or undefined
   */
  getById(rowId: RowId): Row<TData> | undefined {
    return this.byId.get(rowId);
  }

  /**
   * Get row by original index with O(1) lookup.
   * 
   * @param index - Original index to find
   * @returns Row instance or undefined
   */
  getByOriginalIndex(index: number): Row<TData> | undefined {
    return this.byOriginalIndex.get(index);
  }

  /**
   * Get all children of a parent row.
   * 
   * @param parentId - Parent row ID
   * @returns Array of child rows (empty if none)
   */
  getChildren(parentId: RowId): Row<TData>[] {
    return this.byParent.get(parentId) || [];
  }

  /**
   * Check if row exists in registry.
   * 
   * @param rowId - Row ID to check
   * @returns true if row is registered
   */
  has(rowId: RowId): boolean {
    return this.byId.has(rowId);
  }

  /**
   * Clear all rows from registry.
   */
  clear(): void {
    this.byId.clear();
    this.byOriginalIndex.clear();
    this.byParent.clear();
  }

  /**
   * Get total number of registered rows.
   */
  size(): number {
    return this.byId.size;
  }

  /**
   * Get all rows in registration order.
   * Uses the byId map order.
   */
  getAll(): Row<TData>[] {
    return Array.from(this.byId.values());
  }

  /**
   * Get all parent row IDs that have children.
   */
  getParentIds(): RowId[] {
    return Array.from(this.byParent.keys());
  }

  /**
   * Check if registry has any hierarchical data.
   */
  hasHierarchicalData(): boolean {
    return this.byParent.size > 0;
  }

  /**
   * Get registry statistics for monitoring.
   */
  getStats() {
    return {
      totalRows: this.byId.size,
      rowsWithParents: this.byParent.size,
      tableId: this.tableId,
    };
  }

  /**
   * Destroy registry and clean up references.
   */
  destroy(): void {
    this.clear();
    this.tableId = undefined;
  }
}

/**
 * Creates a new row registry instance.
 * 
 * @template TData - Row data type
 * @returns New row registry instance
 */
export function createRowRegistry<TData extends RowData>(): RowRegistry<TData> {
  return new RowRegistry<TData>();
}