// SupportingTypes.ts
// Supporting types for column system

import type { RowData } from '../base'

/**
 * Column ID type
 */
export type ColumnId = string;

/**
 * Column Group ID type
 */
export type ColumnGroupId = string;

/**
 * Comparator function type for sorting
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Filter function type
 */
export type FilterFn<TData, TValue> = (
  row: TData,
  value: TValue,
  filterValue: unknown
) => boolean;

/**
 * Aggregation function type
 */
export type AggregationFn<TValue> = (values: TValue[]) => TValue;

/**
 * Column metadata (extensible).
 */
export interface ColumnMeta {
  /** Display alignment */
  readonly align?: 'left' | 'center' | 'right';

  /** CSS class names */
  readonly className?: string;

  /** Tooltip text */
  readonly tooltip?: string;

  /** Formatting options */
  readonly format?: ColumnFormat;

  /** Custom properties */
  readonly [key: string]: unknown;
}

/**
 * Column format options
 */
export interface ColumnFormat {
  /** Number of decimal places for numbers */
  readonly decimals?: number;
  
  /** Date format string */
  readonly dateFormat?: string;
  
  /** Currency code */
  readonly currency?: string;
  
  /** Custom formatter function */
  readonly formatter?: (value: unknown) => string;
}

/**
 * Cell metadata.
 */
export interface CellMeta {
  /** Is cell editable */
  readonly editable?: boolean;

  /** Validation rules */
  readonly validation?: CellValidation;

  /** CSS classes */
  readonly className?: string;

  /** Data type hint */
  readonly type?: 'text' | 'number' | 'date' | 'boolean' | 'custom';
}

/**
 * Cell validation rules
 */
export interface CellValidation {
  /** Required field */
  readonly required?: boolean;
  
  /** Minimum value (for numbers) */
  readonly min?: number;
  
  /** Maximum value (for numbers) */
  readonly max?: number;
  
  /** Minimum length (for strings) */
  readonly minLength?: number;
  
  /** Maximum length (for strings) */
  readonly maxLength?: number;
  
  /** Regular expression pattern */
  readonly pattern?: RegExp;
  
  /** Custom validation function */
  readonly validator?: (value: unknown) => ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is value valid */
  readonly isValid: boolean;
  
  /** Error message if invalid */
  readonly errorMessage?: string;
}

/**
 * Column utilities for advanced use cases.
 */
export interface ColumnUtils<TData extends RowData, TValue> {
  /** Format value according to column rules */
  readonly formatValue: (value: TValue) => string;

  /** Parse input to value */
  readonly parseValue: (input: string) => TValue;

  /** Validate value */
  readonly validateValue: (value: TValue) => ValidationResult;

  /** Compare two values for sorting */
  readonly compareValues: (a: TValue, b: TValue) => number;

  /** Check if value matches filter */
  readonly matchesFilter: (value: TValue, filter: unknown) => boolean;
}