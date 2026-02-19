/**
 * Base types for validation system.
 *
 * These types are foundational and shouldn't have circular dependencies
 * with other validation types.
 *
 * @module @gridkit/core/validation/base
 */

// ===================================================================
// Base Interfaces
// ===================================================================

/**
 * Validation mode for performance tuning.
 */
export type ValidationMode =
  | 'strict' // Validate everything (development)
  | 'normal' // Validate critical paths (default)
  | 'minimal' // Validate only required fields
  | 'none'; // No validation (production optimization)

/**
 * Field types for schema validation.
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'any'
  | 'custom';

/**
 * Field constraints for validation rules.
 */
export interface FieldConstraints {
  /**
   * Minimum value for numbers.
   */
  readonly min?: number;

  /**
   * Maximum value for numbers.
   */
  readonly max?: number;

  /**
   * Minimum length for strings.
   */
  readonly minLength?: number;

  /**
   * Maximum length for strings.
   */
  readonly maxLength?: number;

  /**
   * Regular expression pattern for strings.
   */
  readonly pattern?: RegExp;

  /**
   * Enum values for this field.
   */
  readonly enum?: readonly unknown[];

  /**
   * Predefined format validator (email, url, etc.).
   */
  readonly format?: 'email' | 'url' | 'uuid' | 'datetime' | 'date' | 'time';

  /**
   * Custom validation function.
   */
  readonly custom?: (value: unknown) => boolean;
}

/**
 * Schema metadata for debugging and documentation.
 */
export interface SchemaMeta {
  /**
   * Schema name for identification.
   */
  readonly name?: string;

  /**
   * Schema description.
   */
  readonly description?: string;

  /**
   * Example data for this schema.
   */
  readonly example?: unknown;

  /**
   * Field descriptions.
   */
  readonly fieldDescriptions?: Record<string, string>;

  /**
   * Custom metadata for application use.
   */
  readonly [key: string]: unknown;
}

/**
 * Validation context for custom validators.
 */
export interface ValidationContext {
  /**
   * Path to the current field (for error reporting).
   */
  readonly path: string[];

  /**
   * Current validation mode.
   */
  readonly mode?: ValidationMode;

  /**
   * Custom metadata for validators.
   */
  meta?: Record<string, unknown>;

  /**
   * Reference to the full data being validated.
   */
  readonly data?: unknown;

  /**
   * Row index for array validation.
   */
  readonly rowIndex?: number;
}
