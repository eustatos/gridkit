/**
 * GridKit error class with structured error codes.
 * 
 * All GridKit errors extend this class to provide:
 * - Consistent error codes for identification
 * - Context objects for debugging
 * - Better type safety in error handling
 * 
 * @example
 * ```ts
 * throw new GridKitError(
 *   'INVALID_INPUT',
 *   'Expected a non-empty string',
 *   { received: '' }
 * );
 * ```
 * 
 * @public
 */
export class GridKitError extends Error {
  /**
   * The error code for programmatic error handling.
   * Use this for checking specific error types.
   */
  public readonly code: string;

  /**
   * Additional context data for debugging.
   * Contains structured information about the error.
   */
  public readonly context?: Record<string, unknown>;

  /**
   * Creates a new GridKitError.
   * 
   * @param code - The error code (e.g., 'INVALID_INPUT')
   * @param message - The human-readable error message
   * @param context - Optional context data for debugging
   */
  constructor(
    code: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.context = context;
    this.name = 'GridKitError';
    
    // Fix prototype inheritance for TypeScript compilation
    Object.setPrototypeOf(this, GridKitError.prototype);
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
      context: this.context,
    };
  }

  /**
   * Returns a string representation of the error.
   * Overrides the default `toString()` method.
   */
  public toString() {
    return `${this.name}: [${this.code}] ${this.message}`;
  }
}