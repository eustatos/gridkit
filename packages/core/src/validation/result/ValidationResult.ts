/**
 * Validation result types for runtime validation system.
 *
 * Provides detailed validation errors and results.
 *
 * @module @gridkit/core/validation/result
 */

// Import base types using relative path from validation folder
import type { RowId, CellId } from '@/types';

// ===================================================================
// Validation Result Interface
// ===================================================================

/**
 * Comprehensive validation result with detailed errors.
 */
export interface ValidationResult<T = any> {
  /**
   * Whether validation completed without critical errors.
   */
  readonly success: boolean;

  /**
   * Whether the data is valid (no errors).
   */
  readonly valid: boolean;

  /**
   * Validated and normalized data (if successful).
   */
  readonly data?: T;

  /**
   * List of validation errors.
   */
  readonly errors: ValidationError[];

  /**
   * List of validation warnings.
   */
  readonly warnings: ValidationWarning[];

  /**
   * Validation duration in milliseconds.
   */
  readonly duration: number;

  /**
   * Timestamp when validation was completed.
   */
  readonly validatedAt: number;

  /**
   * Validation statistics.
   */
  readonly stats: ValidationStats;

  /**
   * Whether this result was cached.
   */
  readonly cached?: boolean;
}

/**
 * Row-specific validation result.
 */
export interface RowValidationResult {
  /**
   * Index of the row in the array.
   */
  readonly rowIndex: number;

  /**
   * Row ID if available.
   */
  readonly rowId?: RowId;

  /**
   * Whether validation succeeded.
   */
  readonly success: boolean;

  /**
   * Cell-level validation errors.
   */
  readonly errors: CellValidationError[];

  /**
   * Cell-level validation warnings.
   */
  readonly warnings: CellValidationWarning[];

  /**
   * Whether all cells in this row are valid.
   */
  readonly isValid: boolean;

  /**
   * Whether there are any validation issues.
   */
  readonly isDirty: boolean;

  /**
   * Suggested fixes for validation issues.
   */
  readonly suggestions?: ValidationSuggestion[];
}

/**
 * Detailed validation error.
 * 
 * NOTE: This is the canonical definition. Other modules should import
 * from here rather than defining their own ValidationError interface.
 */
export interface ValidationError {
  /**
   * Error code for programmatic handling.
   */
  readonly code: string;

  /**
   * Human-readable error message.
   */
  readonly message: string;

  /**
   * Path to the invalid field (e.g., ['rows', '0', 'email']).
   */
  readonly path: string[];

  /**
   * The invalid value.
   */
  readonly value: unknown;

  /**
   * Expected value type.
   */
  readonly expected?: unknown;

  /**
   * Actually received value type.
   */
  readonly received?: unknown;

  /**
   * Field name if applicable.
   */
  readonly field?: string;

  /**
   * Row index if validating array.
   */
  readonly rowIndex?: number;

  /**
   * Column ID if validating a cell.
   */
  readonly columnId?: string;

  /**
   * Severity level.
   */
  readonly severity: 'error' | 'warning';

  /**
   * Whether this error can be automatically fixed.
   */
  readonly fixable: boolean;

  /**
   * Suggested fix if available.
   */
  readonly fix?: ValidationFix;

  /**
   * Additional metadata.
   */
  readonly meta?: Record<string, unknown>;
}

/**
 * Cell-specific validation error.
 */
export interface CellValidationError extends ValidationError {
  /**
   * Cell ID for identification.
   */
  readonly cellId: CellId;

  /**
   * Cell value.
   */
  readonly cellValue: unknown;
}

/**
 * Validation warning (non-blocking).
 */
export interface ValidationWarning {
  /**
   * Warning code.
   */
  readonly code: ValidationErrorCode;

  /**
   * Human-readable warning message.
   */
  readonly message: string;

  /**
   * Path to the warning location.
   */
  readonly path: string[];

  /**
   * Severity level.
   */
  readonly severity: 'warning';

  /**
   * Additional metadata.
   */
  readonly meta?: Record<string, unknown>;
}

/**
 * Cell-specific validation warning.
 */
export interface CellValidationWarning extends ValidationWarning {
  /**
   * Cell ID.
   */
  readonly cellId: CellId;

  /**
   * Cell value.
   */
  readonly cellValue: unknown;
}

/**
 * Validation error codes.
 */
export type ValidationErrorCode =
  // Schema errors
  | 'INVALID_SCHEMA'
  | 'MISSING_REQUIRED_FIELD'
  | 'FIELD_TYPE_MISMATCH'
  | 'INVALID_FIELD_VALUE'

  // Data errors
  | 'INVALID_ROW_DATA'
  | 'DUPLICATE_ROW_ID'
  | 'INVALID_COLUMN_ACCESSOR'
  | 'INVALID_CELL_VALUE'

  // Constraint errors
  | 'MIN_VALUE_VIOLATION'
  | 'MAX_VALUE_VIOLATION'
  | 'MIN_LENGTH_VIOLATION'
  | 'MAX_LENGTH_VIOLATION'
  | 'PATTERN_MISMATCH'
  | 'ENUM_VIOLATION'

  // State errors
  | 'INVALID_STATE_TRANSITION'
  | 'CONCURRENT_MODIFICATION'
  | 'STATE_CORRUPTION'

  // Performance errors
  | 'PERFORMANCE_BUDGET_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'EXECUTION_TIMEOUT'

  // Custom errors
  | 'CUSTOM_VALIDATION_FAILED';

/**
 * Validation fix suggestion.
 */
export interface ValidationFix {
  /**
   * Fix type: auto, suggestion, or manual.
   */
  readonly type: 'auto' | 'suggestion' | 'manual';

  /**
   * Description of what the fix does.
   */
  readonly description: string;

  /**
   * Apply the fix and return the corrected value.
   */
  readonly apply: () => unknown;

  /**
   * Confidence level (0-1) for auto-fixes.
   */
  readonly confidence: number;
}

/**
 * Validation suggestion for UI display.
 */
export interface ValidationSuggestion {
  /**
   * Cell ID.
   */
  readonly cellId: CellId;

  /**
   * Current value.
   */
  readonly currentValue: unknown;

  /**
   * Suggested value.
   */
  readonly suggestedValue: unknown;

  /**
   * Fix description.
   */
  readonly description: string;

  /**
   * Apply the fix.
   */
  readonly apply: () => void;
}

/**
 * Validation statistics.
 */
export interface ValidationStats {
  /**
   * Total number of validations performed.
   */
  readonly totalValidations: number;

  /**
   * Number of successful validations.
   */
  readonly successfulValidations: number;

  /**
   * Number of failed validations.
   */
  readonly failedValidations: number;

  /**
   * Total number of errors encountered.
   */
  readonly totalErrors: number;

  /**
   * Total number of warnings encountered.
   */
  readonly totalWarnings: number;

  /**
   * Average validation time in milliseconds.
   */
  readonly avgValidationTime: number;

  /**
   * Peak memory usage during validation.
   */
  readonly peakMemoryUsage: number;

  /**
   * Cache hit rate (0-1).
   */
  readonly cacheHitRate: number;

  /**
   * Validation duration breakdown.
   */
  readonly timings: ValidationTimings;
}

/**
 * Validation timing breakdown.
 */
export interface ValidationTimings {
  /**
   * Schema validation time.
   */
  readonly schemaValidation: number;

  /**
   * Constraint validation time.
   */
  readonly constraintValidation: number;

  /**
   * Custom validator time.
   */
  readonly customValidation: number;

  /**
   * Normalization time.
   */
  readonly normalization: number;
}

/**
 * Validation report for debugging.
 */
export interface ValidationReport {
  /**
   * Summary of validation results.
   */
  readonly summary: ReportSummary;

  /**
   * All validation errors.
   */
  readonly errors: ValidationError[];

  /**
   * All validation warnings.
   */
  readonly warnings: ValidationWarning[];

  /**
   * Validation statistics.
   */
  readonly stats: ValidationStats;

  /**
   * Recommendations for fixing issues.
   */
  readonly recommendations: Recommendation[];

  /**
   * When the report was generated.
   */
  readonly generatedAt: number;
}

/**
 * Report summary.
 */
export interface ReportSummary {
  /**
   * Total records validated.
   */
  readonly totalRecords: number;

  /**
   * Valid records.
   */
  readonly validRecords: number;

  /**
   * Invalid records.
   */
  readonly invalidRecords: number;

  /**
   * Total errors.
   */
  readonly totalErrors: number;

  /**
   * Total warnings.
   */
  readonly totalWarnings: number;

  /**
   * Validation success rate.
   */
  readonly successRate: number;
}

/**
 * Fix recommendation for UI.
 */
export interface Recommendation {
  /**
   * Recommendation ID.
   */
  readonly id: string;

  /**
   * Title of the recommendation.
   */
  readonly title: string;

  /**
   * Detailed description.
   */
  readonly description: string;

  /**
   * Severity level.
   */
  readonly severity: 'critical' | 'error' | 'warning' | 'info';

  /**
   * Action to take.
   */
  readonly action: () => void;

  /**
   * Whether this is already applied.
   */
  readonly applied: boolean;
}
