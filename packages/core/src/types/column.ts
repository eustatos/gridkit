/**
 * GridKit Column Types
 *
 * This module contains the column type system - one of the most important parts of GridKit.
 * Columns define how data is accessed, displayed, and manipulated. The type system supports:
 * - Type-safe data access (string keys and functions)
 * - Nested property access (dot notation)
 * - Custom renderers
 * - Feature flags (sorting, filtering, etc.)
 *
 * @module @gridkit/core/types/column
 */

import type { RowData, ColumnId } from './base';
import type { Table } from './table';

// Temporary type for Row - will be properly defined in CORE-004
// TODO: Replace with actual Row type from CORE-004
type Row<_TData extends RowData> = any;

/**
 * Function that extracts cell value from row data.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @param row - Row data
 * @returns Cell value
 *
 * @example
 * ```typescript
 * const accessor: AccessorFn<User, string> = (row) =>
 *   `${row.firstName} ${row.lastName}`;
 * ```
 *
 * @public
 */
export type AccessorFn<TData extends RowData, TValue = unknown> = (
  row: TData
) => TValue;

/**
 * String key for accessing row data.
 * Supports dot notation for nested properties.
 *
 * @template TData - Row data type
 *
 * @example
 * ```typescript
 * type Key = AccessorKey<User>; // 'name' | 'email' | 'profile.avatar' | ...
 * ```
 *
 * @public
 */
export type AccessorKey<TData extends RowData> = string &
  {
    [K in string]: K extends keyof TData
      ? K
      : K extends `${infer First}.${infer Rest}`
        ? First extends keyof TData
          ? TData[First] extends RowData
            ? Rest extends AccessorKey<TData[First]>
              ? K
              : never
            : never
          : never
        : never;
  }[string];

/**
 * Context provided to header renderers.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @public
 */
export interface HeaderContext<TData extends RowData, TValue = unknown> {
  /**
   * Column instance
   */
  column: Column<TData, TValue>;

  /**
   * Table instance
   */
  table: Table<TData>;
}

/**
 * Context provided to cell renderers.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @public
 */
export interface CellContext<TData extends RowData, TValue = unknown> {
  /**
   * Get the cell value.
   * Uses accessor function/key defined in column.
   *
   * @returns Cell value
   */
  getValue(): TValue;

  /**
   * Row instance
   */
  row: Row<TData>;

  /**
   * Column instance
   */
  column: Column<TData, TValue>;

  /**
   * Table instance
   */
  table: Table<TData>;

  /**
   * Render the value using default renderer.
   * Useful for wrapping default behavior.
   *
   * @returns Rendered value
   */
  renderValue(): unknown;
}

/**
 * Context provided to footer renderers.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @public
 */
export interface FooterContext<TData extends RowData, TValue = unknown> {
  /**
   * Column instance
   */
  column: Column<TData, TValue>;

  /**
   * Table instance
   */
  table: Table<TData>;
}

/**
 * Header renderer function or component.
 * Can return any renderable value (string, React element, etc.).
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @public
 */
export type HeaderRenderer<TData extends RowData, TValue = unknown> = (
  context: HeaderContext<TData, TValue>
) => unknown;

/**
 * Cell renderer function or component.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @public
 */
export type CellRenderer<TData extends RowData, TValue = unknown> = (
  context: CellContext<TData, TValue>
) => unknown;

/**
 * Footer renderer function or component.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @public
 */
export type FooterRenderer<TData extends RowData, TValue = unknown> = (
  context: FooterContext<TData, TValue>
) => unknown;

/**
 * Column definition.
 * Defines how a column behaves and renders.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type (inferred from accessor)
 *
 * @example
 * Simple column:
 * ```typescript
 * const column: ColumnDef<User> = {
 *   accessorKey: 'name',
 *   header: 'Name',
 * };
 * ```
 *
 * @example
 * With custom accessor:
 * ```typescript
 * const column: ColumnDef<User, string> = {
 *   id: 'fullName',
 *   accessorFn: (row) => `${row.firstName} ${row.lastName}`,
 *   header: 'Full Name',
 * };
 * ```
 *
 * @example
 * With custom renderer:
 * ```typescript
 * const column: ColumnDef<User> = {
 *   accessorKey: 'email',
 *   header: 'Email',
 *   cell: ({ getValue }) => (
 *     <a href={`mailto:${getValue()}`}>{getValue()}</a>
 *   ),
 * };
 * ```
 *
 * @public
 */
export interface ColumnDef<TData extends RowData, TValue = unknown> {
  /**
   * Unique column identifier.
   * Auto-generated from accessorKey if not provided.
   * Required when using accessorFn.
   *
   * @example
   * ```typescript
   * { id: 'fullName' }
   * ```
   */
  id?: ColumnId;

  /**
   * Key to access data from row object.
   * Supports dot notation: 'user.profile.name'
   *
   * Cannot be used with accessorFn (mutually exclusive).
   *
   * @example
   * ```typescript
   * { accessorKey: 'name' } // row.name
   * { accessorKey: 'user.email' } // row.user.email
   * ```
   */
  accessorKey?: AccessorKey<TData>;

  /**
   * Custom accessor function.
   * Use when accessorKey is not sufficient.
   *
   * Cannot be used with accessorKey (mutually exclusive).
   * Requires 'id' to be specified.
   *
   * @example
   * ```typescript
   * {
   *   id: 'fullName',
   *   accessorFn: (row) => `${row.firstName} ${row.lastName}`,
   * }
   * ```
   */
  accessorFn?: AccessorFn<TData, TValue>;

  /**
   * Column header.
   * Can be a string or custom render function.
   *
   * @default Column ID
   *
   * @example
   * ```typescript
   * { header: 'Full Name' }
   *
   * {
   *   header: ({ column }) => (
   *     <div>
   *       {column.id}
   *       {column.getIsSorted() && <SortIcon />}
   *     </div>
   *   ),
   * }
   * ```
   */
  header?: string | HeaderRenderer<TData, TValue>;

  /**
   * Footer content.
   * Can be a string or custom render function.
   *
   * @example
   * ```typescript
   * { footer: 'Total' }
   *
   * {
   *   footer: ({ table }) => (
   *     <div>Total: {table.getRowModel().rows.length}</div>
   *   ),
   * }
   * ```
   */
  footer?: string | FooterRenderer<TData, TValue>;

  /**
   * Cell renderer.
   * Defaults to displaying the raw value.
   *
   * @example
   * ```typescript
   * {
   *   cell: ({ getValue }) => (
   *     <strong>{getValue().toUpperCase()}</strong>
   *   ),
   * }
   * ```
   */
  cell?: CellRenderer<TData, TValue>;

  /**
   * Column width in pixels.
   *
   * @default 150
   */
  size?: number;

  /**
   * Minimum width in pixels.
   *
   * @default 50
   */
  minSize?: number;

  /**
   * Maximum width in pixels.
   *
   * @default Number.MAX_SAFE_INTEGER
   */
  maxSize?: number;

  /**
   * Enable sorting for this column.
   *
   * @default true
   */
  enableSorting?: boolean;

  /**
   * Enable filtering for this column.
   *
   * @default true
   */
  enableFiltering?: boolean;

  /**
   * Enable resizing for this column.
   *
   * @default true
   */
  enableResizing?: boolean;

  /**
   * Enable hiding/showing for this column.
   *
   * @default true
   */
  enableHiding?: boolean;

  /**
   * Custom metadata for this column.
   * Not used by GridKit internally.
   *
   * @example
   * ```typescript
   * {
   *   meta: {
   *     type: 'currency',
   *     align: 'right',
   *   },
   * }
   * ```
   */
  meta?: ColumnMeta;
}

/**
 * Custom column metadata.
 * Can be extended for application-specific data.
 *
 * @public
 */
export type ColumnMeta = Record<string, unknown>;

/**
 * Runtime column instance.
 * Created from ColumnDef.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 *
 * @public
 */
export interface Column<TData extends RowData, TValue = unknown> {
  /**
   * Unique column ID.
   */
  readonly id: ColumnId;

  /**
   * Reference to parent table.
   */
  readonly table: Table<TData>;

  /**
   * Original column definition.
   */
  readonly columnDef: ColumnDef<TData, TValue>;

  /**
   * Get current column size in pixels.
   *
   * @returns Column width
   */
  getSize(): number;

  /**
   * Check if column is visible.
   *
   * @returns True if visible
   */
  getIsVisible(): boolean;

  /**
   * Toggle column visibility.
   *
   * @param value - New visibility state (toggles if undefined)
   */
  toggleVisibility(value?: boolean): void;

  /**
   * Reset column to default size.
   */
  resetSize(): void;

  /**
   * Get column index in current order.
   *
   * @returns Column index (0-based)
   */
  getIndex(): number;
}
