/**
 * Error types.
 *
 * Contains all types related to GridKit errors.
 *
 * @module @gridkit/core/types/table/errors
 */

// ===================================================================
// GridKit Error Types
// ===================================================================

/**
 * GridKit error interface.
 */
export interface GridKitError extends Error {
  /**
   * Error code.
   */
  code: ErrorCode;

  /**
   * Error message.
   */
  message: string;

  /**
   * Additional context data.
   */
  context?: Record<string, unknown>;
}

/**
 * Error codes for GridKit errors.
 */
export type ErrorCode =
  // Table errors
  | 'TABLE_INVALID_OPTIONS'
  | 'TABLE_NO_COLUMNS'
  | 'TABLE_DESTROYED'
  // Column errors
  | 'COLUMN_INVALID_ACCESSOR'
  | 'COLUMN_DUPLICATE_ID'
  | 'COLUMN_NOT_FOUND'
  // Row errors
  | 'ROW_INVALID_ID'
  | 'ROW_NOT_FOUND'
  // State errors
  | 'STATE_UPDATE_FAILED'
  | 'STATE_INVALID'
  // Data errors
  | 'DATA_LOAD_FAILED'
  | 'DATA_INVALID_RESPONSE'
  // Plugin errors
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_REGISTRATION_FAILED'
  // Validation errors
  | 'COLUMNS_NOT_ARRAY'
  | 'NO_COLUMNS'
  | 'INVALID_COLUMN_DEF'
  | 'NO_ACCESSOR'
  | 'DATA_NOT_ARRAY'
  | 'INVALID_ROW_DATA'
  | 'INVALID_ROW_TYPE'
  | 'INVALID_FIELD_VALUE'
  | 'MIN_VALUE_VIOLATION'
  | 'MAX_VALUE_VIOLATION'
  | 'MIN_LENGTH_VIOLATION'
  | 'MAX_LENGTH_VIOLATION'
  | 'PATTERN_MISMATCH'
  | 'ENUM_VIOLATION'
  | 'INVALID_STATE_TRANSITION'
  | 'CONCURRENT_MODIFICATION'
  | 'STATE_CORRUPTION'
  | 'PERFORMANCE_BUDGET_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'EXECUTION_TIMEOUT'
  | 'CUSTOM_VALIDATION_FAILED';

/**
 * Validation error interface.
 */
export interface ValidationError {
  /**
   * Error code.
   */
  code: ErrorCode;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Field path that caused the error.
   */
  field: string;

  /**
   * The value that caused the error.
   */
  value: unknown;
}

/**
 * Validation error code type for runtime validation.
 */
export type ValidationErrorCode =
  // Schema errors
  | 'INVALID_SCHEMA'
  | 'MISSING_REQUIRED_FIELD'
  | 'FIELD_TYPE_MISMATCH'
  | 'INVALID_FIELD_VALUE'

  // Data errors
  | 'INVALID_ROW_DATA'
  | 'DUPLICATE_ROW_ID'
  | 'INVALID_COLUMN_ACCESSOR'
  | 'INVALID_CELL_VALUE'

  // Constraint errors
  | 'MIN_VALUE_VIOLATION'
  | 'MAX_VALUE_VIOLATION'
  | 'MIN_LENGTH_VIOLATION'
  | 'MAX_LENGTH_VIOLATION'
  | 'PATTERN_MISMATCH'
  | 'ENUM_VIOLATION'

  // State errors
  | 'INVALID_STATE_TRANSITION'
  | 'CONCURRENT_MODIFICATION'
  | 'STATE_CORRUPTION'

  // Performance errors
  | 'PERFORMANCE_BUDGET_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'EXECUTION_TIMEOUT'

  // Custom errors
  | 'CUSTOM_VALIDATION_FAILED';