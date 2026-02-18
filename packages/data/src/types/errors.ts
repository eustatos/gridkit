/**
 * Data error information.
 */
export interface DataErrorInfo {
  /**
   * Error code.
   */
  code: DataErrorCode;

  /**
   * Error message.
   */
  message: string;

  /**
   * Original error (if any).
   */
  originalError?: unknown;

  /**
   * Error context.
   */
  context?: Record<string, unknown>;

  /**
   * Error timestamp.
   */
  timestamp: number;
}

/**
 * Data error codes.
 */
export type DataErrorCode =
  | 'DATA_LOAD_FAILED'
  | 'DATA_SAVE_FAILED'
  | 'DATA_VALIDATION_FAILED'
  | 'DATA_CONNECTION_FAILED'
  | 'DATA_TIMEOUT'
  | 'DATA_UNAUTHORIZED'
  | 'DATA_FORBIDDEN'
  | 'DATA_NOT_FOUND'
  | 'DATA_CONFLICT'
  | 'DATA_INVALID_FORMAT'
  | 'DATA_QUOTA_EXCEEDED'
  | 'DATA_CANCELLED';
