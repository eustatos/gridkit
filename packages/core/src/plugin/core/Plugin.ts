import type { EventBus } from '../events';

/**
 * Plugin context providing access to core services
 */
export interface PluginContext {
  /**
   * Event bus for plugin-scoped events
   */
  readonly eventBus: EventBus;
  
  /**
   * Plugin configuration
   */
  readonly config: Record<string, unknown>;
  
  /**
   * Plugin metadata
   */
  readonly metadata: PluginMetadata;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /**
   * Unique plugin identifier
   */
  readonly id: string;
  
  /**
   * Human-readable plugin name
   */
  readonly name: string;
  
  /**
   * Plugin version in semver format
   */
  readonly version: string;
  
  /**
   * Plugin description
   */
  readonly description?: string;
  
  /**
   * Plugin dependencies
   */
  readonly dependencies?: string[];
  
  /**
   * Plugin capabilities
   */
  readonly capabilities?: string[];
}

/**
 * Base interface for all GridKit plugins
 */
export interface Plugin<TConfig = Record<string, unknown>> {
  /**
   * Plugin metadata
   */
  readonly metadata: PluginMetadata;

  /**
   * Initialize the plugin
   * 
   * @param config - Plugin configuration
   * @param context - Plugin context with core services
   */
  initialize(config: TConfig, context: PluginContext): Promise<void> | void;

  /**
   * Destroy the plugin and cleanup resources
   */
  destroy(): Promise<void> | void;

  /**
   * Update plugin configuration
   * 
   * @param config - Partial configuration update
   */
  update?(config: Partial<TConfig>): void;
}