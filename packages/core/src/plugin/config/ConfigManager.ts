// ConfigManager.ts - Central configuration management

import { ConfigSchema } from './ConfigSchema';
import { ConfigValidator } from './ConfigValidator';

/**
 * Configuration manager for handling plugin configurations with validation and events
 */
export class ConfigManager {
  private configs = new Map<string, unknown>();
  private schemas = new Map<string, ConfigSchema<unknown>>();
  private watchers = new Map<string, Set<(config: unknown) => void>>();

  /**
   * Registers a configuration schema for a plugin
   * @param pluginId - The ID of the plugin
   * @param schema - The configuration schema for the plugin
   */
  registerSchema<T>(pluginId: string, schema: ConfigSchema<T>): void {
    this.schemas.set(pluginId, schema as ConfigSchema<unknown>);
    // Initialize with default configuration
    this.configs.set(pluginId, { ...schema.defaults });
  }

  /**
   * Gets the current configuration for a plugin
   * @param pluginId - The ID of the plugin
   * @returns The current configuration for the plugin
   * @throws Error if no schema is registered for the plugin
   */
  getConfig<T>(pluginId: string): T {
    if (!this.schemas.has(pluginId)) {
      throw new Error(`No schema registered for plugin ${pluginId}`);
    }
    
    const config = this.configs.get(pluginId);
    if (config === undefined) {
      throw new Error(`No configuration found for plugin ${pluginId}`);
    }
    
    return config as T;
  }

  /**
   * Updates the configuration for a plugin with partial changes
   * @param pluginId - The ID of the plugin
   * @param changes - The partial configuration changes to apply
   * @throws Error if no schema is registered for the plugin or if validation fails
   */
  updateConfig<T>(pluginId: string, changes: Partial<T>): void {
    if (!this.schemas.has(pluginId)) {
      throw new Error(`No schema registered for plugin ${pluginId}`);
    }
    
    const schema = this.schemas.get(pluginId);
    const currentConfig = this.getConfig<T>(pluginId);
    
    // Merge changes with current configuration
    const newConfig = { ...currentConfig, ...changes };
    
    // Validate the new configuration
    if (!schema.validate(newConfig)) {
      throw new Error(`Invalid configuration for plugin ${pluginId}`);
    }
    
    // Update the configuration
    this.configs.set(pluginId, newConfig);
    
    // Notify watchers
    this.notifyWatchers(pluginId, newConfig);
  }

  /**
   * Resets the configuration for a plugin to its defaults
   * @param pluginId - The ID of the plugin
   * @throws Error if no schema is registered for the plugin
   */
  resetConfig<T>(pluginId: string): void {
    if (!this.schemas.has(pluginId)) {
      throw new Error(`No schema registered for plugin ${pluginId}`);
    }
    
    const schema = this.schemas.get(pluginId);
    if (!schema) {
      throw new Error(`No schema registered for plugin ${pluginId}`);
    }
    const defaultConfig = schema.defaults as T;
    
    // Update the configuration
    this.configs.set(pluginId, defaultConfig);
    
    // Notify watchers
    this.notifyWatchers(pluginId, defaultConfig);
  }

  /**
   * Watches for configuration changes for a plugin
   * @param pluginId - The ID of the plugin
   * @param callback - The callback to call when the configuration changes
   * @returns A function to unsubscribe from configuration changes
   */
  watchConfig<T>(pluginId: string, callback: (config: T) => void): () => void {
    if (!this.watchers.has(pluginId)) {
      this.watchers.set(pluginId, new Set());
    }
    
    const watchers = this.watchers.get(pluginId);
    const typedCallback = callback as (config: unknown) => void;
    watchers.add(typedCallback);
    
    return () => {
      watchers.delete(typedCallback);
    };
  }

  /**
   * Notifies watchers of a configuration change
   * @param pluginId - The ID of the plugin
   * @param config - The new configuration
   */
  private notifyWatchers(pluginId: string, config: unknown): void {
    const watchers = this.watchers.get(pluginId);
    if (watchers) {
      for (const watcher of watchers) {
        try {
          watcher(config);
        } catch (error) {
          console.error(`Error in config watcher for plugin ${pluginId}:`, error);
        }
      }
    }
  }
}