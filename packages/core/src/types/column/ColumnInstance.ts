// ColumnInstance.ts
// Runtime column instance with state and methods

import type { RowData } from '../base'
import type { ColumnDef } from './ColumnDef'
import type { Table } from '../table/Table'
import type { ColumnId, ColumnMeta, ColumnUtils } from './SupportingTypes'
import type { ColumnAccessor } from '../../column/factory/accessor-system'

/**
 * Internal feature flags for column.
 */
interface ColumnFeatureFlags {
  hasSorting: boolean;
  hasFiltering: boolean;
  hasPinning: boolean;
  hasResizing: boolean;
  hasHiding: boolean;
  hasReordering: boolean;
}

/**
 * Internal column properties for performance optimization.
 */
interface ColumnInternal<TData extends RowData, TValue> {
  /**
   * Type-safe accessor for extracting cell values.
   */
  accessor: ColumnAccessor<TData, TValue>;

  /**
   * Feature flags for conditional method availability.
   */
  featureFlags: ColumnFeatureFlags;

  /**
   * State watchers for reactive updates.
   */
  stateWatchers: Set<Function>;
}

/**
 * Runtime column instance with state and methods.
 * Created from ColumnDef with added runtime capabilities.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 */
export interface Column<TData extends RowData, TValue = unknown> {
  // === Identification ===

  /** Unique column ID */
  readonly id: ColumnId;

  /** Parent table reference */
  readonly table: Table<TData>;

  /** Original column definition */
  readonly columnDef: ColumnDef<TData, TValue>;

  // === State Accessors ===

  /** Get current width */
  readonly getSize: () => number;

  /** Check if visible */
  readonly getIsVisible: () => boolean;

  /** Get display index */
  readonly getIndex: () => number;

  /** Get pinned position */
  readonly getPinnedPosition: () => 'left' | 'right' | false;

  // === State Mutators ===

  /** Toggle visibility */
  readonly toggleVisibility: (visible?: boolean) => void;

  /** Update size */
  readonly setSize: (size: number) => void;

  /** Reset to default size */
  readonly resetSize: () => void;

  /** Toggle pinning */
  readonly togglePinned: (position?: 'left' | 'right' | false) => void;

  // === Feature State ===

  /** Check if sorted */
  readonly getIsSorted: () => boolean;

  /** Get sort direction */
  readonly getSortDirection: () => 'asc' | 'desc' | false;

  /** Toggle sorting */
  readonly toggleSorting: (desc?: boolean) => void;

  /** Check if filtered */
  readonly getIsFiltered: () => boolean;

  /** Get filter value */
  readonly getFilterValue: () => unknown;

  /** Set filter value */
  readonly setFilterValue: (value: unknown) => void;

  // === Metadata ===

  /** Column metadata */
  readonly meta: ColumnMeta;

  /** Custom utilities */
  readonly utils: ColumnUtils<TData, TValue>;

  // === Internal (Performance) ===

  /**
   * Internal properties for performance optimization.
   * Not part of public API - for internal use only.
   */
  readonly _internal: ColumnInternal<TData, TValue>;
}