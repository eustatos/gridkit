// ConfigWatcher.ts - Configuration change detection

/**
 * Configuration watcher for detecting changes with debouncing
 */
export class ConfigWatcher {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private watchers = new Map<string, Set<(config: unknown) => void>>();

  /**
   * Watches for configuration changes for a plugin
   * @param pluginId - The ID of the plugin
   * @param callback - The callback to call when the configuration changes
   * @param debounceMs - The debounce time in milliseconds (default: 100)
   * @returns A function to unsubscribe from configuration changes
   */
  watch<T>(
    pluginId: string,
    callback: (config: T) => void,
    debounceMs: number = 100
  ): () => void {
    if (!this.watchers.has(pluginId)) {
      this.watchers.set(pluginId, new Set());
    }
    
    const watchers = this.watchers.get(pluginId)!;
    const typedCallback = callback as (config: unknown) => void;
    
    // Wrap the callback with debouncing
    const debouncedCallback = (config: unknown) => {
      // Clear any existing timeout for this plugin
      if (this.timeouts.has(pluginId)) {
        clearTimeout(this.timeouts.get(pluginId));
      }
      
      // Set a new timeout
      const timeout = setTimeout(() => {
        try {
          typedCallback(config);
        } catch (error) {
          console.error(`Error in config watcher for plugin ${pluginId}:`, error);
        }
        this.timeouts.delete(pluginId);
      }, debounceMs);
      
      this.timeouts.set(pluginId, timeout);
    };
    
    watchers.add(debouncedCallback);
    
    return () => {
      watchers.delete(debouncedCallback);
      if (this.timeouts.has(pluginId)) {
        clearTimeout(this.timeouts.get(pluginId));
        this.timeouts.delete(pluginId);
      }
    };
  }

  /**
   * Notifies watchers of a configuration change
   * @param pluginId - The ID of the plugin
   * @param config - The new configuration
   */
  notify(pluginId: string, config: unknown): void {
    const watchers = this.watchers.get(pluginId);
    if (watchers) {
      for (const watcher of watchers) {
        try {
          watcher(config);
        } catch (error) {
          console.error(`Error notifying watcher for plugin ${pluginId}:`, error);
        }
      }
    }
  }

  /**
   * Clears all watchers and timeouts
   */
  clear(): void {
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    
    // Clear all data
    this.timeouts.clear();
    this.watchers.clear();
  }
}