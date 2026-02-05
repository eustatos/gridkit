// RenderContext.ts
// Renderer context types for header, cell, and footer renderers

import type { RowData } from '../base'
import type { Column } from './ColumnInstance'
import type { Table } from '../table/Table'
import type { Row } from '../table/Row'
import type { CellMeta } from './SupportingTypes'

/**
 * Context provided to header renderers.
 * Includes column state and utilities.
 */
export interface HeaderContext<TData extends RowData, TValue = unknown> {
  /** Column instance */
  readonly column: Column<TData, TValue>;

  /** Table instance */
  readonly table: Table<TData>;

  /** Header string (if provided) */
  readonly header: string;

  /** Check if column is sorted */
  readonly getIsSorted: () => boolean;

  /** Get sort direction */
  readonly getSortDirection: () => 'asc' | 'desc' | false;

  /** Toggle sorting */
  readonly toggleSorting: (desc?: boolean) => void;
}

/**
 * Rich context for cell renderers with typed value access.
 */
export interface CellContext<TData extends RowData, TValue = unknown> {
  /** Get typed cell value */
  readonly getValue: () => TValue;

  /** Get raw row data */
  readonly getRow: () => Row<TData>;

  /** Get column instance */
  readonly column: Column<TData, TValue>;

  /** Get table instance */
  readonly table: Table<TData>;

  /** Row index in current view */
  readonly rowIndex: number;

  /** Cell index in row */
  readonly cellIndex: number;

  /** Check if cell is selected */
  readonly getIsSelected: () => boolean;

  /** Render default cell content */
  readonly renderValue: () => unknown;

  /** Cell metadata */
  readonly meta: CellMeta;
}

/**
 * Context for footer renderers.
 */
export interface FooterContext<TData extends RowData, TValue = unknown> {
  readonly column: Column<TData, TValue>;
  readonly table: Table<TData>;
  readonly footer: string;
}

/**
 * Renderer function types.
 */
export type HeaderRenderer<TData, TValue> = (
  context: HeaderContext<TData, TValue>
) => unknown;

export type CellRenderer<TData, TValue> = (
  context: CellContext<TData, TValue>
) => unknown;

export type FooterRenderer<TData, TValue> = (
  context: FooterContext<TData, TValue>
) => unknown;