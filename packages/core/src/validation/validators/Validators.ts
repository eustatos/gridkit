/**
 * Built-in validators factory.
 *
 * Provides a collection of ready-to-use validators for common validation scenarios.
 *
 * @module @gridkit/core/validation/validators
 */

import type { ValidationContext } from '../schema/FieldSchema';

import type {
  Validator,
  ValidationError,
  ValidationFix,
  ValidatorFactory,
  ValidationPerformanceBudget,
  StringValidatorOptions,
  NumberValidatorOptions,
  ArrayValidatorOptions,
  ObjectValidatorOptions,
} from './ValidatorTypes';

// ===================================================================
// Built-in Validator Factory
// ===================================================================

/**
 * Built-in validator factory functions.
 */
export const Validators: ValidatorFactory = {
  // === Type Validators ===

  /**
   * Validates that value is a string.
   */
  isString(options: StringValidatorOptions = {}) {
    const {
      nullable = false,
      message,
      minLength,
      maxLength,
      pattern,
      format,
    } = options;

    return createValidator({
      id: 'is-string',
      message: message ?? 'Expected a string value',
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        // Check null
        if (value === null) {
          if (nullable) return null;
          return createError(
            'TYPE_MISMATCH',
            `Expected string, got null`,
            context
          );
        }

        // Check undefined
        if (value === undefined) {
          if (!nullable)
            return createError(
              'TYPE_MISMATCH',
              `Expected string, got undefined`,
              context
            );
          return null;
        }

        // Check string type
        if (typeof value !== 'string') {
          return createError(
            'TYPE_MISMATCH',
            `Expected string, got ${typeof value}`,
            context
          );
        }

        // Validate length
        if (minLength !== undefined && value.length < minLength) {
          return createError(
            'MIN_LENGTH_VIOLATION',
            `String length must be at least ${minLength}, got ${value.length}`,
            context
          );
        }

        if (maxLength !== undefined && value.length > maxLength) {
          return createError(
            'MAX_LENGTH_VIOLATION',
            `String length must be at most ${maxLength}, got ${value.length}`,
            context
          );
        }

        // Validate pattern
        if (pattern && !pattern.test(value)) {
          return createError(
            'PATTERN_MISMATCH',
            `String does not match required pattern`,
            context
          );
        }

        // Validate format
        if (format && !validateFormat(value, format)) {
          return createError(
            'FORMAT_MISMATCH',
            `String does not match required format: ${format}`,
            context
          );
        }

        return null;
      },
    });
  },

  /**
   * Validates that value is a number.
   */
  isNumber(options: NumberValidatorOptions = {}) {
    const {
      nullable = false,
      message,
      min,
      max,
      allowNaN = false,
      allowInfinity = false,
    } = options;

    return createValidator({
      id: 'is-number',
      message: message ?? 'Expected a number value',
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        // Check null
        if (value === null) {
          if (nullable) return null;
          return createError(
            'TYPE_MISMATCH',
            `Expected number, got null`,
            context
          );
        }

        // Check undefined
        if (value === undefined) {
          if (!nullable)
            return createError(
              'TYPE_MISMATCH',
              `Expected number, got undefined`,
              context
            );
          return null;
        }

        // Check number type
        if (typeof value !== 'number') {
          return createError(
            'TYPE_MISMATCH',
            `Expected number, got ${typeof value}`,
            context
          );
        }

        // Check NaN
        if (!allowNaN && isNaN(value)) {
          return createError('TYPE_MISMATCH', `Number cannot be NaN`, context);
        }

        // Check infinity
        if (!allowInfinity && !isFinite(value)) {
          return createError(
            'TYPE_MISMATCH',
            `Number cannot be infinite`,
            context
          );
        }

        // Validate min
        if (min !== undefined && value < min) {
          return createError(
            'MIN_VALUE_VIOLATION',
            `Value must be at least ${min}, got ${value}`,
            context,
            {
              fix: {
                type: 'auto',
                description: `Set to ${min}`,
                apply: () => min,
                confidence: 0.8,
              },
            }
          );
        }

        // Validate max
        if (max !== undefined && value > max) {
          return createError(
            'MAX_VALUE_VIOLATION',
            `Value must be at most ${max}, got ${value}`,
            context,
            {
              fix: {
                type: 'auto',
                description: `Set to ${max}`,
                apply: () => max,
                confidence: 0.8,
              },
            }
          );
        }

        return null;
      },
    });
  },

  /**
   * Validates that value is a boolean.
   */
  isBoolean() {
    return createValidator({
      id: 'is-boolean',
      message: 'Expected a boolean value',
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        if (typeof value !== 'boolean') {
          return createError(
            'TYPE_MISMATCH',
            `Expected boolean, got ${typeof value}`,
            context
          );
        }
        return null;
      },
    });
  },

  /**
   * Validates that value is a date.
   */
  isDate() {
    return createValidator({
      id: 'is-date',
      message: 'Expected a Date object',
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
          return createError(
            'TYPE_MISMATCH',
            `Expected valid Date object`,
            context
          );
        }
        return null;
      },
    });
  },

  /**
   * Validates that value is an array.
   */
  isArray(options: ArrayValidatorOptions = {}) {
    const {
      nullable = false,
      message,
      minLength,
      maxLength,
      elementValidator,
      unique = false,
    } = options;

    return createValidator({
      id: 'is-array',
      message: message ?? 'Expected an array',
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        // Check null
        if (value === null) {
          if (nullable) return null;
          return createError(
            'TYPE_MISMATCH',
            `Expected array, got null`,
            context
          );
        }

        // Check undefined
        if (value === undefined) {
          if (!nullable)
            return createError(
              'TYPE_MISMATCH',
              `Expected array, got undefined`,
              context
            );
          return null;
        }

        // Check array type
        if (!Array.isArray(value)) {
          return createError(
            'TYPE_MISMATCH',
            `Expected array, got ${typeof value}`,
            context
          );
        }

        // Validate length
        if (minLength !== undefined && value.length < minLength) {
          return createError(
            'MIN_LENGTH_VIOLATION',
            `Array length must be at least ${minLength}, got ${value.length}`,
            context
          );
        }

        if (maxLength !== undefined && value.length > maxLength) {
          return createError(
            'MAX_LENGTH_VIOLATION',
            `Array length must be at most ${maxLength}, got ${value.length}`,
            context
          );
        }

        // Validate elements
        if (elementValidator) {
          const errors: ValidationError[] = [];

          for (let i = 0; i < value.length; i++) {
            const elementContext: ValidationContext = {
              ...context,
              path: [...context.path, i.toString()],
              rowIndex: context.rowIndex,
            };

            const error = elementValidator.validate(value[i], elementContext);
            if (error) {
              errors.push(error);
            }
          }

          if (errors.length > 0) {
            return createError(
              'ARRAY_ELEMENT_INVALID',
              `Array contains ${errors.length} invalid element(s)`,
              context,
              { errors }
            );
          }
        }

        // Validate uniqueness
        if (unique) {
          const seen = new Set();
          const duplicates: unknown[] = [];

          for (const item of value) {
            const key = JSON.stringify(item);
            if (seen.has(key)) {
              duplicates.push(item);
            }
            seen.add(key);
          }

          if (duplicates.length > 0) {
            return createError(
              'DUPLICATE_VALUE',
              `Array contains ${duplicates.length} duplicate value(s)`,
              context
            );
          }
        }

        return null;
      },
    });
  },

  /**
   * Validates that value is an object.
   */
  isObject(options: ObjectValidatorOptions = {}) {
    const {
      nullable = false,
      message,
      required = [],
      properties = {},
      additionalProperties = true,
    } = options;

    return createValidator({
      id: 'is-object',
      message: message ?? 'Expected an object',
      severity: 'error',
      fixable: false,
      validate: (value: unknown, context: ValidationContext) => {
        // Check null
        if (value === null) {
          if (nullable) return null;
          return createError(
            'TYPE_MISMATCH',
            `Expected object, got null`,
            context
          );
        }

        // Check undefined
        if (value === undefined) {
          if (!nullable)
            return createError(
              'TYPE_MISMATCH',
              `Expected object, got undefined`,
              context
            );
          return null;
        }

        // Check object type
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          return createError(
            'TYPE_MISMATCH',
            `Expected object, got ${Array.isArray(value) ? 'array' : typeof value}`,
            context
          );
        }

        // Validate required properties
        for (const prop of required) {
          if (!(prop in value)) {
            return createError(
              'MISSING_REQUIRED_FIELD',
              `Missing required property: ${prop}`,
              { ...context, path: [...context.path, prop] }
            );
          }
        }

        // Validate properties
        for (const [prop, validator] of Object.entries(properties)) {
          if (prop in value) {
            const propContext: ValidationContext = {
              ...context,
              path: [...context.path, prop],
              rowIndex: context.rowIndex,
            };

            const error = validator.validate((value as Record<string, unknown>)[prop], propContext);
            if (error) {
              return error;
            }
          }
        }

        // Check additional properties
        if (!additionalProperties) {
          const allowedKeys = new Set([
            ...required,
            ...Object.keys(properties),
          ]);
          const extraKeys = Object.keys(value).filter(
            (k) => !allowedKeys.has(k)
          );

          if (extraKeys.length > 0) {
            const extraKey = extraKeys[0];
            return createError(
              'UNEXPECTED_PROPERTY',
              `Object has unexpected property: ${extraKey}`,
              { ...context, path: [...context.path, extraKey], value: extraKey }
            );
          }
        }

        return null;
      },
    });
  },

  // === Constraint Validators ===

  /**
   * Validates minimum value for numbers.
   */
  minValue(min: number) {
    return createValidator({
      id: 'min-value',
      message: `Value must be at least ${min}`,
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        if (typeof value !== 'number' || value < min) {
          return createError(
            'MIN_VALUE_VIOLATION',
            `Value must be at least ${min}, got ${value}`,
            context,
            {
              fix: {
                type: 'auto',
                description: `Set to ${min}`,
                apply: () => min,
                confidence: 0.8,
              },
            }
          );
        }
        return null;
      },
    });
  },

  /**
   * Validates maximum value for numbers.
   */
  maxValue(max: number) {
    return createValidator({
      id: 'max-value',
      message: `Value must be at most ${max}`,
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        if (typeof value !== 'number' || value > max) {
          return createError(
            'MAX_VALUE_VIOLATION',
            `Value must be at most ${max}, got ${value}`,
            context,
            {
              fix: {
                type: 'auto',
                description: `Set to ${max}`,
                apply: () => max,
                confidence: 0.8,
              },
            }
          );
        }
        return null;
      },
    });
  },

  /**
   * Validates minimum length for strings.
   */
  minLength(length: number) {
    return createValidator({
      id: 'min-length',
      message: `Length must be at least ${length}`,
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        if (typeof value !== 'string') {
          return createError(
            'TYPE_MISMATCH',
            `Expected string, got ${typeof value}`,
            context
          );
        }
        if (value.length < length) {
          return createError(
            'MIN_LENGTH_VIOLATION',
            `Length must be at least ${length}, got ${value.length}`,
            context
          );
        }
        return null;
      },
    });
  },

  /**
   * Validates maximum length for strings.
   */
  maxLength(length: number) {
    return createValidator({
      id: 'max-length',
      message: `Length must be at most ${length}`,
      severity: 'error',
      fixable: true,
      validate: (value: unknown, context: ValidationContext) => {
        if (typeof value !== 'string') {
          return createError(
            'TYPE_MISMATCH',
            `Expected string, got ${typeof value}`,
            context
          );
        }
        if (value.length > length) {
          return createError(
            'MAX_LENGTH_VIOLATION',
            `Length must be at most ${length}, got ${value.length}`,
            context
          );
        }
        return null;
      },
    });
  },

  /**
   * Validates string matches a regex pattern.
   */
  pattern(pattern: RegExp) {
    return createValidator({
      id: 'pattern',
      message: 'Does not match required pattern',
      severity: 'error',
      fixable: false,
      validate: (value: unknown, context: ValidationContext) => {
        if (typeof value !== 'string' || !pattern.test(value)) {
          return createError(
            'PATTERN_MISMATCH',
            `Value does not match pattern: ${pattern.source}`,
            context
          );
        }
        return null;
      },
    });
  },

  /**
   * Validates value is in enum.
   */
  enum(values: readonly unknown[]) {
    return createValidator({
      id: 'enum',
      message: `Value must be one of: ${values.join(', ')}`,
      severity: 'error',
      fixable: false,
      validate: (value: unknown, context: ValidationContext) => {
        if (!values.includes(value)) {
          return createError(
            'ENUM_VIOLATION',
            `Value must be one of: ${values.join(', ')}, got ${value}`,
            context
          );
        }
        return null;
      },
    });
  },

  // === Business Logic Validators ===

  /**
   * Validates field value is unique.
   */
  unique(field: string) {
    return createValidator({
      id: 'unique',
      message: `Duplicate value found for field: ${field}`,
      severity: 'error',
      fixable: false,
      validate: (value: unknown, context: ValidationContext) => {
        // Use meta to track seen values across validations
        const seen = context.meta?.seenValues || new Set<unknown>();
        const seenValues = seen as Set<unknown>;

        if (seenValues.has(value)) {
          return createError(
            'DUPLICATE_VALUE',
            `Duplicate value found for field: ${field}: ${value}`,
            context
          );
        }

        seenValues.add(value);
        // Only update meta if it was provided
        if (context.meta) {
          context.meta = { ...context.meta, seenValues };
        }

        return null;
      },
    });
  },

  /**
   * Validates combination of fields is unique.
   */
  uniqueAcrossAll(fields: string[]) {
    return createValidator({
      id: 'unique-across-all',
      message: `Duplicate combination found`,
      severity: 'error',
      fixable: false,
      validate: (_value: unknown, context: ValidationContext) => {
        // This validator is meant for row-level validation
        // Values should be passed in meta
        const seen = context.meta?.seenCombinations || new Set<string>();
        const seenCombinations = seen as Set<string>;

        // Get the combination key from data
        const combination = JSON.stringify(
          fields.reduce(
            (acc, field) => {
              const data = context.data as Record<string, unknown> | undefined;
              acc[field] =
                data && field in data ? data[field] : undefined;
              return acc;
            },
            {} as Record<string, unknown>
          )
        );

        if (seenCombinations.has(combination)) {
          return createError(
            'DUPLICATE_COMBINATION',
            `Duplicate combination found for fields: ${fields.join(', ')}`,
            context
          );
        }

        seenCombinations.add(combination);
        // Only update meta if it was provided
        if (context.meta) {
          context.meta = { ...context.meta, seenCombinations };
        }

        return null;
      },
    });
  },

  // === Performance Validators ===

  /**
   * Validates operation is within performance budget.
   */
  withinBudget(budget: ValidationPerformanceBudget) {
    return createValidator({
      id: 'performance-budget',
      message: `Operation exceeded budget`,
      severity: 'warning',
      fixable: false,
      validate: (value: unknown, context: ValidationContext) => {
        // Check performance metrics in context
        const perf = context.meta?.performance as
          | { duration: number; memory: number }
          | undefined;
        if (perf && perf.duration > budget.maxDuration) {
          return createError(
            'PERFORMANCE_BUDGET_EXCEEDED',
            `Operation exceeded duration budget: ${perf.duration}ms > ${budget.maxDuration}ms`,
            context
          );
        }

        if (perf && perf.memory > budget.maxMemory) {
          return createError(
            'MEMORY_LIMIT_EXCEEDED',
            `Operation exceeded memory budget: ${perf.memory} bytes > ${budget.maxMemory} bytes`,
            context
          );
        }

        return null;
      },
    });
  },

  // === Custom Validators ===

  /**
   * Creates a custom validator.
   */
  custom(
    validate: (
      value: unknown,
      context: ValidationContext
    ) => ValidationError | null,
    options: {
      id: string;
      severity?: 'error' | 'warning';
      message: string;
    }
  ): Validator {
    return createValidator({
      id: options.id,
      message: options.message,
      severity: options.severity || 'error',
      fixable: false,
      validate,
    });
  },
};

// ===================================================================
// Helper Functions
// ===================================================================

/**
 * Create a validator function.
 */
function createValidator(options: {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fixable: boolean;
  validate: (
    value: unknown,
    context: ValidationContext
  ) => ValidationError | null;
}): Validator {
  return {
    id: options.id,
    severity: options.severity,
    message: options.message,
    validate: (value: unknown, context: ValidationContext) => {
      return options.validate(value, {
        ...context,
        mode: context.mode || 'normal',
        meta: context.meta || {},
      });
    },
  };
}

/**
 * Create a validation error.
 */
function createError(
  code: string,
  message: string,
  context: ValidationContext,
  extra?: {
    fix?: ValidationFix;
    errors?: ValidationError[];
    meta?: Record<string, unknown>;
  }
): ValidationError {
  return {
    code,
    message,
    path: context.path,
    value:
      context.data ??
      (context.rowIndex !== undefined ? `Row ${context.rowIndex}` : 'Unknown'),
    severity: 'error',
    fixable: !!extra?.fix,
    fix: extra?.fix,
    meta: extra?.meta,
  };
}

/**
 * Validate string format.
 */
function validateFormat(value: string, format: string): boolean {
  switch (format) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value
      );
    case 'datetime':
      return !isNaN(Date.parse(value));
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(value);
    case 'time':
      return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
    default:
      return true;
  }
}
