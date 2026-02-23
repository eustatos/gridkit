// Column registry for managing column instances

import type { Column , RowData } from '@/types';
import type { ColumnId, ColumnGroupId } from '@/types/column/SupportingTypes';
import type { Table } from '@/types/table';

import { GridKitError } from '../../errors/grid-kit-error';

/**
 * Manages all columns in a table with O(1) lookups.
 */
export class ColumnRegistry<TData extends RowData> {
  private columns = new Map<ColumnId, Column<TData>>();
  private columnOrder: ColumnId[] = [];
  private columnGroups = new Map<ColumnGroupId, ColumnId[]>();
  private table: Table<TData> | null = null;

  /**
   * Set the table instance for this registry.
   * Used for circular dependencies.
   */
  setTable(table: Table<TData>): void {
    this.table = table;
  }

  /**
   * Get the table instance.
   */
  getTable(): Table<TData> | null {
    return this.table;
  }

  /**
   * Register a column and validate uniqueness.
   */
  register(column: Column<TData>): void {
    if (this.columns.has(column.id)) {
      throw new GridKitError(
        'DUPLICATE_COLUMN',
        `Column ${column.id} already exists`
      );
    }

    this.columns.set(column.id, column);
    this.columnOrder.push(column.id);

    // Handle column groups
    const groupId = column.columnDef.columnGroupId;
    if (groupId) {
      if (!this.columnGroups.has(groupId)) {
        this.columnGroups.set(groupId, []);
      }
      this.columnGroups.get(groupId).push(column.id);
    }
  }

/**
 * Get column by ID with type-safe value inference.
 */
  get<TValue = unknown>(id: ColumnId): Column<TData, TValue> | undefined {
    return this.columns.get(id) as Column<TData, TValue> | undefined;
  }

  /**
   * Get all columns in registration order.
   */
  getAll(): Column<TData>[] {
    return this.columnOrder.map((id) => this.columns.get(id));
  }

  /**
   * Get visible columns considering state.
   */
  getVisible(visibilityState: Record<ColumnId, boolean>, columnOrder?: ColumnId[], columnPinning?: { left?: readonly ColumnId[]; right?: readonly ColumnId[] }): Column<TData>[] {
    const order = columnOrder || this.columnOrder;
    
    if (!columnPinning || (!columnPinning.left?.length && !columnPinning.right?.length)) {
      // No pinning - return in order
      return order
        .filter((id) => visibilityState[id] !== false)
        .map((id) => this.columns.get(id));
    }
    
    // Apply pinning order:
    // 1. Left-pinned columns (in their pinned order)
    // 2. Non-pinned visible columns (in columnOrder)
    // 3. Right-pinned columns (in their pinned order)
    
    const leftPinned = (columnPinning.left ?? []).filter(id => visibilityState[id] !== false);
    const rightPinned = (columnPinning.right ?? []).filter(id => visibilityState[id] !== false);
    const unpinned = order.filter(id => 
      visibilityState[id] !== false &&
      !leftPinned.includes(id) &&
      !rightPinned.includes(id)
    );
    
    // Debug: log when pinning changes
    if (process.env.DEBUG_PINNING === '1') {
      console.log('getVisible:', { 
        leftPinned, 
        unpinned, 
        rightPinned, 
        order: order?.slice(0, 5),
        columnPinning 
      });
    }
    
    return [...leftPinned, ...unpinned, ...rightPinned]
      .map((id) => this.columns.get(id));
  }

  /**
   * Destroy the registry and clean up references.
   */
  destroy(): void {
    this.columns.clear();
    this.columnOrder = [];
    this.columnGroups.clear();
    this.table = null;
  }
}

/**
 * Creates a new column registry instance.
 */
export function createColumnRegistry<
  TData extends RowData,
>(): ColumnRegistry<TData> {
  return new ColumnRegistry<TData>();
}
