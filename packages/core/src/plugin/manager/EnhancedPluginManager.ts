import { PluginManager } from '../core/PluginManager';
import { PluginError, PluginNotFoundError, PluginValidationError, PluginDependencyError } from '../types/enhanced';
import { PluginContextFactory } from '../context/EnhancedPluginContext';
import type { EnhancedPlugin, EnhancedPluginMetadata, PluginSearchQuery, PluginSearchResult, PluginUpdate, PluginHealth } from '../types/enhanced';
import type { EventBus } from '../../events/core';

export class EnhancedPluginManager extends PluginManager<Record<string, unknown>> {
  private contextFactory: PluginContextFactory;
  private pluginUpdates: Map<string, PluginUpdate> = new Map();
  
  constructor() {
    super();
    this.contextFactory = new PluginContextFactory();
  }

  /**
   * Register and initialize a plugin
   */
  async registerAndInitialize<T>(
    plugin: EnhancedPlugin<T>,
    config?: Partial<T>
  ): Promise<void> {
    try {
      // Cast to Plugin<Record<string, unknown>> for compatibility with base class
      this.register(plugin as any);
      
      const metadata = plugin.metadata as EnhancedPluginMetadata;
      const resolvedConfig = this.resolveConfig(plugin, config);
      
      await this.initializePlugin(metadata.id, resolvedConfig);
      
      console.log(`Plugin ${metadata.id} v${metadata.version} registered and initialized`);
    } catch (error) {
      console.error(`Failed to register plugin:`, error);
      throw error;
    }
  }

  /**
   * Resolve plugin configuration with defaults
   */
  private resolveConfig<T>(plugin: EnhancedPlugin<T>, config?: Partial<T>): Record<string, unknown> {
    const defaults = plugin.getDefaultConfig?.() || {};
    return { ...defaults, ...config };
  }

  /**
   * Unregister and destroy a plugin
   */
  async unregisterAndDestroy(pluginId: string): Promise<void> {
    try {
      await this.destroyPlugin(pluginId);
      this.unregister(pluginId);
      
      console.log(`Plugin ${pluginId} unregistered and destroyed`);
    } catch (error) {
      console.error(`Failed to unregister plugin:`, error);
      throw error;
    }
  }

  /**
   * Check plugin health
   */
  async checkPluginHealth(pluginId: string): Promise<PluginHealth> {
    try {
      const plugin = this.getPlugin(pluginId);
      if (!plugin) {
        throw new PluginNotFoundError(pluginId);
      }

      const enhancedPlugin = plugin as EnhancedPlugin;
      if (typeof enhancedPlugin.healthCheck !== 'function') {
        return { status: 'healthy', timestamp: Date.now() };
      }

      const startTime = performance.now();
      const health = await enhancedPlugin.healthCheck!();
      health.timestamp = Date.now();
      health.duration = performance.now() - startTime;

      return health;
    } catch (error) {
      return {
        status: 'error',
        timestamp: Date.now(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Check health of all plugins
   */
  async checkAllHealth(): Promise<Map<string, PluginHealth>> {
    const healthMap = new Map<string, PluginHealth>();
    const pluginIds = this.getPluginIds();

    for (const pluginId of pluginIds) {
      const health = await this.checkPluginHealth(pluginId);
      healthMap.set(pluginId, health);
    }

    return healthMap;
  }

  /**
   * Reload plugin (hot reload)
   */
  async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      throw new PluginNotFoundError(pluginId);
    }

    // Destroy current instance
    await this.destroyPlugin(pluginId);

    // Reinitialize
    const metadata = plugin.metadata;
    
    // Re-register (if needed)
    this.register(plugin);
    
    // Reinitialize
    await this.initializePlugin(pluginId, {});
  }

  /**
   * Enable hot reload for a plugin
   */
  enableHotReload(pluginId: string): void {
    // This would typically set up file watchers
    console.log(`Hot reload enabled for plugin: ${pluginId}`);
  }

  /**
   * Disable hot reload for a plugin
   */
  disableHotReload(pluginId: string): void {
    console.log(`Hot reload disabled for plugin: ${pluginId}`);
  }

  /**
   * Search for plugins in marketplace
   * (Mock implementation - would connect to actual marketplace API)
   */
  async searchPlugins(query: PluginSearchQuery): Promise<PluginSearchResult> {
    // This would make API calls to marketplace
    return {
      plugins: [],
      total: 0,
      page: query.offset ? Math.floor(query.offset / (query.limit || 10)) : 0,
      pageSize: query.limit || 10,
      filters: query as Record<string, unknown>
    };
  }

  /**
   * Get plugin by ID (from marketplace)
   * Note: This is a different method from PluginManager.getPlugin
   */
  async getPluginFromMarketplace(pluginId: string): Promise<EnhancedPlugin | undefined> {
    // This would fetch plugin from marketplace
    return undefined;
  }

  /**
   * List all registered plugins with optional filters
   */
  listPlugins(filter?: { category?: string; verified?: boolean }): EnhancedPluginMetadata[] {
    const plugins = this.getPluginIds().map(id => this.getPluginMetadata(id)).filter(Boolean) as EnhancedPluginMetadata[];
    
    return plugins.filter(plugin => {
      if (filter?.category && plugin.category !== filter.category) {
        return false;
      }
      if (filter?.verified && !plugin.verified) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get plugins by category
   */
  async getPluginsByCategory(category: string): Promise<EnhancedPluginMetadata[]> {
    return this.listPlugins({ category });
  }

  /**
   * Get featured plugins
   */
  async getFeaturedPlugins(): Promise<EnhancedPluginMetadata[]> {
    return this.listPlugins({ verified: true }).filter(p => p.featured);
  }

  /**
   * Check for plugin updates
   */
  async checkUpdates(): Promise<PluginUpdate[]> {
    // This would check remote marketplace for updates
    return Array.from(this.pluginUpdates.values());
  }

  /**
   * Update plugin version (marketplace)
   * Note: Different from PluginManager.updatePlugin which updates config
   */
  async updatePluginVersion(pluginId: string, version?: string): Promise<void> {
    // This would download and install updated version
    console.log(`Updating plugin ${pluginId} to version ${version || 'latest'}`);
  }

  /**
   * Validate plugin configuration
   */
  validatePluginConfig<T>(plugin: EnhancedPlugin<T>, config: T): boolean {
    if (!plugin.validateConfig) {
      return true;
    }

    try {
      const result = plugin.validateConfig(config);
      return result.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get plugin update info
   */
  getPluginUpdateInfo(pluginId: string): PluginUpdate | undefined {
    return this.pluginUpdates.get(pluginId);
  }

  /**
   * Register plugin update info
   */
  registerPluginUpdate(pluginId: string, update: PluginUpdate): void {
    this.pluginUpdates.set(pluginId, update);
  }

  /**
   * Destroy all plugins and cleanup
   */
  async destroyAll(): Promise<void> {
    await super.destroyAll();
    this.contextFactory.destroyAll();
    this.pluginUpdates.clear();
  }

  /**
   * Get context factory
   */
  getContextFactory(): PluginContextFactory {
    return this.contextFactory;
  }

  /**
   * Get enhanced plugin context
   */
  getEnhancedContext(pluginId: string): any {
    return this.contextFactory.getContext(pluginId);
  }
}
