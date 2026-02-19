/**
 * Field-level schema definition for runtime validation.
 *
 * Defines validation rules for individual fields within a schema.
 *
 * @module @gridkit/core/validation/schema
 */

// Import types from base using relative path from validation folder
import type {
  ValidationMode,
  FieldType,
  FieldConstraints,
  SchemaMeta,
  ValidationContext,
} from './BaseTypes';

import type { RowData } from '@/types';

// Import base types

// Re-export base types for convenience
export type { ValidationMode, FieldType, FieldConstraints, SchemaMeta, ValidationContext } from './BaseTypes';

// ===================================================================
// Field Schema Interface
// ===================================================================

/**
 * Schema definition for runtime validation.
 * Uses Zod-like patterns without external dependencies.
 */
export interface Schema<T extends RowData = RowData> {
  /**
   * Map of field names to their schemas.
   */
  readonly fields: Record<string, FieldSchema>;

  /**
   * Validate complete data against the schema.
   *
   * @param data - Data to validate
   * @returns Validation result with errors and validated data
   */
  validate(data: unknown): any;

  /**
   * Validate partial data (allows missing fields).
   *
   * @param data - Partial data to validate
   * @returns Validation result for partial data
   */
  validatePartial(data: Partial<unknown>): any;

  /**
   * Validate a single row with index (for array validation).
   *
   * @param row - Row data to validate
   * @param rowIndex - Index in the array
   * @returns Row-specific validation result
   */
  validateRow(row: unknown, rowIndex: number): any;

  /**
   * Whether this schema is optional (all fields are optional).
   */
  readonly isOptional: boolean;

  /**
   * Schema metadata for debugging and documentation.
   */
  readonly meta: SchemaMeta;
}

/**
 * Field-level schema definition with validation constraints.
 */
export interface FieldSchema {
  /**
   * The expected type of this field.
   */
  readonly type: FieldType;

  /**
   * Whether this field is required (cannot be undefined/null).
   * @default false
   */
  readonly required: boolean;

  /**
   * Whether this field can be null.
   * @default false
   */
  readonly nullable: boolean;

  /**
   * Default value if field is missing.
   */
  readonly defaultValue?: unknown;

  /**
   * Constraint validators for this field.
   */
  readonly constraints?: FieldConstraints;

  /**
   * Custom validators for this field.
   * Using 'any' to avoid circular dependency with Validator interface.
   */
  readonly validators?: readonly any[];

  /**
   * Normalization function to transform input values.
   */
  readonly normalize?: (value: unknown) => unknown;

  /**
   * Whether this field is optional (for nested schemas).
   */
  readonly isOptional?: boolean;
}
