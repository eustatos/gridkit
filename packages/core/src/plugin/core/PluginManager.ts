import { createEventBus, type EventBus } from '../../events';
import { EventPriority } from '../../events/types/base';

import type { Plugin, PluginContext, PluginMetadata } from './Plugin';

/**
 * Plugin manager for centralized plugin management
 */
export class PluginManager<TConfig = Record<string, unknown>> {
  private plugins = new Map<string, Plugin<TConfig>>();
  private contexts = new Map<string, PluginContext>();
  private eventBus: EventBus;
  private isInitialized = false;

  constructor() {
    this.eventBus = createEventBus();
  }

  /**
   * Register a plugin with the manager
   * 
   * @param plugin - Plugin to register
   * @throws {Error} If plugin with same ID already registered
   * @throws {Error} If plugin dependencies are not met
   */
  register(plugin: Plugin<TConfig>): void {
    const { metadata } = plugin;
    
    // Check if plugin already registered
    if (this.plugins.has(metadata.id)) {
      throw new Error(`Plugin ${metadata.id} already registered`);
    }

    // Check dependencies
    if (metadata.dependencies) {
      for (const depId of metadata.dependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Missing dependency: ${depId} for plugin ${metadata.id}`);
        }
      }
    }

    this.plugins.set(metadata.id, plugin);
    
    // Emit plugin registered event
    this.eventBus.emit('plugin.registered' as any, {
      pluginId: metadata.id,
      metadata
    }, { priority: EventPriority.IMMEDIATE });
  }

  /**
   * Unregister a plugin
   * 
   * @param pluginId - ID of plugin to unregister
   * @throws {Error} If plugin is not registered
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not registered`);
    }

    // Destroy plugin if initialized
    if (this.contexts.has(pluginId)) {
      this.destroyPlugin(pluginId);
    }

    this.plugins.delete(pluginId);
    
    // Emit plugin unregistered event
    this.eventBus.emit('plugin.unregistered' as any, {
      pluginId
    }, { priority: EventPriority.IMMEDIATE });
  }

  /**
   * Initialize a plugin
   * 
   * @param pluginId - ID of plugin to initialize
   * @param config - Plugin configuration
   * @throws {Error} If plugin is not registered
   */
  async initializePlugin(
    pluginId: string, 
    config?: TConfig
  ): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not registered`);
    }

    // Create plugin context
    const context: PluginContext = {
      eventBus: createEventBus(),
      config: config as Record<string, unknown>,
      metadata: plugin.metadata
    };

    // Store context
    this.contexts.set(pluginId, context);

    try {
      // Initialize plugin
      const result = plugin.initialize(config as TConfig, context);
      if (result instanceof Promise) {
        await result;
      }
      
      // Emit plugin initialized event
      this.eventBus.emit('plugin.initialized' as any, {
        pluginId,
        metadata: plugin.metadata
      }, { priority: EventPriority.IMMEDIATE });
    } catch (error) {
      // Clean up context on initialization failure
      this.contexts.delete(pluginId);
      throw error;
    }
  }

  /**
   * Destroy a plugin and cleanup resources
   * 
   * @param pluginId - ID of plugin to destroy
   * @throws {Error} If plugin is not registered
   */
  async destroyPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not registered`);
    }

    const context = this.contexts.get(pluginId);
    if (!context) {
      // Plugin not initialized, nothing to destroy
      return;
    }

    try {
      // Destroy plugin
      const result = plugin.destroy();
      if (result instanceof Promise) {
        await result;
      }
      
      // Emit plugin destroyed event
      this.eventBus.emit('plugin.destroyed' as any, {
        pluginId,
        metadata: plugin.metadata
      }, { priority: EventPriority.IMMEDIATE });
    } finally {
      // Clean up context
      this.contexts.delete(pluginId);
      
      // Clear plugin event bus
      try {
        context.eventBus.clear();
      } catch (error) {
        console.warn(`Error clearing event bus for plugin ${pluginId}:`, error);
      }
    }
  }

  /**
   * Update plugin configuration
   * 
   * @param pluginId - ID of plugin to update
   * @param config - Partial configuration update
   * @throws {Error} If plugin is not registered
   * @throws {Error} If plugin doesn't support updates
   */
  updatePlugin(pluginId: string, config: TConfig): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not registered`);
    }

    if (!plugin.update) {
      throw new Error(`Plugin ${pluginId} does not support configuration updates`);
    }

    plugin.update(config as Partial<TConfig>);
    
    // Emit plugin updated event
    this.eventBus.emit('plugin.updated' as any, {
      pluginId,
      metadata: plugin.metadata,
      config
    }, { priority: EventPriority.IMMEDIATE });
  }

  /**
   * Get plugin metadata
   * 
   * @param pluginId - ID of plugin
   * @returns Plugin metadata or undefined if not registered
   */
  getPluginMetadata(pluginId: string): PluginMetadata | undefined {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.metadata : undefined;
  }

  /**
   * Get all registered plugin IDs
   * 
   * @returns Array of plugin IDs
   */
  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is registered
   * 
   * @param pluginId - ID of plugin to check
   * @returns True if plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Check if a plugin is initialized
   * 
   * @param pluginId - ID of plugin to check
   * @returns True if plugin is initialized
   */
  isPluginInitialized(pluginId: string): boolean {
    return this.contexts.has(pluginId);
  }

  /**
   * Get plugin context
   * 
   * @param pluginId - ID of plugin
   * @returns Plugin context or undefined if not initialized
   */
  getPluginContext(pluginId: string): PluginContext | undefined {
    return this.contexts.get(pluginId);
  }

  /**
   * Get plugin by ID
   * 
   * @param pluginId - ID of plugin
   * @returns Plugin or undefined if not registered
   */
  getPlugin(pluginId: string): Plugin<TConfig> | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get the global event bus for plugin communication
   * 
   * @returns Event bus instance
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Destroy all plugins and cleanup resources
   */
  async destroyAll(): Promise<void> {
    const pluginIds = Array.from(this.plugins.keys());
    
    // Destroy plugins in reverse order
    for (let i = pluginIds.length - 1; i >= 0; i--) {
      const pluginId = pluginIds[i];
      try {
        await this.destroyPlugin(pluginId);
      } catch (error) {
        console.error(`Error destroying plugin ${pluginId}:`, error);
      }
    }
    
    // Clear all plugins
    this.plugins.clear();
    this.contexts.clear();
    
    // Clear event bus
    this.eventBus.clear();
    
    this.isInitialized = false;
  }
}