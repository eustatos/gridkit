// Column definition validation


import type { RowData } from '@/types';
import type { ColumnDef, ValidatedColumnDef } from '@/types/column/ColumnDef';
import type { ColumnId } from '@/types/column/SupportingTypes';
import { createColumnId } from '@/types/factory';

import { GridKitError } from '../../errors/grid-kit-error';
import { normalizeColumnDef } from '../validation/normalize-column';

/**
 * Validates column definition and returns normalized version.
 */
export function validateColumnDef<TData extends RowData, TValue>(
  columnDef: ColumnDef<TData, TValue>
): ValidatedColumnDef<TData, TValue> {
  const errors: string[] = [];

  // Check for required fields
  if (!columnDef.accessorKey && !columnDef.accessorFn) {
    errors.push('Column must have either accessorKey or accessorFn');
  }

  // Validate ID
  let id: ColumnId | undefined = columnDef.id;
  if (!id) {
    if (columnDef.accessorKey) {
      id = createColumnId(columnDef.accessorKey);
    } else {
      errors.push('Column must have an id when using accessorFn');
    }
  }

  // Validate duplicate accessor definitions
  if (columnDef.accessorKey && columnDef.accessorFn) {
    errors.push('Column cannot have both accessorKey and accessorFn');
  }

  // Validate dot notation for accessorKey
  if (columnDef.accessorKey && columnDef.accessorKey.includes('..')) {
    errors.push('Invalid dot notation in accessorKey');
  }

  if (errors.length > 0) {
    throw new GridKitError('INVALID_COLUMN_DEFINITION', 'Invalid column definition', { errors, columnDef });
  }

  // Normalize with defaults
  const normalizedDef = {
    ...columnDef,
    id: id,
  };

  return normalizeColumnDef(normalizedDef);
}
