// Errors.ts - Error types for GridKit

import type { ErrorCode, ValidationErrorCode } from '../base';

/**
 * GridKit error class with structured error information
 */
export class GridKitError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'GridKitError';
  }
}

/**
 * Validation error class for structured validation failures
 */
export class ValidationError extends Error {
  readonly code: ValidationErrorCode;
  readonly field?: string;
  readonly value?: unknown;

  constructor(
    code: ValidationErrorCode,
    message: string,
    options?: {
      field?: string;
      value?: unknown;
    }
  ) {
    super(message);
    this.code = code;
    this.field = options?.field;
    this.value = options?.value;
    this.name = 'ValidationError';
  }
}

/**
 * Error handler interface for table-level error handling
 */
export interface ErrorHandler {
  /**
   * Handle an error
   * @param error - The error to handle
   */
  (error: GridKitError): void;
}

/**
 * Create a GridKit error
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 */
export function createGridKitError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): GridKitError {
  return new GridKitError(code, message, details);
}

/**
 * Create a validation error
 * @param code - Validation error code
 * @param message - Error message
 * @param options - Optional error options
 */
export function createValidationError(
  code: ValidationErrorCode,
  message: string,
  options?: {
    field?: string;
    value?: unknown;
  }
): ValidationError {
  return new ValidationError(code, message, options);
}
