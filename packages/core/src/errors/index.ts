/*
 * GridKit Error System
 *
 * Custom error class with error codes and context for better debugging.
 * All errors in GridKit should use this class instead of native Error.
 *
 * @module @gridkit/core/errors
 */

/**
 * Standard error codes used throughout GridKit.
 *
 * @example
 * throw new GridKitError('TABLE_NO_COLUMNS', 'At least one column is required');
 *
 * @public
 */
export type ErrorCode =
  // Table errors
  | 'TABLE_INVALID_OPTIONS'
  | 'TABLE_NO_COLUMNS'
  | 'TABLE_DESTROYED'
  | 'TABLE_INVALID_STATE'
  | 'TABLE_NOT_INITIALIZED'

  // Column errors
  | 'COLUMN_INVALID_ACCESSOR'
  | 'COLUMN_DUPLICATE_ID'
  | 'COLUMN_NOT_FOUND'
  | 'COLUMN_INVALID_DEFINITION'

  // Row errors
  | 'ROW_INVALID_ID'
  | 'ROW_NOT_FOUND'
  | 'ROW_INVALID_DATA'

  // State errors
  | 'STATE_UPDATE_FAILED'
  | 'STATE_INVALID'
  | 'STATE_DESTROYED'

  // Data errors
  | 'DATA_INVALID'
  | 'DATA_LOAD_FAILED'

  // Validation errors
  | 'VALIDATION_FAILED'

  // Plugin errors
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_REGISTRATION_FAILED'
  | 'PLUGIN_DEPENDENCY_FAILED'

  // Context errors
  | 'CONTEXT_SIZE_LIMIT'
  | 'CONTEXT_COUNT_LIMIT'
  | 'CONTEXT_TOTAL_SIZE_LIMIT'
  | 'CONTEXT_VALIDATION_FAILED'
  | 'CONTEXT_NOT_FOUND'
  | 'CONTEXT_EXPIRED'
  | 'CONTEXT_ALREADY_EXISTS'

  // Config errors
  | 'CONFIG_LOAD_FAILED'
  | 'CONFIG_VALIDATION_FAILED'
  | 'CONFIG_NOT_FOUND'
  | 'CONFIG_PARSE_ERROR'

  // Provider errors
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_VALIDATION_FAILED'
  | 'PROVIDER_LOAD_FAILED'
  | 'PROVIDER_SAVE_FAILED'
  | 'PROVIDER_INITIALIZATION_FAILED'
  | 'PROVIDER_DISPOSAL_FAILED'
  | 'PROVIDER_CONFIG_INVALID'
  | 'CIRCULAR_DEPENDENCY';

/**
 * Custom error class for GridKit with structured error information.
 *
 * @example
 * throw new GridKitError(
 *   'TABLE_NO_COLUMNS',
 *   'At least one column is required',
 *   { providedColumns: [] }
 * );
 *
 * @public
 */
export class GridKitError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GridKitError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GridKitError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }

  static fromUnknown(
    error: unknown,
    fallbackCode: ErrorCode = 'VALIDATION_FAILED'
  ): GridKitError {
    if (error instanceof GridKitError) {
      return error;
    }

    if (error instanceof Error) {
      return new GridKitError(fallbackCode, error.message, {
        originalError: error,
      });
    }

    return new GridKitError(fallbackCode, String(error), {
      originalError: error,
    });
  }
}

export function isGridKitError(error: unknown): error is GridKitError {
  return error instanceof GridKitError;
}

export function assert(
  condition: boolean,
  code: ErrorCode,
  message: string,
  context?: Record<string, unknown>
): asserts condition {
  if (!condition) {
    throw new GridKitError(code, message, context);
  }
}
