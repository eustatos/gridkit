/**
 * GridKit validation error for invalid column definitions.
 * 
 * @packageDocumentation
 */

import { GridKitError } from './grid-kit-error';

/**
 * ValidationError for invalid column definitions.
 */
export class ValidationError extends GridKitError {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly columnDef: unknown
  ) {
    super('INVALID_COLUMN_DEFINITION', message, { errors, columnDef });
    this.name = 'ValidationError';
  }
}
