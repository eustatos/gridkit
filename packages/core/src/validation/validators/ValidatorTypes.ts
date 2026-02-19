/**
 * Validator types and interfaces for runtime validation.
 *
 * Defines the contract for custom and built-in validators.
 *
 * @module @gridkit/core/validation/validators
 */

import type { ValidationError } from '../result/ValidationResult';
import type { ValidationContext } from '../schema/FieldSchema';

// Re-export canonical types
export type {
  ValidationError,
  ValidationFix,
} from '../result/ValidationResult';

// ===================================================================
// Validator Interface
// ===================================================================

/**
 * Validator function with context.
 */
export interface Validator {
  /**
   * Unique identifier for this validator.
   */
  readonly id: string;

  /**
   * Validate a value and return error if invalid.
   *
   * @param value - Value to validate
   * @param context - Validation context with path and metadata
   * @returns ValidationError if invalid, null if valid
   */
  validate(value: unknown, context: ValidationContext): ValidationError | null;

  /**
   * Severity level of this validator.
   */
  readonly severity: 'error' | 'warning' | 'info';

  /**
   * Human-readable message template.
   */
  readonly message?: string | ((value: unknown) => string);
}

/**
 * Validator options for type validators.
 */
export interface TypeValidatorOptions {
  /**
   * Whether null is allowed.
   * @default false
   */
  readonly nullable?: boolean;

  /**
   * Custom error message.
   */
  readonly message?: string;
}

/**
 * Validator options for string validators.
 */
export interface StringValidatorOptions extends TypeValidatorOptions {
  /**
   * Minimum length.
   */
  readonly minLength?: number;

  /**
   * Maximum length.
   */
  readonly maxLength?: number;

  /**
   * Regex pattern.
   */
  readonly pattern?: RegExp;

  /**
   * Predefined format.
   */
  readonly format?: 'email' | 'url' | 'uuid' | 'datetime' | 'date' | 'time';
}

/**
 * Validator options for number validators.
 */
export interface NumberValidatorOptions extends TypeValidatorOptions {
  /**
   * Minimum value.
   */
  readonly min?: number;

  /**
   * Maximum value.
   */
  readonly max?: number;

  /**
   * Allow NaN.
   * @default false
   */
  readonly allowNaN?: boolean;

  /**
   * Allow infinity.
   * @default false
   */
  readonly allowInfinity?: boolean;
}

/**
 * Validator options for array validators.
 */
export interface ArrayValidatorOptions extends TypeValidatorOptions {
  /**
   * Minimum array length.
   */
  readonly minLength?: number;

  /**
   * Maximum array length.
   */
  readonly maxLength?: number;

  /**
   * Element validator.
   */
  readonly elementValidator?: Validator;

  /**
   * Unique items requirement.
   */
  readonly unique?: boolean;
}

/**
 * Validator options for object validators.
 */
export interface ObjectValidatorOptions extends TypeValidatorOptions {
  /**
   * Required properties.
   */
  readonly required?: string[];

  /**
   * Allowed properties.
   */
  readonly properties?: Record<string, Validator>;

  /**
   * Additional properties allowed.
   * @default true
   */
  readonly additionalProperties?: boolean;
}

/**
 * Built-in validator factory functions.
 */
export interface ValidatorFactory {
  // === Type Validators ===
  isString(options?: StringValidatorOptions): Validator;
  isNumber(options?: NumberValidatorOptions): Validator;
  isBoolean(): Validator;
  isDate(): Validator;
  isArray(options?: ArrayValidatorOptions): Validator;
  isObject(options?: ObjectValidatorOptions): Validator;

  // === Constraint Validators ===
  minValue(min: number): Validator;
  maxValue(max: number): Validator;
  minLength(length: number): Validator;
  maxLength(length: number): Validator;
  pattern(pattern: RegExp): Validator;
  enum(values: readonly unknown[]): Validator;

  // === Business Logic Validators ===
  unique(field: string): Validator;
  uniqueAcrossAll(fields: string[]): Validator;

  // === Performance Validators ===
  withinBudget(budget: PerformanceBudget): Validator;

  // === Custom Validators ===
  custom(
    validate: (
      value: unknown,
      context: ValidationContext
    ) => ValidationError | null,
    options: {
      id: string;
      severity?: 'error' | 'warning';
      message?: string;
    }
  ): Validator;
}

/**
 * Performance budget for validation.
 */
export interface PerformanceBudget {
  /**
   * Maximum duration in milliseconds.
   */
  readonly maxDuration: number;

  /**
   * Maximum memory in bytes.
   */
  readonly maxMemory: number;
}
