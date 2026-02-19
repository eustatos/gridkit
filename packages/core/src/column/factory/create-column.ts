// Main factory function for creating column instances
import { validateColumnDef } from '../validation/validate-column';

import { createAccessor } from './accessor-system';
import { buildColumnMethods } from './build-column-methods';

import type { RowData, Column } from '@/types';
import type { ColumnDef, ValidatedColumnDef } from '@/types/column';
import type { ColumnUtils } from '@/types/column/SupportingTypes';
import type { Table } from '@/types/table';

/**
 * Options for creating a column instance.
 */
export interface CreateColumnOptions<TData extends RowData, TValue = unknown> {
  columnDef: ColumnDef<TData, TValue>;
  table: Table<TData>;
}

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
 * Internal column metadata.
 */
interface ColumnMetadata {
  columnMeta: Record<string, unknown>;
  columnUtils: ColumnUtils<TData, TValue> | Record<string, unknown>;
  featureFlags: ColumnFeatureFlags;
}

/**
 * Extracts metadata from validated column definition.
 */
function extractColumnMetadata<TData extends RowData, TValue>(
  validatedDef: ValidatedColumnDef<TData, TValue>
): ColumnMetadata {
  return {
    columnMeta: validatedDef.meta ?? {},
    columnUtils: {}, // Will be implemented in future tasks
    featureFlags: {
      hasSorting: validatedDef.enableSorting ?? true,
      hasFiltering: validatedDef.enableFiltering ?? true,
      hasPinning: validatedDef.enablePinning ?? false,
      hasResizing: validatedDef.enableResizing ?? true,
      hasHiding: validatedDef.enableHiding ?? true,
      hasReordering: validatedDef.enableReordering ?? true,
    },
  };
}

/**
 * Creates a runtime column instance from definition.
 * Handles type inference, validation, and feature enablement.
 */
export function createColumn<TData extends RowData, TValue = unknown>(
  options: CreateColumnOptions<TData, TValue>
): Column<TData, TValue> {
  // 1. Validate and normalize definition
  const validatedDef = validateColumnDef(options.columnDef, options.table);

  // 2. Extract column metadata
  const metadata = extractColumnMetadata(validatedDef);

  // 3. Create runtime methods
  const methods = buildColumnMethods(validatedDef, options.table);

  // 4. Create accessor
  const accessor = createAccessor(validatedDef);

  // 5. Build column instance
  const column: Column<TData, TValue> = {
    // Identification
    id: validatedDef.id,
    table: options.table,
    columnDef: Object.freeze(validatedDef) as typeof validatedDef,

    // State accessors
    getSize: methods.getSize,
    getIsVisible: methods.getIsVisible,
    getIndex: methods.getIndex,
    getPinnedPosition: methods.getPinnedPosition,

    // State mutators
    toggleVisibility: methods.toggleVisibility,
    setSize: methods.setSize,
    resetSize: methods.resetSize,
    togglePinned: methods.togglePinned,

    // Feature state
    getIsSorted: methods.getIsSorted,
    getSortDirection: methods.getSortDirection,
    toggleSorting: methods.toggleSorting,
    getIsFiltered: methods.getIsFiltered,
    getFilterValue: methods.getFilterValue,
    setFilterValue: methods.setFilterValue,

    // Metadata
    meta: metadata.columnMeta,
    utils: metadata.columnUtils as ColumnUtils<TData, TValue>,

    // Internal (for performance)
    _internal: {
      accessor: accessor,
      featureFlags: metadata.featureFlags,
      stateWatchers: new Set(),
    },
  };

  return column;
}
