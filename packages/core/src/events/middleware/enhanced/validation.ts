/**
 * Validation Middleware
 * 
 * Validates events against a schema before processing.
 * 
 * @module @gridkit/core/events/middleware/enhanced/validation
 */

import type { EnhancedMiddleware, ValidationMiddlewareOptions, EnhancedGridEvent } from './types';

/**
 * Create validation middleware
 * 
 * @param options - Validation options
 * @returns Validation middleware
 */
export function createValidationMiddleware<T = unknown>(
  options: ValidationMiddlewareOptions<T> = {}
): EnhancedMiddleware<EnhancedGridEvent<T>> {
  const {
    schema,
    validate,
    onInvalid = 'cancel',
    report = (event, error) => console.warn(`[Validation] ${event.type}: ${error}`),
  } = options;

  const isValid = (event: any): { valid: boolean; error?: string } => {
    // Use custom validator if provided
    if (validate) {
      const result = validate(event);
      if (result) return { valid: true };
      return { valid: false, error: 'Custom validation failed' };
    }

    // Use schema if provided
    if (schema && event.payload) {
      try {
        const valid = schema(event.payload);
        if (valid) return { valid: true };
        return { valid: false, error: 'Schema validation failed' };
      } catch (error) {
        return { valid: false, error: error instanceof Error ? error.message : 'Schema validation error' };
      }
    }

    // No validation - pass through
    return { valid: true };
  };

  return {
    name: 'validation',
    version: '1.0.0',
    priority: 50, // Run early for validation

    async handle(event, context) {
      const result = isValid(event);

      if (result.valid) {
        return event;
      }

      // Handle invalid event
      if (onInvalid === 'cancel') {
        report(event, result.error || 'Validation failed');
        return null;
      }

      if (onInvalid === 'log') {
        report(event, result.error || 'Validation failed');
        return event;
      }

      if (onInvalid === 'report') {
        report(event, result.error || 'Validation failed');
        return null;
      }

      return event;
    },
  };
}
