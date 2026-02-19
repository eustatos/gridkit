import { GridKitError, ValidationAggregateError } from '../../errors';
import type {
  RowData,
  ValidatedTableOptions,
  ValidationError,
} from '../../types';

import {
  normalizeColumns,
  normalizeDebugOptions,
  normalizeInitialState,
  defaultGetRowId,
} from './normalization';

/**
 * Comprehensive validation with helpful error messages.
 * Each validation is isolated for better error reporting.
 */
export function validateAndNormalize<TData extends RowData>(
  options: TableOptions<TData>
): ValidatedTableOptions<TData> {
  const errors: ValidationError[] = [];

  // === Required Fields Validation ===
  if (!options || typeof options !== 'object') {
    throw new GridKitError(
      'INVALID_OPTIONS',
      'Table options must be an object'
    );
  }

  // Column validation (most critical)
  const columnErrors = validateColumns(options.columns);
  errors.push(...columnErrors);

  // Data validation
  if (options.data !== undefined) {
    const dataErrors = validateData(options.data);
    errors.push(...dataErrors);
  }

  // ID function validation
  if (options.getRowId) {
    const idErrors = validateRowIdFunction(options.getRowId);
    errors.push(...idErrors);
  }

  // Throw aggregated errors if any
  if (errors.length > 0) {
    // Convert ValidationError objects to GridKitError for ValidationAggregateError
    const gridErrors: GridKitError[] = errors.map((error) =>
      new GridKitError(error.code, error.message, { field: error.field, value: error.value })
    );
    throw new ValidationAggregateError('Invalid table configuration', gridErrors);
  }

  // === Normalization ===
  return {
    ...options,
    columns: normalizeColumns(options.columns, options.defaultColumn),
    data: options.data ?? [],
    getRowId: options.getRowId ?? defaultGetRowId,
    debug: normalizeDebugOptions(options.debug),
    meta: options.meta ?? {},
    initialState: normalizeInitialState(options.initialState),
  };
}

/**
 * Column validation with detailed error messages.
 */
function validateColumns(columns: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(columns)) {
    errors.push({
      code: 'COLUMNS_NOT_ARRAY',
      message: 'columns must be an array',
      field: 'columns',
      value: columns,
    });
    return errors;
  }

  if (columns.length === 0) {
    errors.push({
      code: 'NO_COLUMNS',
      message: 'At least one column definition is required',
      field: 'columns',
      value: columns,
    });
  }

  // Validate each column
  columns.forEach((col, index) => {
    if (!col || typeof col !== 'object') {
      errors.push({
        code: 'INVALID_COLUMN_DEF',
        message: `Column at index ${index} must be an object`,
        field: `columns[${index}]`,
        value: col,
      });
      return;
    }

    // Check for required fields
    if (!col.accessorKey && !col.accessorFn) {
      errors.push({
        code: 'NO_ACCESSOR',
        message: `Column at index ${index} must have either accessorKey or accessorFn`,
        field: `columns[${index}].accessor`,
        value: col,
      });
    }

      // Check for duplicate IDs
  // const columnId = col.id ?? col.accessorKey;
  // ... duplicate detection logic
  });

  return errors;
}

/**
 * Data validation with detailed error messages.
 * Validates that data is an array of objects.
 */
function validateData(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data)) {
    errors.push({
      code: 'DATA_NOT_ARRAY',
      message: 'data must be an array',
      field: 'data',
      value: data,
    });
    return errors;
  }

  // Check each row in the data
  data.forEach((row, index) => {
    if (row === null || row === undefined) {
      errors.push({
        code: 'INVALID_ROW_DATA',
        message: `Row at index ${index} is null or undefined`,
        field: `data[${index}]`,
        value: row,
      });
    } else if (typeof row !== 'object' || Array.isArray(row)) {
      errors.push({
        code: 'INVALID_ROW_TYPE',
        message: `Row at index ${index} must be an object, got ${Array.isArray(row) ? 'array' : typeof row}`,
        field: `data[${index}]`,
        value: row,
      });
    }
  });

  return errors;
}

function validateRowIdFunction(_getRowId: unknown): ValidationError[] {
  // In a real implementation, this would validate the getRowId function
  return [];
}
