import type { Plugin, PluginContext } from '../core/Plugin';

/**
 * Plugin destruction options
 */
export interface DestructionOptions {
  /**
   * Whether to destroy plugins in parallel
   */
  parallel?: boolean;
  
  /**
   * Timeout for plugin destruction
   */
  timeout?: number;
  
  /**
   * Whether to fail fast on destruction errors
   */
  failFast?: boolean;
}

/**
 * Plugin destruction result
 */
export interface DestructionResult {
  /**
   * Plugin ID
   */
  pluginId: string;
  
  /**
   * Whether destruction was successful
   */
  success: boolean;
  
  /**
   * Error if destruction failed
   */
  error?: Error;
  
  /**
   * Destruction duration in milliseconds
   */
  duration: number;
}

/**
 * Destroy a plugin with error boundaries
 * 
 * @param plugin - Plugin to destroy
 * @param context - Plugin context
 * @returns Promise that resolves when destruction is complete
 */
export async function destroyPlugin(
  plugin: Plugin<Record<string, unknown>>,
  context: PluginContext
): Promise<void> {
  try {
    const result = plugin.destroy();
    if (result instanceof Promise) {
      await result;
    }
  } catch (error) {
    // Wrap error with plugin context
    throw new PluginDestructionError(
      plugin.metadata.id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Destroy multiple plugins with error handling
 * 
 * @param plugins - Plugins to destroy
 * @param contexts - Plugin contexts
 * @param options - Destruction options
 * @returns Array of destruction results
 */
export async function destroyPlugins(
  plugins: Array<Plugin<Record<string, unknown>>>,
  contexts: Map<string, PluginContext>,
  options: DestructionOptions = {}
): Promise<DestructionResult[]> {
  const {
    parallel = true,
    timeout = 10000,
    failFast = true
  } = options;
  
  const results: DestructionResult[] = [];
  
  if (parallel) {
    // Create destruction promises
    const destroyPromises = plugins.map(async (plugin) => {
      const startTime = performance.now();
      const pluginId = plugin.metadata.id;
      const context = contexts.get(pluginId);
      
      if (!context) {
        // Plugin not initialized, nothing to destroy
        return {
          pluginId,
          success: true,
          duration: 0
        } satisfies DestructionResult;
      }
      
      try {
        // Apply timeout if specified
        let destroyPromise = destroyPlugin(plugin, context);
        if (timeout > 0) {
          destroyPromise = Promise.race([
            destroyPromise,
            new Promise<void>((_, reject) => {
              setTimeout(() => reject(new Error(`Plugin ${pluginId} destruction timeout`)), timeout);
            })
          ]);
        }
        
        await destroyPromise;
        
        return {
          pluginId,
          success: true,
          duration: performance.now() - startTime
        } satisfies DestructionResult;
      } catch (error) {
        const result: DestructionResult = {
          pluginId,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          duration: performance.now() - startTime
        };
        
        if (failFast) {
          throw new PluginDestructionError(pluginId, result.error);
        }
        
        return result;
      }
    });
    
    // Execute destruction with proper failFast handling
    if (failFast) {
      // In failFast mode, we need to catch the first error and reject immediately
      try {
        const destroyResults = await Promise.all(destroyPromises);
        results.push(...destroyResults);
      } catch (error) {
        // If we get a PluginDestructionError, we need to add the successful results
        // that were completed before the error occurred
        if (error instanceof PluginDestructionError) {
          // Collect successful results that were completed before the error
          // This is a limitation of Promise.all - we can't easily get partial results
          // In a real implementation, we might want to use a more sophisticated approach
          throw error;
        } else {
          throw error;
        }
      }
    } else {
      // In non-failFast mode, collect all results
      const destroyResults = await Promise.allSettled(destroyPromises);
      for (let i = 0; i < destroyResults.length; i++) {
        const result = destroyResults[i];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // This shouldn't happen due to error handling in promises
          const pluginId = plugins[i].metadata.id;
          results.push({
            pluginId,
            success: false,
            error: result.reason,
            duration: 0
          });
        }
      }
    }
  } else {
    // Sequential destruction (in reverse order)
    for (let i = plugins.length - 1; i >= 0; i--) {
      const plugin = plugins[i];
      const startTime = performance.now();
      const pluginId = plugin.metadata.id;
      const context = contexts.get(pluginId);
      
      // Plugin not initialized, nothing to destroy
      if (!context) {
        results.unshift({
          pluginId,
          success: true,
          duration: 0
        });
        continue;
      }
      
      try {
        // Apply timeout if specified
        let destroyPromise = destroyPlugin(plugin, context);
        if (timeout > 0) {
          destroyPromise = Promise.race([
            destroyPromise,
            new Promise<void>((_, reject) => {
              setTimeout(() => reject(new Error(`Plugin ${pluginId} destruction timeout`)), timeout);
            })
          ]);
        }
        
        await destroyPromise;
        
        results.unshift({
          pluginId,
          success: true,
          duration: performance.now() - startTime
        });
      } catch (error) {
        const result: DestructionResult = {
          pluginId,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          duration: performance.now() - startTime
        };
        
        results.unshift(result);
        
        // In sequential mode with failFast, stop on first error
        if (failFast) {
          throw error instanceof PluginDestructionError 
            ? error 
            : new PluginDestructionError(pluginId, error as Error);
        }
      }
    }
  }
  
  return results;
}

/**
 * Error thrown when plugin destruction fails
 */
export class PluginDestructionError extends Error {
  /**
   * Plugin ID that failed to destroy
   */
  public readonly pluginId: string;
  
  /**
   * Original error that caused destruction to fail
   */
  public readonly originalError: Error;
  
  constructor(pluginId: string, originalError: Error) {
    super(`Failed to destroy plugin ${pluginId}: ${originalError.message}`);
    this.name = 'PluginDestructionError';
    this.pluginId = pluginId;
    this.originalError = originalError;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PluginDestructionError);
    }
  }
}