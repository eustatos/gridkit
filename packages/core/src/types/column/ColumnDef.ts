// ColumnDef.ts
// Column definition types with advanced type inference

import type { RowData } from '../base'

import type { AccessorKey, AccessorFn } from './AccessorTypes'
import type { HeaderContext, CellContext, FooterContext } from './RenderContext'
import type { ColumnId, ColumnGroupId, Comparator, FilterFn, AggregationFn, ColumnMeta } from './SupportingTypes'

/**
 * Complete column definition with type-safe accessors.
 * Supports both simple key access and complex computed values.
 *
 * @template TData - Row data type
 * @template TValue - Inferred cell value type
 *
 * @example
 * ```typescript
 * // Simple column
 * const col: ColumnDef<User> = {
 *   accessorKey: 'name',
 *   header: 'Name'
 * };
 *
 * // Computed column
 * const col: ColumnDef<User, string> = {
 *   id: 'fullName',
 *   accessorFn: row => `${row.firstName} ${row.lastName}`,
 *   header: 'Full Name'
 * };
 * ```
 */
export interface ColumnDef<TData extends RowData, TValue = unknown> {
  // === Required: Accessor Definition ===

  /**
   * String key for data access (dot notation supported).
   * Mutually exclusive with `accessorFn`.
   *
   * @example
   * ```typescript
   * // With type inference (recommended)
   * accessorKey: 'profile.name' as const
   * 
   * // Plain string (works but less type safety)
   * accessorKey: 'profile.name'
   * ```
   */
  accessorKey?: AccessorKey<TData> | string;

  /**
   * Function for computed values.
   * Requires explicit `id` since no key is provided.
   * Mutually exclusive with `accessorKey`.
   */
  accessorFn?: AccessorFn<TData, TValue>;

  /**
   * Unique column ID (auto-generated from accessorKey).
   * Required when using `accessorFn`.
   */
  id?: ColumnId;

  // === Rendering ===

  /**
   * Header content (string or render function).
   */
  header?: string | HeaderRenderer<TData, TValue>;

  /**
   * Cell content renderer.
   * Receives typed context with getValue().
   */
  cell?: CellRenderer<TData, TValue> | string;

  /**
   * Footer content (string or render function).
   */
  footer?: string | FooterRenderer<TData, TValue>;

  // === Layout & Sizing ===

  /**
   * Initial width in pixels.
   * @default 150
   */
  size?: number;

  /**
   * Minimum width (resizing constraint).
   * @default 50
   */
  minSize?: number;

  /**
   * Maximum width (resizing constraint).
   * @default Infinity
   */
  maxSize?: number;

  // === Feature Flags ===

  /**
   * Enable sorting for this column.
   * @default true
   */
  enableSorting?: boolean;

  /**
   * Enable filtering for this column.
   * @default true
   */
  enableFiltering?: boolean;

  /**
   * Enable column resizing.
   * @default true
   */
  enableResizing?: boolean;

  /**
   * Enable column visibility toggling.
   * @default true
   */
  enableHiding?: boolean;

  /**
   * Enable column reordering.
   * @default true
   */
  enableReordering?: boolean;

  /**
   * Enable column pinning (freeze).
   * @default false
   */
  enablePinning?: boolean;

  // === Advanced Configuration ===

  /**
   * Custom metadata for application use.
   */
  meta?: ColumnMeta;

  /**
   * Custom sort function (overrides default).
   */
  sortFn?: Comparator<TValue>;

  /**
   * Custom filter function (overrides default).
   */
  filterFn?: FilterFn<TData, TValue>;

  /**
   * Aggregation function for grouped data.
   */
  aggregationFn?: AggregationFn<TValue>;

  /**
   * Column grouping ID (for header grouping).
   */
  columnGroupId?: ColumnGroupId;
}

/**
 * Validated column definition with all required fields.
 * Created by normalizing and validating a ColumnDef.
 */
export type ValidatedColumnDef<TData extends RowData, TValue = unknown> = 
  Required<Pick<ColumnDef<TData, TValue>,
    'id' | 'size' | 'minSize' | 'maxSize' | 'enableSorting' | 
    'enableFiltering' | 'enableResizing' | 'enableHiding' | 
    'enableReordering' | 'enablePinning' | 'meta'
  >> & 
  Omit<ColumnDef<TData, TValue>, 
    'id' | 'size' | 'minSize' | 'maxSize' | 'enableSorting' | 
    'enableFiltering' | 'enableResizing' | 'enableHiding' | 
    'enableReordering' | 'enablePinning' | 'meta'
  >;