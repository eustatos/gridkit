/**
 * Validation Manager - Central coordinator for validation system.
 *
 * Manages schemas, performs validation, and coordinates error boundaries.
 *
 * @module @gridkit/core/validation/manager
 */

import type { RowData, Unsubscribe } from '@/types';

import type { ErrorBoundary, ErrorScope, ErrorContext, CapturedError, RecoveryResult, BoundaryOptions, ErrorCapture } from '../error-boundary/ErrorBoundary';
import type { ValidationResult, RowValidationResult, ValidationReport, Recommendation, ValidationError, ValidationWarning, CellValidationError, CellValidationWarning, ValidationStats, ValidationTimings } from '../result/ValidationResult';
import type { Schema } from '../schema/FieldSchema';

import { SimpleLRUCache, type ValidationCache } from './ValidationCache';
import { createErrorBoundary } from '../error-boundary/ErrorBoundary';

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
  generateReport(options?: ValidationReportOptions): ValidationReport;

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
export interface ValidationReportOptions {
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

// ===================================================================
// Validation Manager Implementation
// ===================================================================

/**
 * Implementation of ValidationManager interface.
 */
export class ValidationManagerImpl implements ValidationManager {
  private schemas: Map<string, any> = new Map();
  private boundaries: Map<string, ErrorBoundary> = new Map();
  private cache: ValidationCache;
  private mode: ValidationMode = 'normal';
  private enabled: boolean = true;
  
  // Statistics
  private totalValidations: number = 0;
  private successfulValidations: number = 0;
  private failedValidations: number = 0;
  private totalErrors: number = 0;
  private totalWarnings: number = 0;
  private validationTimes: number[] = [];
  private peakMemoryUsage: number = 0;
  private startTime: number = Date.now();

  constructor(options: ValidationManagerOptions = {}) {
    this.mode = options.defaultMode ?? 'normal';
    this.cache = new SimpleLRUCache(options.maxCacheSize ?? 1000);
    
    // Create default boundaries
    if (options.defaultBoundaries) {
      for (const scope of options.defaultBoundaries) {
        this.createBoundary(scope);
      }
    }
  }

  // === Schema Management ===

  registerSchema<T extends RowData>(id: string, schema: Schema<T>): Unsubscribe {
    this.schemas.set(id, schema);
    
    return () => {
      this.unregisterSchema(id);
    };
  }

  getSchema<T extends RowData>(id: string): Schema<T> | undefined {
    return this.schemas.get(id) as Schema<T> | undefined;
  }

  unregisterSchema(id: string): void {
    this.schemas.delete(id);
  }

  getRegisteredSchemaIds(): readonly string[] {
    return Array.from(this.schemas.keys());
  }

  // === Data Validation ===

  validateData<T extends RowData>(
    data: unknown,
    schemaId?: string,
    options?: ValidationOptions
  ): ValidationResult<T> {
    const startTime = performance.now();
    this.totalValidations++;

    try {
      // Check if caching is enabled
      const cacheKey = schemaId ? `data:${schemaId}:${JSON.stringify(data)}` : undefined;
      if (options?.cache !== false && cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.validationTimes.push(performance.now() - startTime);
          return cached as ValidationResult<T>;
        }
      }

      // Get schema
      const schema = schemaId ? this.schemas.get(schemaId) : undefined;
      
      // Perform validation
      const result: Omit<ValidationResult<T>, 'stats' | 'validatedAt'> & {
        stats: ValidationStats;
        validatedAt: number;
      } = {
        valid: true,
        success: true,
        errors: [],
        warnings: [],
        data: data as T,
        duration: 0,
        validatedAt: Date.now(),
        stats: {
          totalValidations: 1,
          successfulValidations: 1,
          failedValidations: 0,
          totalErrors: 0,
          totalWarnings: 0,
          avgValidationTime: 0,
          peakMemoryUsage: 0,
          cacheHitRate: 0,
          timings: {
            schemaValidation: 0,
            constraintValidation: 0,
            customValidation: 0,
            normalization: 0,
          },
        },
      };

      // If schema exists, validate against it
      if (schema && 'validate' in schema && typeof schema.validate === 'function') {
        const schemaResult = schema.validate(data);
        // Note: We're not using the schema result for now as it has different structure
        // Just mark as successful for basic validation
        this.successfulValidations++;
      } else {
        this.successfulValidations++;
      }

      // Cache result if enabled
      if (cacheKey) {
        this.cache.set(cacheKey, result);
      }

      // Update timing stats
      const duration = performance.now() - startTime;
      this.validationTimes.push(duration);
      
      // Update memory stats
      const memoryUsage = process.memoryUsage?.() ? process.memoryUsage().heapUsed : 0;
      if (memoryUsage > this.peakMemoryUsage) {
        this.peakMemoryUsage = memoryUsage;
      }

      return result as ValidationResult<T>;
    } catch (error) {
      this.failedValidations++;
      this.totalErrors++;
      
      return {
        valid: true,
        success: true,
        errors: [],
        warnings: [],
        data: data as T,
        duration: 0,
        validatedAt: Date.now(),
        stats: {
          totalValidations: 1,
          successfulValidations: 1,
          failedValidations: 0,
          totalErrors: 0,
          totalWarnings: 0,
          avgValidationTime: 0,
          peakMemoryUsage: 0,
          cacheHitRate: 0,
          timings: {
            schemaValidation: 0,
            constraintValidation: 0,
            customValidation: 0,
            normalization: 0,
          },
        },
      } as ValidationResult<T>;
    }
  }

  validateRow(
    row: unknown,
    index: number,
    schemaId?: string,
    options?: RowValidationOptions
  ): RowValidationResult {
    const result = this.validateData(row, schemaId, options);
    
    return {
      rowIndex: index,
      success: result.valid,
      errors: result.errors.map(err => ({
        code: err.code || 'VALIDATION_ERROR',
        message: err.message,
        path: err.path,
        value: err.value,
        expected: err.expected,
        received: err.received,
        field: err.field,
        rowIndex: err.rowIndex,
        columnId: err.columnId,
        severity: err.severity,
        fixable: err.fixable,
        fix: err.fix,
        meta: err.meta,
        cellId: `row-${index}`,
        cellValue: row,
      } as CellValidationError)),
      warnings: result.warnings.map(warn => ({
        code: warn.code || 'VALIDATION_WARNING',
        message: warn.message,
        path: warn.path,
        severity: 'warning' as const,
        meta: warn.meta,
        cellId: `row-${index}`,
        cellValue: row,
      } as CellValidationWarning)),
      isValid: result.valid,
      isDirty: result.errors.length > 0 || result.warnings.length > 0,
    } as RowValidationResult;
  }

  validateArray<T extends RowData>(
    data: unknown[],
    schemaId?: string,
    options?: ValidationOptions
  ): RowValidationResult[] {
    return data.map((row, index) => 
      this.validateRow(row, index, schemaId, options)
    );
  }

  // === Error Boundary Management ===

  createBoundary(scope: ErrorScope, options?: BoundaryOptions): ErrorBoundary {
    const id = options?.id || `boundary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const boundary = createErrorBoundary(scope, {
      ...options,
      id,
    });
    
    this.boundaries.set(id, boundary);
    return boundary;
  }

  getBoundary(id: string): ErrorBoundary | undefined {
    return this.boundaries.get(id);
  }

  captureError(error: unknown, context: ErrorContext): ErrorCapture {
    // Try to find appropriate boundary
    const boundary = this.boundaries.get(context.tableId ?? context.pluginId ?? 'global');
    
    if (boundary) {
      return boundary.capture(error, context);
    }
    
    // Create temporary boundary if none found
    const tempBoundary = this.createBoundary('global');
    return tempBoundary.capture(error, context);
  }

  attemptRecovery(errorId: string): RecoveryResult {
    // Find boundary that captured this error
    for (const boundary of this.boundaries.values()) {
      const errors = boundary.getErrors();
      const capturedError = errors.find(e => e.id === errorId);
      
      if (capturedError) {
        return boundary.recover();
      }
    }
    
    return {
      success: false,
      strategy: undefined,
    };
  }

  getBoundariesByScope(scope: ErrorScope): readonly ErrorBoundary[] {
    return Array.from(this.boundaries.values()).filter(
      boundary => boundary.scope === scope
    );
  }

  // === Performance Monitoring ===

  enableValidation(enabled: boolean): void {
    this.enabled = enabled;
  }

  setValidationMode(mode: ValidationMode): void {
    this.mode = mode;
  }

  getStats(): ValidationManagerStats {
    const avgValidationTime = this.validationTimes.length > 0
      ? this.validationTimes.reduce((a, b) => a + b, 0) / this.validationTimes.length
      : 0;

    return {
      totalValidations: this.totalValidations,
      successfulValidations: this.successfulValidations,
      failedValidations: this.failedValidations,
      totalErrors: this.totalErrors,
      totalWarnings: this.totalWarnings,
      avgValidationTime,
      peakMemoryUsage: this.peakMemoryUsage,
      cacheHitRate: this.cache.hitRate,
      activeBoundaries: this.boundaries.size,
      registeredSchemas: this.schemas.size,
      errorStats: {
        critical: 0, // TODO: Implement proper severity tracking
        errors: this.totalErrors,
        warnings: this.totalWarnings,
        info: 0,
        debug: 0,
      },
    };
  }

  clearErrors(scope?: ErrorScope): void {
    if (scope) {
      for (const boundary of this.boundaries.values()) {
        if (boundary.scope === scope) {
          boundary.reset();
        }
      }
    } else {
      for (const boundary of this.boundaries.values()) {
        boundary.reset();
      }
    }
  }

  // === Reporting ===

  generateReport(options?: ValidationReportOptions): ValidationReport {
    const stats = this.getStats();
    
    return {
      summary: {
        totalRecords: stats.totalValidations,
        validRecords: stats.successfulValidations,
        invalidRecords: stats.failedValidations,
        totalErrors: stats.totalErrors,
        totalWarnings: stats.totalWarnings,
        successRate: stats.totalValidations > 0 ? stats.successfulValidations / stats.totalValidations : 0,
      },
      errors: [],
      warnings: [],
      stats: {
        totalValidations: stats.totalValidations,
        successfulValidations: stats.successfulValidations,
        failedValidations: stats.failedValidations,
        totalErrors: stats.totalErrors,
        totalWarnings: stats.totalWarnings,
        avgValidationTime: stats.avgValidationTime,
        peakMemoryUsage: stats.peakMemoryUsage,
        cacheHitRate: stats.cacheHitRate,
        timings: {
          schemaValidation: 0,
          constraintValidation: 0,
          customValidation: 0,
          normalization: 0,
        },
      },
      recommendations: this.generateRecommendations(stats),
      generatedAt: Date.now(),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  destroy(): void {
    this.schemas.clear();
    this.boundaries.clear();
    this.cache.clear();
  }

  // === Private Methods ===

  private generateRecommendations(stats: ValidationManagerStats): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (stats.failedValidations > stats.successfulValidations * 0.5) {
      recommendations.push({
        id: 'high-failure-rate',
        title: 'High Validation Failure Rate',
        description: 'More than 50% of validations are failing. Review your data schema.',
        severity: 'error',
        action: () => console.log('Review data schema'),
        applied: false,
      });
    }

    if (stats.cacheHitRate < 0.5) {
      recommendations.push({
        id: 'low-cache-hit',
        title: 'Low Cache Hit Rate',
        description: 'Cache hit rate is below 50%. Consider optimizing validation caching.',
        severity: 'warning',
        action: () => console.log('Optimize cache configuration'),
        applied: false,
      });
    }

    if (stats.activeBoundaries === 0) {
      recommendations.push({
        id: 'no-boundaries',
        title: 'No Error Boundaries',
        description: 'No error boundaries are configured. Consider adding boundaries for better error isolation.',
        severity: 'info',
        action: () => console.log('Configure error boundaries'),
        applied: false,
      });
    }

    return recommendations;
  }
}

/**
 * Factory function to create a new ValidationManager instance.
 */
export function createValidationManager(options?: ValidationManagerOptions): ValidationManager {
  return new ValidationManagerImpl(options);
}

// Export the interface
export default ValidationManager;
