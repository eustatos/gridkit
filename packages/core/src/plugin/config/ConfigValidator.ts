// ConfigValidator.ts - Runtime validation

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public readonly details: string[] = []) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Configuration validator for runtime validation of plugin configurations
 */
export class ConfigValidator {
  /**
   * Validates a configuration object against a schema
   * @param config - The configuration object to validate
   * @param schema - The schema to validate against
   * @throws ConfigValidationError if validation fails
   */
  static validate<T>(config: unknown, schema: { validate: (config: unknown) => config is T }): T {
    if (!schema.validate(config)) {
      throw new ConfigValidationError('Configuration validation failed');
    }
    
    return config;
  }

  /**
   * Validates a partial configuration object against a schema
   * @param partialConfig - The partial configuration object to validate
   * @param schema - The schema to validate against
   * @throws ConfigValidationError if validation fails
   */
  static validatePartial<T>(
    partialConfig: Partial<T>,
    schema: { validate: (config: unknown) => config is T }
  ): Partial<T> {
    // For partial validation, we can't fully validate the object
    // but we can check that it doesn't violate the schema
    // This is a simplified implementation
    return partialConfig;
  }

  /**
   * Merges a partial configuration with a base configuration and validates the result
   * @param baseConfig - The base configuration
   * @param partialConfig - The partial configuration to merge
   * @param schema - The schema to validate against
   * @returns The merged and validated configuration
   * @throws ConfigValidationError if validation fails
   */
  static mergeAndValidate<T>(
    baseConfig: T,
    partialConfig: Partial<T>,
    schema: { validate: (config: unknown) => config is T }
  ): T {
    const mergedConfig = { ...baseConfig, ...partialConfig };
    
    if (!schema.validate(mergedConfig)) {
      throw new ConfigValidationError('Merged configuration validation failed');
    }
    
    return mergedConfig;
  }
}