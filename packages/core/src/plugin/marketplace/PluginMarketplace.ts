import type { EnhancedPlugin, EnhancedPluginMetadata, PluginSearchQuery, PluginSearchResult, MarketplaceConfig, PluginAnalytics, PublishMetadata } from '../types/enhanced';

export class PluginMarketplace {
  private config: MarketplaceConfig;
  private cache: Map<string, EnhancedPluginMetadata> = new Map();
  private analytics: Map<string, PluginAnalytics> = new Map();

  constructor(config: MarketplaceConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://marketplace.gridkit.dev/api/v1',
      pluginDir: config.pluginDir || './plugins',
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: config.cacheTTL ?? 60000, // 1 minute default
      ...config
    };
  }

  /**
   * Search plugins
   */
  async search(query: PluginSearchQuery): Promise<PluginSearchResult> {
    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (this.config.cacheEnabled) {
        result.plugins.forEach((plugin: EnhancedPluginMetadata) => {
          this.cache.set(plugin.id, plugin);
        });
      }

      return result;
    } catch (error) {
      console.error('Marketplace search failed:', error);
      return {
        plugins: [],
        total: 0,
        page: 0,
        pageSize: query.limit || 10,
        filters: query
      };
    }
  }

  /**
   * Get plugin by ID
   */
  async getPlugin(pluginId: string): Promise<EnhancedPluginMetadata | undefined> {
    // Check cache first
    if (this.config.cacheEnabled && this.cache.has(pluginId)) {
      return this.cache.get(pluginId);
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/${pluginId}`);

      if (!response.ok) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      const plugin = await response.json();

      if (this.config.cacheEnabled) {
        this.cache.set(pluginId, plugin);
      }

      return plugin;
    } catch (error) {
      console.error('Failed to get plugin:', error);
      return undefined;
    }
  }

  /**
   * Get featured plugins
   */
  async getFeatured(): Promise<EnhancedPluginMetadata[]> {
    const result = await this.search({
      sortBy: 'rating',
      sortOrder: 'desc',
      featured: true,
      limit: 10
    });

    return result.plugins;
  }

  /**
   * Get popular plugins
   */
  async getPopular(): Promise<EnhancedPluginMetadata[]> {
    const result = await this.search({
      sortBy: 'downloads',
      sortOrder: 'desc',
      limit: 10
    });

    return result.plugins;
  }

  /**
   * Get plugins by category
   */
  async getByCategory(category: string): Promise<EnhancedPluginMetadata[]> {
    const result = await this.search({
      category: category as any,
      limit: 20
    });

    return result.plugins;
  }

  /**
   * Install plugin from marketplace
   */
  async install(pluginId: string, version?: string): Promise<EnhancedPlugin> {
    const plugin = await this.getPlugin(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Download and install plugin (mock implementation)
    console.log(`Installing plugin ${pluginId}@${version || 'latest'}`);

    // In real implementation, this would:
    // 1. Download plugin bundle
    // 2. Extract and verify signature
    // 3. Store in plugin directory
    // 4. Load and return plugin instance

    return {
      metadata: plugin,
      initialize: async () => {},
      destroy: async () => {}
    } as any;
  }

  /**
   * Download plugin bundle
   */
  async download(pluginId: string, version?: string): Promise<Blob> {
    const response = await fetch(`${this.config.apiUrl}/plugins/${pluginId}/download?version=${version || 'latest'}`);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Publish plugin to marketplace
   */
  async publish(plugin: EnhancedPlugin, metadata: PublishMetadata): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plugin: {
            metadata: plugin.metadata,
            code: await this.getPluginCode(plugin) // In real impl, would read from file
          },
          metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Publish failed: ${response.statusText}`);
      }

      console.log(`Plugin published successfully`);
    } catch (error) {
      console.error('Publish failed:', error);
      throw error;
    }
  }

  /**
   * Get plugin code (mock - would read from file system)
   */
  private async getPluginCode(plugin: EnhancedPlugin): Promise<string> {
    return '// Plugin code would be read from file system';
  }

  /**
   * Update plugin version
   */
  async update(pluginId: string, version: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/${pluginId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version })
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      console.log(`Plugin ${pluginId} updated to version ${version}`);
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }

  /**
   * Unpublish plugin
   */
  async unpublish(pluginId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/${pluginId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Unpublish failed: ${response.statusText}`);
      }

      console.log(`Plugin ${pluginId} unpublished`);
    } catch (error) {
      console.error('Unpublish failed:', error);
      throw error;
    }
  }

  /**
   * Track plugin download
   */
  async trackDownload(pluginId: string): Promise<void> {
    try {
      await fetch(`${this.config.apiUrl}/analytics/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId, timestamp: Date.now() })
      });
    } catch (error) {
      console.error('Failed to track download:', error);
    }
  }

  /**
   * Track plugin rating
   */
  async trackRating(pluginId: string, rating: number): Promise<void> {
    try {
      await fetch(`${this.config.apiUrl}/analytics/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId, rating, timestamp: Date.now() })
      });
    } catch (error) {
      console.error('Failed to track rating:', error);
    }
  }

  /**
   * Get plugin analytics
   */
  async getAnalytics(pluginId: string): Promise<PluginAnalytics> {
    try {
      const response = await fetch(`${this.config.apiUrl}/plugins/${pluginId}/analytics`);

      if (!response.ok) {
        throw new Error(`Analytics not found: ${pluginId}`);
      }

      const analytics = await response.json();

      if (this.config.cacheEnabled) {
        this.analytics.set(pluginId, analytics);
      }

      return analytics;
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return this.analytics.get(pluginId) || {
        downloads: 0,
        activeUsers: 0,
        rating: 0,
        usageStats: {},
        errorRate: 0
      };
    }
  }

  /**
   * Get marketplace configuration
   */
  getConfig(): MarketplaceConfig {
    return this.config;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.analytics.clear();
  }

  /**
   * Get cached plugin
   */
  getCachedPlugin(pluginId: string): EnhancedPluginMetadata | undefined {
    return this.cache.get(pluginId);
  }
}
