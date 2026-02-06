// ConfigSchema.ts - Type-safe configuration schema definitions

/**
 * Configuration schema interface for type-safe plugin configuration
 * @template T - The type of the configuration object
 */
export interface ConfigSchema<T> {
  /** Default configuration values */
  readonly defaults: T;
  
  /** 
   * Validates a configuration object against this schema
   * @param config - The configuration object to validate
   * @returns true if the configuration is valid, false otherwise
   */
  readonly validate: (config: unknown) => config is T;
  
  /** Optional configuration migrations */
  readonly migrations?: ConfigMigration[];
}

/**
 * Configuration migration function
 * @param config - The configuration to migrate
 * @returns The migrated configuration
 */
export type ConfigMigration = (config: unknown) => unknown;

/**
 * Creates a new configuration schema
 * @template T - The type of the configuration object
 * @param defaults - Default configuration values
 * @param validator - Function to validate configuration objects
 * @returns A new ConfigSchema instance
 */
export function createConfigSchema<T>(
  defaults: T,
  validator: (config: unknown) => config is T
): ConfigSchema<T> {
  return {
    defaults: Object.freeze({ ...defaults }),
    validate: validator,
  };
}