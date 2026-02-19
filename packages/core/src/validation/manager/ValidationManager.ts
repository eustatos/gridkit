/**
 * Validation Manager - Central coordinator for validation system.
 *
 * Manages schemas, performs validation, and coordinates error boundaries.
 *
 * @module @gridkit/core/validation/manager
 */

import type { RowData, Unsubscribe } from '@/types';

import type { ErrorBoundary, ErrorScope, ErrorContext, CapturedError, RecoveryResult, BoundaryOptions, ErrorCapture } from '../error-boundary/ErrorBoundary';
import type { ValidationResult, RowValidationResult, ValidationReport } from '../result/ValidationResult';
import type { Schema } from '../schema/FieldSchema';



// ===================================================================
// Validation Manager Interface
// ===================================================================

/**
 * Central validation manager with caching and performance optimizations.
 */
export interface ValidationManager {
  // === Schema Management ===

  /**
   * Register a schema for reuse.
   *
   * @param id - Unique schema identifier
   * @param schema - Schema to register
   * @returns Unsubscribe function
   */
  registerSchema<T extends RowData>(id: string, schema: Schema<T>): Unsubscribe;

  /**
   * Get a registered schema.
   *
   * @param id - Schema identifier
   * @returns Schema or undefined if not registered
   */
  getSchema<T extends RowData>(id: string): Schema<T> | undefined;

  /**
   * Unregister a schema.
   *
   * @param id - Schema identifier
   */
  unregisterSchema(id: string): void;

  /**
   * Get all registered schema IDs.
   */
  getRegisteredSchemaIds(): readonly string[];

  // === Data Validation ===

  /**
   * Validate data against a schema.
   *
   * @param data - Data to validate
   * @param schemaId - Optional schema identifier
   * @param options - Validation options
   * @returns Validation result
   */
  validateData<T extends RowData>(
    data: unknown,
    schemaId?: string,
    options?: ValidationOptions
  ): ValidationResult<T>;

  /**
   * Validate a single row.
   *
   * @param row - Row data to validate
   * @param index - Row index
   * @param schemaId - Optional schema identifier
   * @param options - Row validation options
   * @returns Row validation result
   */
  validateRow(
    row: unknown,
    index: number,
    schemaId?: string,
    options?: RowValidationOptions
  ): RowValidationResult;

  /**
   * Validate an array of data.
   *
   * @param data - Array of data to validate
   * @param schemaId - Optional schema identifier
   * @param options - Validation options
   * @returns Array of row validation results
   */
  validateArray<T extends RowData>(
    data: unknown[],
    schemaId?: string,
    options?: ValidationOptions
  ): RowValidationResult[];

  // === Error Boundary Management ===

  /**
   * Create a new error boundary.
   *
   * @param scope - Error scope
   * @param options - Boundary options
   * @returns New error boundary
   */
  createBoundary(scope: ErrorScope, options?: BoundaryOptions): ErrorBoundary;

  /**
   * Get an existing error boundary.
   *
   * @param id - Boundary ID
   * @returns Boundary or undefined
   */
  getBoundary(id: string): ErrorBoundary | undefined;

  /**
   * Capture an error using the appropriate boundary.
   *
   * @param error - Error to capture
   * @param context - Error context
   * @returns Error capture information
   */
  captureError(error: unknown, context: ErrorContext): ErrorCapture;

  /**
   * Attempt to recover from an error.
   *
   * @param errorId - Captured error ID
   * @returns Recovery result
   */
  attemptRecovery(errorId: string): RecoveryResult;

  /**
   * Get all boundaries for a scope.
   *
   * @param scope - Error scope
   * @returns Array of boundaries
   */
  getBoundariesByScope(scope: ErrorScope): readonly ErrorBoundary[];

  // === Performance Monitoring ===

  /**
   * Enable or disable validation.
   *
   * @param enabled - Whether validation is enabled
   */
  enableValidation(enabled: boolean): void;

  /**
   * Set validation mode.
   *
   * @param mode - Validation mode
   */
  setValidationMode(mode: ValidationMode): void;

  /**
   * Get validation statistics.
   *
   * @returns Validation statistics
   */
  getStats(): ValidationManagerStats;

  /**
   * Clear all validation errors.
   *
   * @param scope - Optional scope to clear
   */
  clearErrors(scope?: ErrorScope): void;

  // === Reporting ===

  /**
   * Generate a validation report.
   *
   * @param options - Report options
   * @returns Validation report
   */
  generateReport(options?: ReportOptions): ValidationReport;

  /**
   * Clear all cached validation results.
   */
  clearCache(): void;

  /**
   * Destroy manager and clean up resources.
   */
  destroy(): void;
}

/**
 * Validation modes.
 */
export type ValidationMode =
  | 'strict' // Validate everything (development)
  | 'normal' // Validate critical paths (default)
  | 'minimal' // Validate only required fields
  | 'none'; // No validation (production optimization)

/**
 * Validation options.
 */
export interface ValidationOptions {
  /**
   * Validation mode.
   * @default 'normal'
   */
  readonly mode?: ValidationMode;

  /**
   * Whether to throw on validation errors.
   * @default false
   */
  readonly throwOnError?: boolean;

  /**
   * Whether to collect warnings.
   * @default true
   */
  readonly collectWarnings?: boolean;

  /**
   * Whether to auto-fix errors.
   * @default false
   */
  readonly fixAutomatically?: boolean;

  /**
   * Maximum number of errors to collect.
   * @default 100
   */
  readonly maxErrors?: number;

  /**
   * Timeout in milliseconds.
   * @default 1000
   */
  readonly timeout?: number;

  /**
   * Schema overrides for this validation.
   */
  readonly schemaOverrides?: Partial<Schema>;

  /**
   * Cache results.
   * @default true
   */
  readonly cache?: boolean;

  /**
   * Include timing information.
   * @default false
   */
  readonly timing?: boolean;
}

/**
 * Row validation options.
 */
export interface RowValidationOptions extends ValidationOptions {
  /**
   * Column definitions for cell validation.
   */
  readonly columns?: readonly { accessorKey?: string }[];

  /**
   * Whether to validate all cells.
   * @default true
   */
  readonly validateAllCells?: boolean;
}

/**
 * Report options.
 */
export interface ReportOptions {
  /**
   * Include all errors (not just recent ones).
   * @default false
   */
  readonly includeAllErrors?: boolean;

  /**
   * Include recommendations.
   * @default true
   */
  readonly includeRecommendations?: boolean;

  /**
   * Include performance stats.
   * @default true
   */
  readonly includeStats?: boolean;

  /**
   * Report title.
   */
  readonly title?: string;
}

/**
 * Validation manager statistics.
 */
export interface ValidationManagerStats {
  /**
   * Total validations performed.
   */
  readonly totalValidations: number;

  /**
   * Successful validations.
   */
  readonly successfulValidations: number;

  /**
   * Failed validations.
   */
  readonly failedValidations: number;

  /**
   * Total errors captured.
   */
  readonly totalErrors: number;

  /**
   * Total warnings captured.
   */
  readonly totalWarnings: number;

  /**
   * Average validation time (ms).
   */
  readonly avgValidationTime: number;

  /**
   * Peak memory usage (bytes).
   */
  readonly peakMemoryUsage: number;

  /**
   * Cache hit rate (0-1).
   */
  readonly cacheHitRate: number;

  /**
   * Active error boundaries.
   */
  readonly activeBoundaries: number;

  /**
   * Registered schemas.
   */
  readonly registeredSchemas: number;

  /**
   * Error capture statistics.
   */
  readonly errorStats: ErrorStats;
}

/**
 * Error statistics.
 */
export interface ErrorStats {
  /**
   * Critical errors.
   */
  readonly critical: number;

  /**
   * Error level errors.
   */
  readonly errors: number;

  /**
   * Warning level errors.
   */
  readonly warnings: number;

  /**
   * Info level errors.
   */
  readonly info: number;

  /**
   * Debug level errors.
   */
  readonly debug: number;
}

/**
 * Validation manager options.
 */
export interface ValidationManagerOptions {
  /**
   * Default validation mode.
   * @default 'normal'
   */
  readonly defaultMode?: ValidationMode;

  /**
   * Whether to cache validation results.
   * @default true
   */
  readonly cacheEnabled?: boolean;

  /**
   * Maximum cache size.
   * @default 1000
   */
  readonly maxCacheSize?: number;

  /**
   * Whether to throw on errors.
   * @default false
   */
  readonly throwOnError?: boolean;

  /**
   * Whether to auto-recover from errors.
   * @default false
   */
  readonly autoRecover?: boolean;

  /**
   * Default error boundaries to create.
   */
  readonly defaultBoundaries?: ErrorScope[];
}
