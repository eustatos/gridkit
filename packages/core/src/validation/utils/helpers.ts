/**
 * Validation utilities and helper functions.
 *
 * @module @gridkit/core/validation/utils
 */

import type {
  ValidationErrorCode,
  ValidationError,
  ValidationFix,
} from '../result/ValidationResult';

/**
 * Check if a value is a valid error.
 */
export function isValidError(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    'message' in value &&
    typeof (value as Error).message === 'string'
  );
}

/**
 * Check if a value is a valid validation error.
 */
export function isValidValidationError(
  value: unknown
): value is ValidationError {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const err = value as ValidationError;
  return (
    'code' in err &&
    'message' in err &&
    'path' in err &&
    'severity' in err &&
    'fixable' in err
  );
}

/**
 * Create a simple error message from a validation error.
 */
export function formatValidationError(error: ValidationError): string {
  const path = error.path.length > 0 ? ` at ${error.path.join('.')}` : '';
  return `[${error.code}] ${error.message}${path}`;
}

/**
 * Check if a validation error can be auto-fixed.
 */
export function canAutoFix(error: ValidationError): boolean {
  return error.fixable && error.fix?.type === 'auto';
}

/**
 * Apply an auto-fix to a validation error.
 */
export function applyFix(error: ValidationError): unknown | null {
  if (error.fix && error.fix.type === 'auto') {
    return error.fix.apply();
  }
  return null;
}

/**
 * Create a fix for a validation error.
 */
export function createFix(
  description: string,
  apply: () => unknown,
  type: 'auto' | 'suggestion' | 'manual' = 'auto',
  confidence: number = 0.8
): ValidationFix {
  return {
    type,
    description,
    apply,
    confidence,
  };
}

/**
 * Get the severity priority for sorting.
 */
export function getSeverityPriority(
  severity: 'error' | 'warning' | 'info'
): number {
  switch (severity) {
    case 'error':
      return 0;
    case 'warning':
      return 1;
    case 'info':
      return 2;
    default:
      return 3;
  }
}

/**
 * Sort errors by severity.
 */
export function sortErrorsBySeverity(
  errors: ValidationError[]
): ValidationError[] {
  return [...errors].sort((a, b) => {
    const priorityA = getSeverityPriority(a.severity);
    const priorityB = getSeverityPriority(b.severity);
    return priorityA - priorityB;
  });
}

/**
 * Check if a validation code matches a pattern.
 */
export function matchesErrorCode(
  code: ValidationErrorCode,
  pattern: string
): boolean {
  if (typeof pattern === 'string') {
    // Check if pattern contains wildcards
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(code);
    }
    return code === pattern;
  }
  return code === pattern;
}

/**
 * Filter errors by severity.
 */
export function filterErrorsBySeverity(
  errors: ValidationError[],
  severities: ('error' | 'warning' | 'info')[]
): ValidationError[] {
  return errors.filter((error) => severities.includes(error.severity));
}

/**
 * Group errors by path.
 */
export function groupErrorsByPath(
  errors: ValidationError[]
): Record<string, ValidationError[]> {
  return errors.reduce(
    (acc, error) => {
      const path = error.path.join('.');
      if (!acc[path]) {
        acc[path] = [];
      }
      acc[path].push(error);
      return acc;
    },
    {} as Record<string, ValidationError[]>
  );
}

/**
 * Collect all error codes from an array of errors.
 */
export function collectErrorCodes(
  errors: ValidationError[]
): Set<ValidationErrorCode> {
  return new Set(errors.map((error) => error.code as ValidationErrorCode));
}

/**
 * Create a validation error from a message.
 */
export function createSimpleError(
  code: ValidationErrorCode,
  message: string,
  path: string[] = [],
  severity: 'error' | 'warning' = 'error'
): ValidationError {
  return {
    code,
    message,
    path,
    value: 'Unknown',
    severity,
    fixable: false,
  };
}

/**
 * Create a type mismatch error.
 */
export function createTypeError(
  field: string,
  expected: string,
  received: unknown
): ValidationError {
  return createSimpleError(
    'FIELD_TYPE_MISMATCH',
    `Expected ${expected} for field '${field}', got ${typeof received}`,
    [field],
    'error'
  );
}

/**
 * Create a missing required field error.
 */
export function createMissingFieldError(field: string): ValidationError {
  return createSimpleError(
    'MISSING_REQUIRED_FIELD',
    `Missing required field: ${field}`,
    [field],
    'error'
  );
}

/**
 * Create a constraint violation error.
 */
export function createConstraintError(
  field: string,
  code: ValidationErrorCode,
  message: string
): ValidationError {
  return createSimpleError(
    code,
    `Field '${field}': ${message}`,
    [field],
    'error'
  );
}

/**
 * Check if a value is a valid Date object.
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if a value is a valid number.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if a value is a valid string.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if a value is a valid boolean.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if a value is a valid array.
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a valid object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep clone a value.
 */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }

  return Object.entries(value).reduce(
    (acc, [key, val]) => ({
      ...acc,
      [key]: deepClone(val),
    }),
    {} as T
  );
}

/**
 * Get the size of an object in bytes (approximate).
 */
export function getObjectSize(obj: Record<string, unknown>): number {
  if (obj === null || typeof obj !== 'object') {
    return 0;
  }

  let bytes = 0;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      bytes += getObjectSize(item);
    }
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        bytes += key.length * 2; // UTF-16
        bytes += getObjectSize(obj[key] as Record<string, unknown>);
      }
    }
  }

  return bytes;
}

/**
 * Simple debounce function.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Simple throttle function.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
}
