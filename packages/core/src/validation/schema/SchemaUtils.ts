/**
 * Schema utilities for creating schemas from various sources.
 *
 * Provides utilities for schema inference and creation.
 *
 * @module @gridkit/core/validation/schema
 */

// Import base types

import { RowData } from '../../types';

import type {
  Schema as SchemaType,
  FieldSchema,
  FieldConstraints,
  FieldType,
} from './FieldSchema';
import { createSchema as createSchemaFunc } from './Schema';

// Import validation types

// Import result types - use canonical definitions from ValidationResult

// Import validators - use 'any' to avoid circular deps

// Import ColumnDef and ColumnMeta
import type { ColumnDef } from '@/types/column/ColumnDef';

// Import createSchema function (NOT as type only - we need the actual function)

// ===================================================================
// Schema Utils Implementation
// ===================================================================

/**
 * Schema creation utilities.
 */
export const SchemaUtils = {
  /**
   * Creates a schema from column definitions.
   * Automatically infers types from accessors.
   *
   * @param columns - Column definitions
   * @param options - Schema options
   * @returns Schema instance
   */
  fromColumns<TData extends RowData>(
    columns: ColumnDef<TData>[],
    options?: SchemaOptions
  ): SchemaType<TData> {
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

    return createSchemaFunc(fields, {
      name: options?.name || 'columns-schema',
      description:
        options?.description || 'Schema inferred from column definitions',
      fieldDescriptions: columns.reduce(
        (acc, col) => {
          if (col.accessorKey) {
            acc[col.accessorKey] =
              typeof col.header === 'string'
                ? col.header
                : (col.header as string);
          }
          return acc;
        },
        {} as Record<string, string>
      ),
    });
  },

  /**
   * Creates a schema from a column definition object.
   * Each key is a column accessor, value is field configuration.
   *
   * @param columnConfigs - Column configuration object
   * @param options - Schema options
   * @returns Schema instance
   */
  fromColumnConfigs<TData extends RowData = RowData>(
    columnConfigs: Record<string, FieldSchema | FieldConfig>,
    options?: SchemaOptions
  ): SchemaType<TData> {
    const fields = Object.entries(columnConfigs).reduce(
      (acc, [key, config]) => {
        if (isFieldSchema(config)) {
          acc[key] = config;
        } else {
          acc[key] = createFieldConfig(config);
        }
        return acc;
      },
      {} as Record<string, FieldSchema>
    );

    return createSchemaFunc(fields, {
      name: options?.name || 'column-configs-schema',
      description: options?.description || 'Schema from column configurations',
    });
  },

  /**
   * Creates a schema from TypeScript interface definition.
   * Requires runtime type information (limited support).
   *
   * @param interfaceDef - Interface definition
   * @param options - Schema options
   * @returns Schema instance
   */
  fromInterface<TData extends RowData>(
    interfaceDef: InterfaceDefinition,
    options?: SchemaOptions
  ): SchemaType<TData> {
    const fields = interfaceDef.fields.reduce(
      (acc, fieldDef) => {
        acc[fieldDef.name] = {
          type: fieldDef.type,
          required: fieldDef.required,
          nullable: fieldDef.nullable,
          defaultValue: fieldDef.defaultValue,
          constraints: fieldDef.constraints,
          validators: fieldDef.validators,
          normalize: fieldDef.normalize,
        };
        return acc;
      },
      {} as Record<string, FieldSchema>
    );

    return createSchemaFunc(fields, {
      name: options?.name || interfaceDef.name || 'interface-schema',
      description: options?.description || interfaceDef.description,
      fieldDescriptions: interfaceDef.fieldDescriptions,
    });
  },

  /**
   * Merges multiple schemas into one.
   *
   * @param schemas - Schemas to merge
   * @param options - Merge options
   * @returns Merged schema
   */
  merge<TData extends RowData>(
    schemas: SchemaType<TData>[],
    options?: MergeOptions
  ): SchemaType<TData> {
    const mergedFields = schemas.reduce(
      (acc, schema) => ({
        ...acc,
        ...schema.fields,
      }),
      {} as Record<string, FieldSchema>
    );

    return createSchemaFunc(mergedFields, {
      name: options?.name || 'merged-schema',
      description:
        options?.description || 'Merged schema from multiple sources',
    });
  },

  /**
   * Creates a partial schema (all fields are optional).
   *
   * @param schema - Schema to make partial
   * @returns Partial schema
   */
  makePartial<TData extends RowData>(
    schema: SchemaType<TData>
  ): SchemaType<Partial<TData>> {
    const partialFields = Object.entries(schema.fields).reduce(
      (acc, [name, field]) => ({
        ...acc,
        [name]: {
          ...field,
          required: false,
          isOptional: true,
        },
      }),
      {} as Record<string, FieldSchema>
    );

    return {
      ...schema,
      fields: partialFields,
      isOptional: true,
      meta: {
        ...schema.meta,
        name: `${schema.meta?.name || 'schema'}-partial`,
      },
    };
  },

  /**
   * Creates a required schema (all fields are required).
   *
   * @param schema - Schema to make required
   * @returns Required schema
   */
  makeRequired<TData extends RowData>(
    schema: SchemaType<TData>
  ): SchemaType<TData> {
    const requiredFields = Object.entries(schema.fields).reduce(
      (acc, [name, field]) => ({
        ...acc,
        [name]: {
          ...field,
          required: true,
          isOptional: false,
        },
      }),
      {} as Record<string, FieldSchema>
    );

    return {
      ...schema,
      fields: requiredFields,
      isOptional: false,
      meta: {
        ...schema.meta,
        name: `${schema.meta?.name || 'schema'}-required`,
      },
    };
  },
};

// ===================================================================
// Helper Types and Functions
// ===================================================================

/**
 * Field configuration for simpler schema creation.
 */
export interface FieldConfig {
  /**
   * Field type.
   */
  type: FieldType;

  /**
   * Whether field is required.
   * @default false
   */
  required?: boolean;

  /**
   * Whether field can be null.
   * @default false
   */
  nullable?: boolean;

  /**
   * Default value.
   */
  defaultValue?: unknown;

  /**
   * Field constraints.
   */
  constraints?: FieldConstraints;

  /**
   * Custom validators.
   */
  validators?: readonly any[];

  /**
   * Normalization function.
   */
  normalize?: (value: unknown) => unknown;
}

/**
 * Schema options.
 */
export interface SchemaOptions {
  /**
   * Schema name.
   */
  name?: string;

  /**
   * Schema description.
   */
  description?: string;

  /**
   * Example data.
   */
  example?: unknown;

  /**
   * Field descriptions.
   */
  fieldDescriptions?: Record<string, string>;
}

/**
 * Interface definition for schema creation.
 */
export interface InterfaceDefinition {
  /**
   * Interface name.
   */
  name: string;

  /**
   * Interface description.
   */
  description?: string;

  /**
   * Field definitions.
   */
  fields: FieldDefinition[];

  /**
   * Field descriptions.
   */
  fieldDescriptions?: Record<string, string>;
}

/**
 * Field definition in interface.
 */
export interface FieldDefinition {
  /**
   * Field name.
   */
  name: string;

  /**
   * Field type.
   */
  type: FieldType;

  /**
   * Whether field is required.
   */
  required: boolean;

  /**
   * Whether field can be null.
   */
  nullable: boolean;

  /**
   * Default value.
   */
  defaultValue?: unknown;

  /**
   * Field constraints.
   */
  constraints?: FieldConstraints;

  /**
   * Custom validators.
   */
  validators?: readonly any[];

  /**
   * Normalization function.
   */
  normalize?: (value: unknown) => unknown;
}

/**
 * Merge options.
 */
export interface MergeOptions {
  /**
   * Merged schema name.
   */
  name?: string;

  /**
   * Merged schema description.
   */
  description?: string;

  /**
   * Conflict resolution strategy.
   * @default 'override' - Later schema overrides earlier
   */
  conflictStrategy?: 'override' | 'error' | 'merge';
}

/**
 * Check if value is a FieldSchema.
 */
function isFieldSchema(value: unknown): value is FieldSchema {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as FieldSchema).type === 'string'
  );
}

/**
 * Create FieldSchema from FieldConfig.
 */
function createFieldConfig(config: FieldConfig): FieldSchema {
  return {
    type: config.type,
    required: config.required ?? false,
    nullable: config.nullable ?? false,
    defaultValue: config.defaultValue,
    constraints: config.constraints,
    validators: config.validators,
    normalize: config.normalize,
  };
}

/**
 * Infer FieldSchema from ColumnDef.
 */
function inferFieldSchema<TData extends RowData>(
  column: ColumnDef<TData>
): FieldSchema {
  const base: FieldSchema = {
    type: 'any',
    required: true,
    nullable: false,
  };

  // Check meta for validation hints
  const metaValidation = column.meta?.validation;

  if (metaValidation) {
    return createFieldConfig(metaValidation);
  }

  // Infer from accessorKey if possible
  if (column.accessorKey) {
    // Try to get type hints from accessor key structure
    // This is limited without runtime type information
    const hints = inferTypeHints(column);

    if (hints) {
      return hints;
    }
  }

  return base;
}

/**
 * Infer type hints from column definition.
 */
function inferTypeHints<TData extends RowData>(
  column: ColumnDef<TData>
): FieldSchema | null {
  // Check for format hints
  if (column.meta?.format) {
    const format = column.meta.format;

    switch (format.dateFormat) {
      case 'date':
        return {
          type: 'date',
          required: true,
          nullable: false,
          normalize: (value: unknown) => {
            if (value instanceof Date) return value;
            return new Date(value as string);
          },
        };
      default:
        break;
    }

    if (format.currency) {
      return {
        type: 'number',
        required: true,
        nullable: false,
        constraints: {
          min: 0,
        },
      };
    }
  }

  return null;
}
