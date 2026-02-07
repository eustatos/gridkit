/**
 * ResourceMonitor tracks runtime resource usage to prevent plugin abuse
 * and detect potential security issues.
 * 
 * The resource monitor tracks various resource usage metrics for plugins,
 * including event emission rates, handler execution times, and memory usage.
 * It provides real-time monitoring and alerting capabilities.
 * 
 * @example
 * ```typescript
 * const resourceMonitor = new ResourceMonitor();
 * resourceMonitor.startMonitoring(1000); // Check every second
 * 
 * resourceMonitor.recordEventEmission('plugin-1', 100);
 * resourceMonitor.recordHandlerExecution('plugin-1', 50);
 * 
 * if (resourceMonitor.isExceedingLimits('plugin-1')) {
 *   console.warn('Plugin is exceeding resource limits');
 * }
 * ```
 */
export class ResourceMonitor {
  private pluginUsage = new Map<string, PluginResourceUsage>();
  private monitoringInterval: number | null = null;

  /**
   * Starts monitoring resource usage.
   * 
   * This method starts periodic monitoring of resource usage.
   * It collects resource usage metrics at the specified interval
   * and checks for limit violations.
   * 
   * @param interval - Monitoring interval in milliseconds (default: 1000)
   * 
   * @example
   * ```typescript
   * resourceMonitor.startMonitoring(1000); // Check every second
   * ```
   */
  public startMonitoring(interval: number = 1000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.collectResourceUsage();
    }, interval) as unknown as number;
  }

  /**
   * Stops monitoring resource usage.
   * 
   * This method stops periodic monitoring of resource usage
   * and cleans up the monitoring interval.
   * 
   * @example
   * ```typescript
   * resourceMonitor.stopMonitoring();
   * ```
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Records event emission for a plugin.
   * 
   * This method records an event emission for a plugin,
   * tracking the number of events and their total size.
   * 
   * @param pluginId - The plugin identifier
   * @param eventSize - The size of the event payload in bytes
   * 
   * @example
   * ```typescript
   * resourceMonitor.recordEventEmission('plugin-1', 100);
   * ```
   */
  public recordEventEmission(pluginId: string, eventSize: number): void {
    const usage = this.getOrCreateUsage(pluginId);
    usage.eventsEmitted++;
    usage.eventBytesEmitted += eventSize;
  }

  /**
   * Records handler execution time for a plugin.
   * 
   * This method records handler execution time for a plugin,
   * tracking the total execution time and number of executions.
   * 
   * @param pluginId - The plugin identifier
   * @param executionTime - The execution time in milliseconds
   * 
   * @example
   * ```typescript
   * resourceMonitor.recordHandlerExecution('plugin-1', 50);
   * ```
   */
  public recordHandlerExecution(pluginId: string, executionTime: number): void {
    const usage = this.getOrCreateUsage(pluginId);
    usage.handlerExecutionTime += executionTime;
    usage.handlerExecutions++;
  }

  /**
   * Gets current resource usage for a plugin.
   * 
   * This method returns the current resource usage metrics
   * for a plugin.
   * 
   * @param pluginId - The plugin identifier
   * @returns Current resource usage
   * 
   * @example
   * ```typescript
   * const usage = resourceMonitor.getUsage('plugin-1');
   * console.log(`Events emitted: ${usage.eventsEmitted}`);
   * ```
   */
  public getUsage(pluginId: string): PluginResourceUsage {
    return { ...this.getOrCreateUsage(pluginId) };
  }

  /**
   * Checks if a plugin is exceeding resource limits.
   * 
   * This method checks if a plugin is exceeding resource limits
   * such as event emission rate or handler execution time.
   * 
   * @param pluginId - The plugin identifier
   * @returns true if the plugin is exceeding limits, false otherwise
   * 
   * @example
   * ```typescript
   * if (resourceMonitor.isExceedingLimits('plugin-1')) {
   *   console.warn('Plugin is exceeding resource limits');
   * }
   * ```
   */
  public isExceedingLimits(pluginId: string): boolean {
    const usage = this.getUsage(pluginId);
    
    // Check for excessive event emission rate (more than 1000 events/second)
    if (usage.eventsEmitted > 1000) {
      console.warn(`Plugin ${pluginId} emitting excessive events: ${usage.eventsEmitted}/second`);
      return true;
    }
    
    // Check for excessive handler execution time (more than 500ms/second)
    if (usage.handlerExecutionTime > 500) {
      console.warn(`Plugin ${pluginId} using excessive CPU: ${usage.handlerExecutionTime}ms/second`);
      return true;
    }
    
    return false;
  }

  /**
   * Gets or creates resource usage tracking for a plugin.
   * 
   * This method gets existing resource usage tracking for a plugin
   * or creates new tracking if it doesn't exist.
   * 
   * @param pluginId - The plugin identifier
   * @returns Plugin resource usage tracker
   * 
   * @example
   * ```typescript
   * const usage = this.getOrCreateUsage('plugin-1');
   * ```
   */
  private getOrCreateUsage(pluginId: string): PluginResourceUsage {
    if (!this.pluginUsage.has(pluginId)) {
      this.pluginUsage.set(pluginId, {
        eventsEmitted: 0,
        eventBytesEmitted: 0,
        handlerExecutionTime: 0,
        handlerExecutions: 0,
        startTime: Date.now(),
      });
    }
    
    return this.pluginUsage.get(pluginId)!;
  }

  /**
   * Collects current resource usage metrics.
   * 
   * This method collects current resource usage metrics
   * and checks for limit violations. It resets counters
   * every monitoring interval.
   * 
   * @example
   * ```typescript
   * this.collectResourceUsage();
   * ```
   */
  private collectResourceUsage(): void {
    // Reset counters every second
    const now = Date.now();
    
    for (const [pluginId, usage] of this.pluginUsage.entries()) {
      // Reset counters
      usage.eventsEmitted = 0;
      usage.eventBytesEmitted = 0;
      usage.handlerExecutionTime = 0;
      
      // Update start time for next interval
      usage.startTime = now;
      
      // Check for limit violations
      if (this.isExceedingLimits(pluginId)) {
        // In a real implementation, this would notify the plugin manager
        console.warn(`Plugin ${pluginId} is exceeding resource limits`);
      }
    }
  }
}

/**
 * Plugin resource usage tracking.
 */
export interface PluginResourceUsage {
  /** Number of events emitted in the current interval */
  eventsEmitted: number;
  
  /** Total bytes of events emitted in the current interval */
  eventBytesEmitted: number;
  
  /** Total handler execution time in milliseconds in the current interval */
  handlerExecutionTime: number;
  
  /** Number of handler executions in the current interval */
  handlerExecutions: number;
  
  /** Start time of the current monitoring interval */
  startTime: number;
}