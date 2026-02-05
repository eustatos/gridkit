# CORE-016: Runtime Validation & Error Boundary System

## Task Card

```
task_id: CORE-016
priority: P1
complexity: Medium
estimated_tokens: ~15,000
ai_ready: yes
dependencies: [CORE-001, CORE-002, CORE-003, CORE-004]
requires_validation: true (runtime safety system)
```

## 🎯 **Core Objective**

Implement a comprehensive runtime validation system with error boundaries that ensures GridKit operates safely in production environments, providing detailed error messages and graceful degradation when validation fails.

## 📋 **Implementation Scope**

### **1. Schema Validation System (Runtime Type Safety)**

````typescript
/**
 * Schema definition for runtime validation.
 * Uses Zod-like patterns without external dependencies.
 *
 * @example
 * ```typescript
 * const userSchema = createSchema({
 *   id: field('number', { required: true }),
 *   name: field('string', { minLength: 1, maxLength: 100 }),
 *   email: field('string', { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }),
 *   age: field('number', { min: 0, max: 150 }),
 * });
 * ```
 */
export interface Schema<T extends RowData = RowData> {
  readonly fields: Record<string, FieldSchema>;
  readonly validate: (data: unknown) => ValidationResult<T>;
  readonly validatePartial: (
    data: Partial<unknown>
  ) => ValidationResult<Partial<T>>;
  readonly validateRow: (row: unknown, index: number) => RowValidationResult;
  readonly isOptional: boolean;
  readonly meta: SchemaMeta;
}

/**
 * Field-level schema definition.
 */
export interface FieldSchema {
  readonly type: FieldType;
  readonly required: boolean;
  readonly nullable: boolean;
  readonly defaultValue?: unknown;
  readonly constraints?: FieldConstraints;
  readonly validators?: Validator[];
  readonly normalize?: (value: unknown) => unknown;
}

/**
 * Supported field types.
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
 * Field constraints.
 */
export interface FieldConstraints {
  readonly min?: number;
  readonly max?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly enum?: readonly unknown[];
  readonly format?: string;
  readonly custom?: (value: unknown) => boolean;
}

/**
 * Validator function with context.
 */
export interface Validator {
  readonly id: string;
  readonly validate: (
    value: unknown,
    context: ValidationContext
  ) => ValidationError | null;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message?: string | ((value: unknown) => string);
}
````

### **2. Validation Engine & Result Types**

```typescript
/**
 * Comprehensive validation result with detailed errors.
 */
export interface ValidationResult<T = any> {
  readonly success: boolean;
  readonly valid: boolean;
  readonly data?: T; // Validated and normalized data
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly duration: number;
  readonly validatedAt: number;
  readonly stats: ValidationStats;
}

/**
 * Row-specific validation result.
 */
export interface RowValidationResult {
  readonly rowIndex: number;
  readonly rowId?: RowId;
  readonly success: boolean;
  readonly errors: CellValidationError[];
  readonly warnings: CellValidationWarning[];
  readonly isValid: boolean; // All cells valid
  readonly isDirty: boolean; // Has validation issues
  readonly suggestions?: ValidationSuggestion[];
}

/**
 * Detailed validation error.
 */
export interface ValidationError {
  readonly code: ValidationErrorCode;
  readonly message: string;
  readonly path: string[]; // e.g., ['rows', '0', 'email']
  readonly value: unknown;
  readonly expected?: unknown;
  readonly received?: unknown;
  readonly field?: string;
  readonly rowIndex?: number;
  readonly columnId?: ColumnId;
  readonly severity: 'error' | 'warning';
  readonly fixable: boolean;
  readonly fix?: ValidationFix;
  readonly meta?: Record<string, unknown>;
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
  | 'EXECUTION_TIMEOUT';

/**
 * Validation fix suggestion.
 */
export interface ValidationFix {
  readonly type: 'auto' | 'suggestion' | 'manual';
  readonly description: string;
  readonly apply: () => unknown;
  readonly confidence: number; // 0-1
}
```

### **3. Error Boundary System (Production Safety)**

```typescript
/**
 * Error boundary that isolates failures and prevents crashes.
 * Inspired by React Error Boundaries but framework-agnostic.
 */
export interface ErrorBoundary {
  readonly id: string;
  readonly scope: ErrorScope;
  readonly capture: (error: unknown, context?: ErrorContext) => ErrorCapture;
  readonly recover: () => RecoveryResult;
  readonly isActive: boolean;
  readonly errorCount: number;
  readonly lastError?: CapturedError;
  readonly reset: () => void;
}

/**
 * Scope for error boundary isolation.
 */
export type ErrorScope =
  | 'global' // Catches all errors
  | 'plugin' // Plugin-specific isolation
  | 'column' // Column operations
  | 'row' // Row operations
  | 'cell' // Cell operations
  | 'event' // Event handlers
  | 'render' // Rendering operations
  | 'data' // Data operations
  | 'custom'; // Custom scope

/**
 * Captured error with context.
 */
export interface CapturedError {
  readonly id: string;
  readonly error: unknown;
  readonly message: string;
  readonly stack?: string;
  readonly scope: ErrorScope;
  readonly timestamp: number;
  readonly context: ErrorContext;
  readonly severity: ErrorSeverity;
  readonly isRecoverable: boolean;
  readonly recoveryAttempted: boolean;
  readonly recoverySuccessful?: boolean;
}

/**
 * Error severity levels.
 */
export type ErrorSeverity =
  | 'critical' // Application crash imminent
  | 'error' // Feature broken, needs attention
  | 'warning' // Degraded experience
  | 'info' // Informational, no action needed
  | 'debug'; // Development/debugging

/**
 * Error context for debugging.
 */
export interface ErrorContext {
  readonly operation: string;
  readonly component?: string;
  readonly pluginId?: string;
  readonly tableId?: GridId;
  readonly columnId?: ColumnId;
  readonly rowId?: RowId;
  readonly cellId?: CellId;
  readonly event?: string;
  readonly state?: unknown;
  readonly data?: unknown;
  readonly user?: Record<string, unknown>;
  readonly [key: string]: unknown;
}
```

### **4. Validation Manager (Central Coordinator)**

```typescript
/**
 * Central validation manager with caching and performance optimizations.
 */
export interface ValidationManager {
  // === Schema Management ===
  readonly registerSchema: <T extends RowData>(
    id: string,
    schema: Schema<T>
  ) => Unsubscribe;

  readonly getSchema: <T extends RowData>(id: string) => Schema<T> | undefined;

  // === Data Validation ===
  readonly validateData: <T extends RowData>(
    data: unknown,
    schemaId?: string,
    options?: ValidationOptions
  ) => ValidationResult<T>;

  readonly validateRow: (
    row: unknown,
    index: number,
    schemaId?: string,
    options?: RowValidationOptions
  ) => RowValidationResult;

  // === Error Boundary Management ===
  readonly createBoundary: (
    scope: ErrorScope,
    options?: BoundaryOptions
  ) => ErrorBoundary;

  readonly getBoundary: (id: string) => ErrorBoundary | undefined;

  readonly captureError: (
    error: unknown,
    context: ErrorContext
  ) => ErrorCapture;

  // === Performance Monitoring ===
  readonly enableValidation: (enabled: boolean) => void;
  readonly setValidationMode: (mode: ValidationMode) => void;
  readonly getStats: () => ValidationManagerStats;

  // === Recovery & Reporting ===
  readonly attemptRecovery: (errorId: string) => RecoveryResult;
  readonly generateReport: (options?: ReportOptions) => ValidationReport;
  readonly clearErrors: (scope?: ErrorScope) => void;
}

/**
 * Validation modes for performance tuning.
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
  readonly mode?: ValidationMode;
  readonly throwOnError?: boolean;
  readonly collectWarnings?: boolean;
  readonly fixAutomatically?: boolean;
  readonly maxErrors?: number;
  readonly timeout?: number;
  readonly schemaOverrides?: Partial<Schema>;
}

/**
 * Validation report for debugging.
 */
export interface ValidationReport {
  readonly summary: ReportSummary;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
  readonly stats: ValidationStats;
  readonly recommendations: Recommendation[];
  readonly generatedAt: number;
}

/**
 * Validation statistics.
 */
export interface ValidationStats {
  readonly totalValidations: number;
  readonly successfulValidations: number;
  readonly failedValidations: number;
  readonly totalErrors: number;
  readonly totalWarnings: number;
  readonly avgValidationTime: number;
  readonly peakMemoryUsage: number;
  readonly cacheHitRate: number;
}
```

### **5. Built-in Validators & Utilities**

```typescript
/**
 * Built-in validator factory functions.
 */
export const Validators = {
  // Type validators
  isString: (options?: StringValidatorOptions): Validator => ({
    id: 'is-string',
    validate: (value) =>
      typeof value === 'string'
        ? null
        : {
            code: 'FIELD_TYPE_MISMATCH',
            message: `Expected string, got ${typeof value}`,
            severity: 'error',
            fixable: true,
          },
    severity: 'error',
  }),

  isNumber: (options?: NumberValidatorOptions): Validator => ({
    id: 'is-number',
    validate: (value) =>
      typeof value === 'number'
        ? null
        : {
            code: 'FIELD_TYPE_MISMATCH',
            message: `Expected number, got ${typeof value}`,
            severity: 'error',
            fixable: true,
          },
    severity: 'error',
  }),

  // Constraint validators
  minValue: (min: number): Validator => ({
    id: 'min-value',
    validate: (value) =>
      typeof value === 'number' && value >= min
        ? null
        : {
            code: 'MIN_VALUE_VIOLATION',
            message: `Value must be at least ${min}, got ${value}`,
            severity: 'error',
            fixable: true,
            fix: {
              type: 'auto',
              description: `Set value to ${min}`,
              apply: () => min,
              confidence: 0.8,
            },
          },
    severity: 'error',
  }),

  maxValue: (max: number): Validator => ({
    id: 'max-value',
    validate: (value) =>
      typeof value === 'number' && value <= max
        ? null
        : {
            code: 'MAX_VALUE_VIOLATION',
            message: `Value must be at most ${max}, got ${value}`,
            severity: 'error',
            fixable: true,
          },
    severity: 'error',
  }),

  // Business logic validators
  unique: (field: string): Validator => ({
    id: 'unique',
    validate: (value, context) => {
      const seen = context.meta?.seenValues || new Set();
      if (seen.has(value)) {
        return {
          code: 'DUPLICATE_VALUE',
          message: `Duplicate value found for field '${field}': ${value}`,
          severity: 'error',
          fixable: false,
        };
      }
      seen.add(value);
      context.meta = { ...context.meta, seenValues: seen };
      return null;
    },
    severity: 'error',
  }),

  // Performance validators
  withinBudget: (budget: PerformanceBudget): Validator => ({
    id: 'performance-budget',
    validate: (value, context) => {
      const perf = context.meta?.performance;
      if (perf && perf.duration > budget.maxDuration) {
        return {
          code: 'PERFORMANCE_BUDGET_EXCEEDED',
          message: `Operation exceeded budget: ${perf.duration}ms > ${budget.maxDuration}ms`,
          severity: 'warning',
          fixable: false,
        };
      }
      return null;
    },
    severity: 'warning',
  }),
};

/**
 * Schema creation utilities.
 */
export const SchemaUtils = {
  /**
   * Creates a schema from column definitions.
   * Automatically infers types from accessors.
   */
  fromColumns: <TData extends RowData>(
    columns: ColumnDef<TData>[],
    options?: SchemaOptions
  ): Schema<TData> => {
    // Infer field types from column definitions
    const fields = columns.reduce(
      (acc, column) => {
        if (column.accessorKey) {
          acc[column.accessorKey] = inferFieldSchema(column);
        }
        return acc;
      },
      {} as Record<string, FieldSchema>
    );

    return createSchema(fields, options);
  },

  /**
   * Creates a schema from TypeScript interface.
   * Requires runtime type information.
   */
  fromInterface: <TData extends RowData>(
    interfaceDef: InterfaceDefinition,
    options?: SchemaOptions
  ): Schema<TData> => {
    // Convert TypeScript interface to runtime schema
    return createSchema(interfaceDef.fields, options);
  },

  /**
   * Merges multiple schemas.
   */
  merge: <TData extends RowData>(
    schemas: Schema<TData>[],
    options?: MergeOptions
  ): Schema<TData> => {
    // Merge fields and validators
    const mergedFields = schemas.reduce(
      (acc, schema) => ({
        ...acc,
        ...schema.fields,
      }),
      {}
    );

    return createSchema(mergedFields, options);
  },
};
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No UI components for error display
- ❌ No complex type inference from runtime (limited to basic types)
- ❌ No database or network validation
- ❌ No framework-specific error boundaries (React, Vue, etc.)
- ❌ No automatic error reporting to external services
- ❌ No complex fix generation (only basic auto-fixes)

## 📁 **File Structure**

```
packages/core/src/validation/
├── schema/
│   ├── Schema.ts              # Schema definition
│   ├── FieldSchema.ts         # Field-level schemas
│   └── SchemaUtils.ts         # Schema creation utilities
├── validators/
│   ├── Validators.ts          # Built-in validators
│   ├── ValidatorTypes.ts      # Validator interfaces
│   └── ValidatorFactory.ts    # Validator creation
├── error-boundary/
│   ├── ErrorBoundary.ts       # Boundary implementation
│   ├── ErrorCapture.ts        # Error capturing
│   └── Recovery.ts            # Recovery logic
├── manager/
│   ├── ValidationManager.ts   # Central coordinator
│   ├── ValidationCache.ts     # Performance caching
│   └── ValidationStats.ts     # Statistics tracking
├── result/
│   ├── ValidationResult.ts    # Result types
│   ├── ValidationError.ts     # Error types
│   └── ValidationFix.ts       # Fix suggestions
└── index.ts                  # Public exports
```

## 🧪 **Test Requirements (Critical)**

```typescript
describe('Validation System', () => {
  test('Schema validates data correctly', () => {
    const schema = createSchema({
      id: field('number', { required: true }),
      name: field('string', { minLength: 1 }),
      email: field('string', { pattern: /@/ }),
    });

    const result = schema.validate({
      id: 1,
      name: 'John',
      email: 'john@test.com',
    });
    expect(result.success).toBe(true);
    expect(result.valid).toBe(true);

    const invalidResult = schema.validate({ id: 'not-a-number' });
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.errors).toHaveLength(3); // id, name, email errors
  });

  test('Error boundary isolates failures', () => {
    const boundary = createErrorBoundary('plugin');

    const error = new Error('Plugin crashed');
    const capture = boundary.capture(error, {
      operation: 'plugin.initialize',
      pluginId: 'test-plugin',
    });

    expect(capture.isolated).toBe(true);
    expect(capture.scope).toBe('plugin');
    expect(boundary.errorCount).toBe(1);

    // Should not crash the application
    expect(() => boundary.recover()).not.toThrow();
  });

  test('Performance validation works', () => {
    const validator = Validators.withinBudget({
      maxDuration: 100,
      maxMemory: 1024 * 1024, // 1MB
    });

    const context = {
      meta: { performance: { duration: 150, memory: 500000 } },
    };

    const error = validator.validate(null, context);
    expect(error).not.toBeNull();
    expect(error?.code).toBe('PERFORMANCE_BUDGET_EXCEEDED');
  });

  test('Validation caching improves performance', () => {
    const manager = createValidationManager();
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
    }));

    const start = performance.now();

    // First validation (cold)
    const result1 = manager.validateData(data, 'user-schema');

    // Second validation (should be cached)
    const result2 = manager.validateData(data, 'user-schema');

    const duration = performance.now() - start;

    expect(result2.cached).toBe(true);
    expect(duration).toBeLessThan(100); // < 100ms for both
  });
});
```

## 💡 **Critical Implementation Patterns**

```typescript
// 1. Lazy validation with caching
class CachedValidator {
  private cache = new LRUCache<string, ValidationResult>(1000);

  validate(data: unknown, schemaId: string): ValidationResult {
    const cacheKey = this.generateCacheKey(data, schemaId);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return { ...cached, cached: true };
    }

    const result = this.performValidation(data, schemaId);
    this.cache.set(cacheKey, result);
    return result;
  }
}

// 2. Error boundary with recovery strategies
class IsolatedErrorBoundary {
  private errors: CapturedError[] = [];
  private recoveryStrategies = new Map<string, RecoveryStrategy>();

  capture(error: unknown, context: ErrorContext): ErrorCapture {
    const captured = this.createCapturedError(error, context);

    // Try auto-recovery for known error types
    const recovery = this.attemptAutoRecovery(captured);

    if (recovery.successful) {
      captured.recoverySuccessful = true;
      captured.recoveryAttempted = true;
    }

    this.errors.push(captured);
    return captured;
  }
}

// 3. Schema inference from column definitions
function inferFieldSchema(column: ColumnDef): FieldSchema {
  const base: FieldSchema = {
    type: 'any',
    required: true,
    nullable: false,
  };

  // Infer from accessorKey path
  if (column.accessorKey) {
    // Could infer from TypeScript types if runtime info available
    // For now, default to 'any' with column metadata hints
  }

  // Add column-specific validators
  if (column.meta?.validation) {
    base.validators = createValidatorsFromMeta(column.meta.validation);
  }

  return base;
}
```

## 📊 **Success Metrics**

- ✅ Validation performance: < 1ms per 100 rows (cached)
- ✅ Error boundary prevents 100% of uncaught crashes
- ✅ Schema validation covers 95%+ of common data issues
- ✅ Memory overhead: < 50KB for validation system
- ✅ 100% test coverage for error scenarios
- ✅ All errors include actionable messages
- ✅ Zero false positives in production mode

## 🎯 **AI Implementation Strategy**

1. **Start with Schema system** - foundation of validation
2. **Implement Validators** - built-in validation rules
3. **Add Error Boundary** - safety mechanism
4. **Create Validation Manager** - coordination layer
5. **Add Performance optimizations** - caching, lazy validation
6. **Write comprehensive tests** - focus on edge cases

**Critical Priority:** Error boundaries must prevent crashes at all costs. Validation should be fast and non-blocking in production.

---

**Status:** Ready for implementation. This system is critical for production safety and developer experience.
