/**
 * Resource usage tracking for a plugin.
 */
export interface ResourceUsage {
  /** Number of events emitted */
  eventsEmitted: number;
  
  /** Total handler execution time in milliseconds */
  handlerExecutionTime: number;
  
  /** Current memory usage estimate in bytes */
  memoryUsage: number;
}

/**
 * Resource quotas for a plugin.
 */
export interface PluginQuota {
  /** Maximum events per second */
  maxEventsPerSecond?: number;
  
  /** Maximum handler execution time per second in milliseconds */
  maxHandlerTimePerSecond?: number;
  
  /** Maximum memory usage in bytes */
  maxMemoryUsage?: number;
}

/**
 * QuotaManager enforces resource limits for plugins to prevent abuse.
 * 
 * The quota manager tracks resource usage for each plugin and enforces
 * limits to prevent any single plugin from consuming excessive resources.
 * It supports event emission rate limiting, handler execution time quotas,
 * and memory usage monitoring.
 * 
 * @example
 * ```typescript
 * const quotaManager = new QuotaManager();
 * quotaManager.setQuota('plugin-1', {
 *   maxEventsPerSecond: 100,
 *   maxHandlerTimePerSecond: 50,
 *   maxMemoryUsage: 1024 * 1024 // 1MB
 * });
 * 
 * if (quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
 *   // Safe to emit event
 * }
 * ```
 */
export class QuotaManager {
  private quotas = new Map<string, PluginQuota>();
  private usage = new Map<string, ResourceUsage>();
  private lastResetTime = new Map<string, number>();

  /**
   * Sets quotas for a plugin.
   * 
   * This method defines the resource quotas for a specific plugin.
   * Quotas can be set for events per second, handler execution time,
   * and memory usage.
   * 
   * @param pluginId - The plugin identifier
   * @param quota - The quotas to set
   * 
   * @example
   * ```typescript
   * quotaManager.setQuota('plugin-1', {
   *   maxEventsPerSecond: 100,
   *   maxHandlerTimePerSecond: 50
   * });
   * ```
   */
  public setQuota(pluginId: string, quota: PluginQuota): void {
    this.quotas.set(pluginId, quota);
  }

  /**
   * Maps quota resource names to usage field names
   */
  private static readonly resourceToUsageMap: Record<string, keyof ResourceUsage> = {
    maxEventsPerSecond: 'eventsEmitted',
    maxHandlerTimePerSecond: 'handlerExecutionTime',
    maxMemoryUsage: 'memoryUsage',
  };

  /**
   * Checks if a plugin is within its quota for a resource.
   * 
   * This method checks if a plugin is within its quota for a specific
   * resource. If the plugin would exceed its quota by using the
   * requested amount of the resource, this method returns false and
   * may trigger suspension of the plugin.
   * 
   * @param pluginId - The plugin identifier
   * @param resource - The resource to check
   * @param amount - The amount of resource being requested
   * @returns true if the plugin is within quota, false otherwise
   * 
   * @example
   * ```typescript
   * if (quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
   *   // Safe to emit one more event
   * }
   * ```
   */
  public checkQuota(pluginId: string, resource: string, amount: number): boolean {
    const quota = this.quotas.get(pluginId);
    const currentUsage = this.usage.get(pluginId) || this.createUsage();

    // Reset usage counters every second
    const now = Date.now();
    const lastReset = this.lastResetTime.get(pluginId) || now;
    if (now - lastReset > 1000) {
      this.resetUsage(pluginId);
      this.lastResetTime.set(pluginId, now);
    }

    if (!quota || quota[resource as keyof PluginQuota] === undefined || quota[resource as keyof PluginQuota] === null) return true; // No quota = unlimited

    const limit = quota[resource as keyof PluginQuota];
    if (limit === undefined) return true; // No limit for this resource

    const usageField = QuotaManager.resourceToUsageMap[resource];
    if (!usageField) return true; // Unknown resource type

    const used = currentUsage[usageField] || 0;

    if (used + amount > limit) {
      this.onQuotaExceeded(pluginId, resource, limit);
      return false;
    }

    // Update usage
    currentUsage[usageField] = used + amount;
    this.usage.set(pluginId, currentUsage);
    return true;
  }

  /**
   * Resets usage counters for a plugin.
   * 
   * This method resets all resource usage counters for a plugin
   * to zero. This is typically called when a quota period expires.
   * 
   * @param pluginId - The plugin identifier
   * 
   * @example
   * ```typescript
   * quotaManager.resetUsage('plugin-1');
   * ```
   */
  public resetUsage(pluginId: string): void {
    this.usage.set(pluginId, this.createUsage());
  }

  /**
   * Gets current usage for a plugin.
   * 
   * This method returns the current resource usage for a plugin.
   * 
   * @param pluginId - The plugin identifier
   * @returns Current resource usage
   * 
   * @example
   * ```typescript
   * const usage = quotaManager.getUsage('plugin-1');
   * console.log(`Events emitted: ${usage.eventsEmitted}`);
   * ```
   */
  public getUsage(pluginId: string): ResourceUsage {
    return this.usage.get(pluginId) || this.createUsage();
  }

  /**
   * Suspends a plugin for exceeding quotas.
   * 
   * This method is called when a plugin exceeds its resource quotas.
   * In a real implementation, this would notify the plugin manager
   * to suspend the plugin.
   * 
   * @param pluginId - The plugin identifier
   * 
   * @example
   * ```typescript
   * quotaManager.suspendPlugin('plugin-1');
   * ```
   */
  public suspendPlugin(pluginId: string): void {
    // In a real implementation, this would notify the plugin manager to suspend the plugin
    console.warn(`Plugin ${pluginId} suspended due to quota violation`);
  }

  /**
   * Creates a new usage tracker with zero values.
   * 
   * This method creates a new ResourceUsage object with all values
   * initialized to zero.
   * 
   * @returns New resource usage object
   * 
   * @example
   * ```typescript
   * const usage = quotaManager.createUsage();
   * ```
   */
  private createUsage(): ResourceUsage {
    return {
      eventsEmitted: 0,
      handlerExecutionTime: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Handles quota exceeded events.
   * 
   * This method is called when a plugin exceeds its quota for
   * a resource. It logs a warning and suspends the plugin.
   * 
   * @param pluginId - The plugin identifier
   * @param resource - The resource that exceeded quota
   * @param limit - The limit that was exceeded
   * 
   * @example
   * ```typescript
   * quotaManager.onQuotaExceeded('plugin-1', 'maxEventsPerSecond', 100);
   * ```
   */
  private onQuotaExceeded(pluginId: string, resource: string, limit: number): void {
    console.warn(`Plugin ${pluginId} exceeded quota for ${resource}: ${limit}`);
    this.suspendPlugin(pluginId);
  }
}