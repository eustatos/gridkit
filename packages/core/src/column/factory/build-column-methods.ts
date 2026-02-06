// Builds all runtime methods for column instance
import type { RowData } from '@/types/base';
import type { ValidatedColumnDef } from '../validation/validate-column';
import type { Table } from '@/types/table/Table';
import { buildSizeMethods } from '../methods/size-methods';
import { buildVisibilityMethods } from '../methods/visibility-methods';
import { buildSortingMethods } from '../methods/sorting-methods';
import { buildFilteringMethods } from '../methods/filtering-methods';
import { buildPinningMethods } from '../methods/pinning-methods';
import { buildIndexMethods } from '../methods/index-methods';

/**
 * Combined column methods interface.
 */
export interface ColumnMethods<TData, TValue> {
  // Size management
  getSize: () => number;
  setSize: (size: number) => void;
  resetSize: () => void;

  // Visibility
  getIsVisible: () => boolean;
  toggleVisibility: (visible?: boolean) => void;

  // Sorting
  getIsSorted: () => boolean;
  getSortDirection: () => 'asc' | 'desc' | false;
  toggleSorting: (desc?: boolean) => void;

  // Filtering
  getIsFiltered: () => boolean;
  getFilterValue: () => unknown;
  setFilterValue: (value: unknown) => void;

  // Pinning
  getPinnedPosition: () => 'left' | 'right' | false;
  togglePinned: (position?: 'left' | 'right' | false) => void;

  // Index
  getIndex: () => number;
}

/**
 * Builds runtime methods for column instance.
 */
export function buildColumnMethods<TData, TValue>(
  columnDef: ValidatedColumnDef<TData, TValue>,
  table: Table<TData>
): ColumnMethods<TData, TValue> {
  const tableState = () => table.getState();

  // Build all method groups
  const sizeMethods = buildSizeMethods(columnDef, table);
  const visibilityMethods = buildVisibilityMethods(columnDef, table);
  const sortingMethods = buildSortingMethods(columnDef, table);
  const filteringMethods = buildFilteringMethods(columnDef, table);
  const pinningMethods = buildPinningMethods(columnDef, table);
  const indexMethods = buildIndexMethods(columnDef, table);

  return {
    // Size management
    getSize: sizeMethods.getSize,
    setSize: sizeMethods.setSize,
    resetSize: sizeMethods.resetSize,

    // Visibility
    getIsVisible: visibilityMethods.getIsVisible,
    toggleVisibility: visibilityMethods.toggleVisibility,

    // Sorting
    getIsSorted: sortingMethods.getIsSorted,
    getSortDirection: sortingMethods.getSortDirection,
    toggleSorting: sortingMethods.toggleSorting,

    // Filtering
    getIsFiltered: filteringMethods.getIsFiltered,
    getFilterValue: filteringMethods.getFilterValue,
    setFilterValue: filteringMethods.setFilterValue,

    // Pinning
    getPinnedPosition: pinningMethods.getPinnedPosition,
    togglePinned: pinningMethods.togglePinned,

    // Index
    getIndex: indexMethods.getIndex,
  };
}