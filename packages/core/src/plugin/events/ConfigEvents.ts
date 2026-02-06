// ConfigEvents.ts - Configuration-related events

/**
 * Configuration update event
 */
export interface ConfigUpdateEvent {
  /** The ID of the plugin whose configuration was updated */
  pluginId: string;
  /** The new configuration */
  config: unknown;
  /** The previous configuration */
  previousConfig: unknown;
}

/**
 * Configuration error event
 */
export interface ConfigErrorEvent {
  /** The ID of the plugin with the configuration error */
  pluginId: string;
  /** The error that occurred */
  error: Error;
  /** The invalid configuration */
  config: unknown;
}

/**
 * Dependency loaded event
 */
export interface DependencyLoadedEvent {
  /** The ID of the plugin whose dependency was loaded */
  pluginId: string;
  /** The ID of the loaded dependency */
  dependencyId: string;
  /** The version of the loaded dependency */
  version: string;
}

/**
 * Configuration-related events for the plugin system
 */
export class ConfigEvents {
  /**
   * Event type for configuration updates
   */
  static readonly CONFIG_UPDATE = 'plugin:config:update';
  
  /**
   * Event type for configuration errors
   */
  static readonly CONFIG_ERROR = 'plugin:config:error';
  
  /**
   * Event type for dependency loading
   */
  static readonly DEPENDENCY_LOADED = 'plugin:dependency:loaded';
  
  /**
   * Creates a configuration update event
   * @param pluginId - The ID of the plugin whose configuration was updated
   * @param config - The new configuration
   * @param previousConfig - The previous configuration
   * @returns The configuration update event
   */
  static createConfigUpdateEvent(
    pluginId: string,
    config: unknown,
    previousConfig: unknown
  ): ConfigUpdateEvent {
    return {
      pluginId,
      config,
      previousConfig
    };
  }
  
  /**
   * Creates a configuration error event
   * @param pluginId - The ID of the plugin with the configuration error
   * @param error - The error that occurred
   * @param config - The invalid configuration
   * @returns The configuration error event
   */
  static createConfigErrorEvent(
    pluginId: string,
    error: Error,
    config: unknown
  ): ConfigErrorEvent {
    return {
      pluginId,
      error,
      config
    };
  }
  
  /**
   * Creates a dependency loaded event
   * @param pluginId - The ID of the plugin whose dependency was loaded
   * @param dependencyId - The ID of the loaded dependency
   * @param version - The version of the loaded dependency
   * @returns The dependency loaded event
   */
  static createDependencyLoadedEvent(
    pluginId: string,
    dependencyId: string,
    version: string
  ): DependencyLoadedEvent {
    return {
      pluginId,
      dependencyId,
      version
    };
  }
}