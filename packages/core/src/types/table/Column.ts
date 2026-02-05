/**
 * Column types.
 *
 * Contains all types related to table columns.
 *
 * @module @gridkit/core/types/table/column
 */

import type { ColumnId, RowData, AccessorValue } from '@/types';
import type { Row, RowModel } from './Row';

// ===================================================================
// Column Interface
// ===================================================================

/**
 * Interface representing a column definition instance.
 */
export interface Column<TData extends RowData> {
  /**
   * Unique column identifier.
   */
  readonly id: ColumnId;

  /**
   * Header text or component.
   */
  readonly header: string | ((column: Column<TData>) => string);

  /**
   * Column size in pixels.
   */
  readonly size: number;

  /**
   * Whether column is visible.
   */
  readonly visible: boolean;

  /**
   * Column display order index.
   */
  readonly displayIndex: number;

  /**
   * Column accessor function or key.
   */
  readonly accessor: ColumnAccessor<TData>;

  /**
   * Get cell value for a specific row.
   */
  getValue(row: Row<TData>): unknown;

  /**
   * Check if column can be resized.
   */
  getCanResize(): boolean;

  /**
   * Check if column can be reordered.
   */
  getCanReorder(): boolean;

  /**
   * Check if column can be hidden.
   */
  getCanHide(): boolean;
}

// ===================================================================
// Column Accessor Types
// ===================================================================

/**
 * Column accessor can be either a string key or a function.
 */
export type ColumnAccessor<TData extends RowData> =
  | string
  | ColumnAccessorFn<TData>;

/**
 * Function-based column accessor.
 */
export type ColumnAccessorFn<TData extends RowData> = (
  row: TData,
  rowModel: RowModel<TData>
) => unknown;

/**
 * Value type for a specific column.
 */
export type ColumnValue<
  TData extends RowData,
  TColumnId extends ColumnId,
> = TColumnId extends `${infer Path}.${string}`
  ? AccessorValue<TData, Path>
  : TColumnId extends keyof TData
    ? TData[TColumnId]
    : unknown;

/**
 * Column definition for creating column instances.
 */
export interface ColumnDef<TData extends RowData> {
  /**
   * Unique column identifier.
   */
  id?: ColumnId;

  /**
   * Header text or function.
   */
  header?: string | ((column: Column<TData>) => string);

  /**
   * Column size in pixels.
   */
  size?: number;

  /**
   * Initial column visibility.
   */
  visible?: boolean;

  /**
   * Column accessor (string key or function).
   */
  accessor?: ColumnAccessor<TData>;

  /**
   * Custom column options.
   */
  meta?: ColumnMeta;
}

/**
 * Column metadata (user-defined).
 */
export interface ColumnMeta {
  /**
   * User-friendly column name.
   */
  name?: string;

  /**
   * Any custom application data.
   */
  [key: string]: unknown;
}