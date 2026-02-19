// ConfigurablePlugin.ts - Enhanced plugin with config support

import { ConfigManager } from './config/ConfigManager';
import { ConfigSchema } from './config/ConfigSchema';
import { Plugin } from './core/Plugin';
import { DependencyResolver } from './dependencies/DependencyResolver';

/**
 * Enhanced plugin with configuration and dependency management
 */
export class ConfigurablePlugin<T extends Record<string, unknown> = Record<string, unknown>> implements Plugin {
  private configManager: ConfigManager;
  private dependencyResolver: DependencyResolver;
  private schema?: ConfigSchema<T>;
  
  /**
   * Creates a new configurable plugin
   * @param id - The unique identifier for the plugin
   * @param configManager - The configuration manager to use
   * @param dependencyResolver - The dependency resolver to use
   */
  constructor(
    public readonly id: string,
    configManager: ConfigManager,
    dependencyResolver: DependencyResolver
  ) {
    this.configManager = configManager;
    this.dependencyResolver = dependencyResolver;
  }
  
  /**
   * Gets the current configuration for the plugin
   * @returns The current configuration
   */
  getConfig(): T {
    if (!this.schema) {
      throw new Error('Plugin schema not registered');
    }
    
    return this.configManager.getConfig<T>(this.id);
  }
  
  /**
   * Updates the configuration for the plugin
   * @param changes - The partial configuration changes to apply
   */
  updateConfig(changes: Partial<T>): void {
    if (!this.schema) {
      throw new Error('Plugin schema not registered');
    }
    
    this.configManager.updateConfig<T>(this.id, changes);
  }
  
  /**
   * Resets the configuration for the plugin to its defaults
   */
  resetConfig(): void {
    if (!this.schema) {
      throw new Error('Plugin schema not registered');
    }
    
    this.configManager.resetConfig<T>(this.id);
  }
  
  /**
   * Registers a configuration schema for the plugin
   * @param schema - The configuration schema for the plugin
   */
  registerSchema(schema: ConfigSchema<T>): void {
    this.schema = schema;
    this.configManager.registerSchema(this.id, schema);
  }
  
  /**
   * Gets the resolved dependencies for the plugin
   * @returns The resolved dependencies
   */
  getDependencies(): string[] {
    // This would integrate with the dependency resolver
    // For now, returning an empty array
    return [];
  }
  
  /**
   * Initializes the plugin
   * @returns A promise that resolves when the plugin is initialized
   */
  async initialize(): Promise<void> {
    // Initialize the plugin with its configuration
    // This would typically involve setting up any necessary resources
    console.log(`Initializing plugin ${this.id} with config:`, this.getConfig());
  }
  
  /**
   * Destroys the plugin
   * @returns A promise that resolves when the plugin is destroyed
   */
  async destroy(): Promise<void> {
    // Clean up any resources used by the plugin
    console.log(`Destroying plugin ${this.id}`);
  }
}