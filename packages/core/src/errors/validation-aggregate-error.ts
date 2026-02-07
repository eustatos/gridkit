import { GridKitError } from './grid-kit-error';

/**
 * Error class for aggregating multiple validation errors.
 * 
 * Used when multiple validation errors occur during table creation
 * to provide comprehensive error reporting.
 * 
 * @public
 */
export class ValidationAggregateError extends GridKitError {
  /**
   * The list of validation errors that occurred.
   */
  public readonly errors: readonly GridKitError[];

  /**
   * Creates a new ValidationAggregateError.
   * 
   * @param message - The human-readable error message
   * @param errors - The list of validation errors
   */
  constructor(
    message: string,
    errors: readonly GridKitError[]
  ) {
    super('VALIDATION_AGGREGATE_ERROR', message);
    this.errors = errors;
    this.name = 'ValidationAggregateError';
    
    // Fix prototype inheritance for TypeScript compilation
    Object.setPrototypeOf(this, ValidationAggregateError.prototype);
  }

  /**
   * Returns a JSON representation of the error.
   * Useful for logging and debugging.
   */
  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      errors: this.errors.map(error => error.toJSON()),
    };
  }
}