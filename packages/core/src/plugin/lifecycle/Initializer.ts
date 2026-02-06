import type { Plugin, PluginContext } from '../core/Plugin';

/**
 * Plugin initialization options
 */
export interface InitializationOptions {
  /**
   * Whether to initialize plugins in parallel
   */
  parallel?: boolean;
  
  /**
   * Timeout for plugin initialization
   */
  timeout?: number;
  
  /**
   * Whether to fail fast on initialization errors
   */
  failFast?: boolean;
}

/**
 * Plugin initialization result
 */
export interface InitializationResult {
  /**
   * Plugin ID
   */
  pluginId: string;
  
  /**
   * Whether initialization was successful
   */
  success: boolean;
  
  /**
   * Error if initialization failed
   */
  error?: Error;
  
  /**
   * Initialization duration in milliseconds
   */
  duration: number;
}

/**
 * Initialize a plugin with error boundaries
 * 
 * @param plugin - Plugin to initialize
 * @param context - Plugin context
 * @returns Promise that resolves when initialization is complete
 */
export async function initializePlugin(
  plugin: Plugin<Record<string, unknown>>,
  context: PluginContext
): Promise<void> {
  try {
    const result = plugin.initialize(context.config, context);
    if (result instanceof Promise) {
      await result;
    }
  } catch (error) {
    // Wrap error with plugin context
    throw new PluginInitializationError(
      plugin.metadata.id,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Initialize multiple plugins with error handling
 * 
 * @param plugins - Plugins to initialize
 * @param contexts - Plugin contexts
 * @param options - Initialization options
 * @returns Array of initialization results
 */
export async function initializePlugins(
  plugins: Array<Plugin<Record<string, unknown>>>,
  contexts: Map<string, PluginContext>,
  options: InitializationOptions = {}
): Promise<InitializationResult[]> {
  const {
    parallel = true,
    timeout = 10000,
    failFast = true
  } = options;
  
  const results: InitializationResult[] = [];
  
  // Create initialization promises
  const initPromises = plugins.map(async (plugin) => {
    const startTime = performance.now();
    const pluginId = plugin.metadata.id;
    const context = contexts.get(pluginId);
    
    if (!context) {
      throw new Error(`Context not found for plugin ${pluginId}`);
    }
    
    try {
      // Apply timeout if specified
      let initPromise = initializePlugin(plugin, context);
      if (timeout > 0) {
        initPromise = Promise.race([
          initPromise,
          new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error(`Plugin ${pluginId} initialization timeout`)), timeout);
          }) as Promise<void>
        ]);
      }
      
      await initPromise;
      
      return {
        pluginId,
        success: true,
        duration: performance.now() - startTime
      } satisfies InitializationResult;
    } catch (error) {
      const result: InitializationResult = {
        pluginId,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: performance.now() - startTime
      };
      
      if (failFast) {
        throw new PluginInitializationError(pluginId, result.error);
      }
      
      return result;
    }
  });
  
  // Execute initialization
  if (parallel) {
    const initResults = await Promise.allSettled(initPromises);
    for (let i = 0; i < initResults.length; i++) {
      const result = initResults[i];
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
  } else {
    // Sequential initialization
    for (const initPromise of initPromises) {
      try {
        const result = await initPromise;
        results.push(result);
      } catch (error) {
        // In sequential mode, we still collect results for all plugins
        // but re-throw the error to stop initialization
        if (error instanceof PluginInitializationError) {
          // Find the plugin that failed and add a failed result
          const failedPlugin = plugins.find(p => p.metadata.id === error.pluginId);
          if (failedPlugin) {
            results.push({
              pluginId: error.pluginId,
              success: false,
              error: error.originalError,
              duration: 0
            });
          }
        }
        throw error;
      }
    }
  }
  
  return results;
}

/**
 * Error thrown when plugin initialization fails
 */
export class PluginInitializationError extends Error {
  /**
   * Plugin ID that failed to initialize
   */
  public readonly pluginId: string;
  
  /**
   * Original error that caused initialization to fail
   */
  public readonly originalError: Error;
  
  constructor(pluginId: string, originalError: Error) {
    super(`Failed to initialize plugin ${pluginId}: ${originalError.message}`);
    this.name = 'PluginInitializationError';
    this.pluginId = pluginId;
    this.originalError = originalError;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PluginInitializationError);
    }
  }
}