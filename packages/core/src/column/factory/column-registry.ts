// Column registry for managing column instances
import { GridKitError } from '../../errors/grid-kit-error';

import type { Column , RowData } from '@/types';
import type { ColumnId, ColumnGroupId } from '@/types/column/SupportingTypes';
import type { Table } from '@/types/table';

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
      this.columnGroups.get(groupId)!.push(column.id);
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
    return this.columnOrder.map((id) => this.columns.get(id)!);
  }

  /**
   * Get visible columns considering state.
   */
  getVisible(visibilityState: Record<ColumnId, boolean>): Column<TData>[] {
    return this.columnOrder
      .filter((id) => visibilityState[id] !== false)
      .map((id) => this.columns.get(id)!);
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
