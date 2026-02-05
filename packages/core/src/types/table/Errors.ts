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
  | 'PLUGIN_REGISTRATION_FAILED';