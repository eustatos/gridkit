/**
 * Error utilities for data providers.
 */

import type { DataErrorInfo, DataErrorCode } from '../../types';

/**
 * Creates a data error with proper structure.
 */
export function createDataError(
  code: DataErrorCode,
  message: string,
  originalError?: unknown
): DataErrorInfo {
  return {
    code,
    message,
    originalError,
    timestamp: Date.now(),
  };
}
