/**
 * Schema implementation for runtime validation.
 *
 * Provides schema creation and validation functionality.
 *
 * @module @gridkit/core/validation/schema
 */

// Import types from validation module (after base types)

import type { RowData } from '../../types';
import { createCellId, createRowId, createColumnId } from '../../types/factory';
import type {
  ValidationResult,
  RowValidationResult,
  ValidationWarning,
  ValidationError,
  CellValidationError,
  CellValidationWarning,
} from '../result/ValidationResult';
import type { Validator } from '../validators/ValidatorTypes';

import type {
  Schema,
  FieldSchema,
  FieldConstraints,
  SchemaMeta,
  ValidationContext,
  FieldType,
} from './FieldSchema';

// ===================================================================
// Schema Implementation
// ===================================================================

/**
 * Create a schema from field definitions.
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
 *
 * @param fields - Field definitions
 * @param meta - Schema metadata
 * @returns Schema instance
 */
export function createSchema<T extends RowData = RowData>(
  fields: Record<
    string,
    FieldSchema | ((constraints?: FieldConstraints) => FieldSchema)
  >,
  meta?: SchemaMeta
): Schema<T> {
  // Normalize field definitions
  const normalizedFields = Object.entries(fields).reduce(
    (acc, [name, definition]) => {
      if (typeof definition === 'function') {
        acc[name] = definition();
      } else {
        acc[name] = definition;
      }
      return acc;
    },
    {} as Record<string, FieldSchema>
  );

  // Check if all fields are optional
  const isOptional = Object.values(normalizedFields).every(
    (field) => !field.required || field.isOptional
  );

  return {
    fields: normalizedFields,
    validate: (data: unknown) => validateData<T>(data as T, normalizedFields),
    validatePartial: (data: Partial<unknown>) =>
      validateData<Partial<T>>(data as Partial<T>, normalizedFields, true),
    validateRow: (row: unknown, rowIndex: number) =>
      validateRow(row, rowIndex, normalizedFields),
    isOptional,
    meta: meta || {},
  };
}

/**
 * Create a field schema.
 */
export function field(
  type: FieldType,
  options: {
    required?: boolean;
    nullable?: boolean;
    defaultValue?: unknown;
    constraints?: FieldConstraints;
    validators?: readonly Validator[];
    normalize?: (value: unknown) => unknown;
    isOptional?: boolean;
  } = {}
): FieldSchema {
  const {
    required = false,
    nullable = false,
    defaultValue,
    constraints,
    validators,
    normalize,
    isOptional,
  } = options;

  return {
    type,
    required,
    nullable,
    defaultValue,
    constraints,
    validators,
    normalize,
    isOptional,
  };
}

// ===================================================================
// Validation Functions
// ===================================================================

/**
 * Validate data against schema fields.
 */
function validateData<T extends RowData = RowData>(
  data: unknown,
  fields: Record<string, FieldSchema>,
  isPartial: boolean = false
): ValidationResult<T> {
  const startTime = performance.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let normalizedData: T | undefined = undefined;

  // Check if data is an object
  if (data === null || typeof data !== 'object') {
    errors.push({
      code: 'INVALID_SCHEMA',
      message: 'Expected object data',
      path: [],
      value: data,
      severity: 'error',
      fixable: false,
    });
    return createResult(
      false,
      false,
      undefined,
      errors,
      warnings,
      startTime
    ) as ValidationResult<T>;
  }

  // Normalize data
  normalizedData = { ...data } as T;

  // Validate each field
  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const fieldValue = (normalizedData as Record<string, unknown>)[fieldName];

    // Check required fields
    if (
      fieldSchema.required &&
      !isPartial &&
      (fieldValue === undefined || fieldValue === null)
    ) {
      errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Missing required field: ${fieldName}`,
        path: [fieldName],
        value: undefined,
        severity: 'error',
        fixable: false,
      });
      continue;
    }

    // Skip undefined/null for optional fields
    if (fieldValue === undefined || fieldValue === null) {
      continue;
    }

    // Normalize value
    let normalizedValue: unknown = fieldValue;
    if (fieldSchema.normalize) {
      const normalizeFn = fieldSchema.normalize as (value: unknown) => unknown;
      const normalizedResult = normalizeFn(fieldValue as unknown);
      normalizedValue = normalizedResult;
      (normalizedData as Record<string, unknown>)[fieldName] = normalizedValue;
    }

    // Validate type
    const typeError = validateFieldType(
      normalizedValue,
      fieldSchema.type,
      fieldSchema
    );
    if (typeError) {
      errors.push(typeError);
    }

    // Validate constraints
    if (fieldSchema.constraints) {
      const constraintErrors = validateConstraints(
        normalizedValue,
        fieldSchema.constraints,
        fieldName
      );
      errors.push(...constraintErrors);
    }

    // Validate custom validators
    if (fieldSchema.validators) {
      const validatorContext: ValidationContext = {
        path: [fieldName],
        rowIndex: undefined,
        meta: {},
      };

      for (const validator of fieldSchema.validators) {
        const error = (validator as Validator).validate(
          normalizedValue,
          validatorContext
        );
        if (error) {
          errors.push(error);
        }
      }
    }
  }

  const valid = errors.length === 0;
  const duration = performance.now() - startTime;

  return createResult(
    true,
    valid,
    normalizedData,
    errors,
    warnings,
    startTime,
    duration
  ) as ValidationResult<T>;
}

/**
 * Validate a single row.
 */
function validateRow(
  row: unknown,
  rowIndex: number,
  fields: Record<string, FieldSchema>
): RowValidationResult {
  const errors: CellValidationError[] = [];
  const warnings: CellValidationWarning[] = [];

  // Validate each field
  for (const [fieldName, fieldSchema] of Object.entries(fields)) {
    const fieldValue =
      row !== null && typeof row === 'object' && fieldName in row
        ? (row as Record<string, unknown>)[fieldName]
        : undefined;

    // Check required fields
    if (
      fieldSchema.required &&
      (fieldValue === undefined || fieldValue === null)
    ) {
      errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Missing required field: ${fieldName}`,
        path: [rowIndex.toString(), fieldName],
        value: undefined,
        severity: 'error',
        fixable: false,
        rowIndex,
        field: fieldName,
        cellId: createCellId(createRowId(rowIndex), createColumnId(fieldName)),
        cellValue: undefined,
      });
      continue;
    }

    // Skip undefined/null for optional fields
    if (fieldValue === undefined || fieldValue === null) {
      continue;
    }

    // Validate type
    const typeError = validateFieldType(
      fieldValue,
      fieldSchema.type,
      fieldSchema
    );
    if (typeError) {
      errors.push({
        ...typeError,
        path: [rowIndex.toString(), fieldName],
        rowIndex,
        field: fieldName,
        cellId: createCellId(createRowId(rowIndex), createColumnId(fieldName)),
        cellValue: fieldValue,
      });
    }

    // Validate constraints
    if (fieldSchema.constraints) {
      const constraintErrors = validateConstraints(
        fieldValue,
        fieldSchema.constraints,
        fieldName
      );
      for (const error of constraintErrors) {
        errors.push({
          ...error,
          path: [rowIndex.toString(), fieldName],
          rowIndex,
          field: fieldName,
          cellId: createCellId(
            createRowId(rowIndex),
            createColumnId(fieldName)
          ),
          cellValue: fieldValue,
        });
      }
    }
  }

  const isValid = errors.length === 0;
  const isDirty = !isValid;

  return {
    rowIndex,
    success: true,
    errors,
    warnings,
    isValid,
    isDirty,
  };
}

/**
 * Validate field type.
 */
function validateFieldType(
  value: unknown,
  type: FieldType,
  fieldSchema: FieldSchema
): ValidationError | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          code: 'FIELD_TYPE_MISMATCH',
          message: `Expected string, got ${typeof value}`,
          path: [],
          value,
          severity: 'error',
          fixable: true,
        };
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        return {
          code: 'FIELD_TYPE_MISMATCH',
          message: `Expected number, got ${typeof value}`,
          path: [],
          value,
          severity: 'error',
          fixable: true,
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return {
          code: 'FIELD_TYPE_MISMATCH',
          message: `Expected boolean, got ${typeof value}`,
          path: [],
          value,
          severity: 'error',
          fixable: true,
        };
      }
      break;

    case 'date':
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        return {
          code: 'FIELD_TYPE_MISMATCH',
          message: `Expected Date object`,
          path: [],
          value,
          severity: 'error',
          fixable: true,
        };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return {
          code: 'FIELD_TYPE_MISMATCH',
          message: `Expected array, got ${typeof value}`,
          path: [],
          value,
          severity: 'error',
          fixable: true,
        };
      }
      break;

    case 'object':
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return {
          code: 'FIELD_TYPE_MISMATCH',
          message: `Expected object, got ${Array.isArray(value) ? 'array' : typeof value}`,
          path: [],
          value,
          severity: 'error',
          fixable: true,
        };
      }
      break;

    case 'any':
      // Any type is always valid
      break;

    case 'custom':
      // Custom type validation - check validators
      if (fieldSchema.validators) {
        for (const validator of fieldSchema.validators) {
          const error = (validator as Validator).validate(value, {
            path: [],
            rowIndex: undefined,
            meta: {},
          });
          if (error) {
            return error;
          }
        }
      }
      break;
  }

  return null;
}

/**
 * Validate field constraints.
 */
function validateConstraints(
  value: unknown,
  constraints: FieldConstraints,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value === 'number') {
    if (constraints.min !== undefined && value < constraints.min) {
      errors.push({
        code: 'MIN_VALUE_VIOLATION',
        message: `Value must be at least ${constraints.min}, got ${value}`,
        path: [fieldName],
        value,
        severity: 'error',
        fixable: true,
        fix: {
          type: 'auto',
          description: `Set to ${constraints.min}`,
          apply: () => constraints.min,
          confidence: 0.8,
        },
      });
    }

    if (constraints.max !== undefined && value > constraints.max) {
      errors.push({
        code: 'MAX_VALUE_VIOLATION',
        message: `Value must be at most ${constraints.max}, got ${value}`,
        path: [fieldName],
        value,
        severity: 'error',
        fixable: true,
        fix: {
          type: 'auto',
          description: `Set to ${constraints.max}`,
          apply: () => constraints.max,
          confidence: 0.8,
        },
      });
    }
  }

  if (typeof value === 'string') {
    if (
      constraints.minLength !== undefined &&
      value.length < constraints.minLength
    ) {
      errors.push({
        code: 'MIN_LENGTH_VIOLATION',
        message: `Length must be at least ${constraints.minLength}, got ${value.length}`,
        path: [fieldName],
        value,
        severity: 'error',
        fixable: true,
      });
    }

    if (
      constraints.maxLength !== undefined &&
      value.length > constraints.maxLength
    ) {
      errors.push({
        code: 'MAX_LENGTH_VIOLATION',
        message: `Length must be at most ${constraints.maxLength}, got ${value.length}`,
        path: [fieldName],
        value,
        severity: 'error',
        fixable: true,
      });
    }

    if (constraints.pattern && !constraints.pattern.test(value)) {
      errors.push({
        code: 'PATTERN_MISMATCH',
        message: `Does not match required pattern`,
        path: [fieldName],
        value,
        severity: 'error',
        fixable: false,
      });
    }
  }

  if (constraints.enum !== undefined && !constraints.enum.includes(value)) {
    errors.push({
      code: 'ENUM_VIOLATION',
      message: `Value must be one of: ${constraints.enum.join(', ')}, got ${String(value)}`,
      path: [fieldName],
      value,
      severity: 'error',
      fixable: false,
    });
  }

  return errors;
}

/**
 * Create a validation result.
 */
function createResult(
  success: boolean,
  valid: boolean,
  data: unknown,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  startTime: number,
  duration?: number
): ValidationResult {
  return {
    success,
    valid,
    data: data,
    errors,
    warnings,
    duration: duration || performance.now() - startTime,
    validatedAt: Date.now(),
    stats: {
      totalValidations: 1,
      successfulValidations: valid ? 1 : 0,
      failedValidations: valid ? 0 : 1,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      avgValidationTime: duration || 0,
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
}
