import type { Plugin, PluginMetadata } from './Plugin';

/**
 * Type-safe plugin registry for compile-time plugin discovery
 * 
 * This interface should be augmented by plugins to register themselves
 * at compile time for type safety.
 * 
 * @example
 * declare module './PluginRegistry' {
 *   interface PluginRegistry {
 *     'my-plugin': MyPluginType;
 *   }
 * }
 */
export interface PluginRegistry {
  // This interface is meant to be augmented
  // Plugins should declare their types here
}

/**
 * Helper type to get plugin type by ID
 */
export type GetPlugin<T extends keyof PluginRegistry> = PluginRegistry[T];

/**
 * Helper type to get all registered plugin IDs
 */
export type RegisteredPluginIds = keyof PluginRegistry;

/**
 * Plugin capability descriptor
 */
export interface PluginCapability {
  /**
   * Capability name
   */
  readonly name: string;
  
  /**
   * Capability version
   */
  readonly version: string;
  
  /**
   * Required capabilities
   */
  readonly requires?: string[];
  
  /**
   * Optional capabilities
   */
  readonly optional?: string[];
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  /**
   * Configuration properties
   */
  readonly properties: Record<string, PluginConfigProperty>;
  
  /**
   * Required properties
   */
  readonly required?: string[];
}

/**
 * Plugin configuration property
 */
export interface PluginConfigProperty {
  /**
   * Property type
   */
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  
  /**
   * Property description
   */
  readonly description?: string;
  
  /**
   * Default value
   */
  readonly default?: unknown;
  
  /**
   * Whether property is required
   */
  readonly required?: boolean;
  
  /**
   * Property enum values (for string properties)
   */
  readonly enum?: unknown[];
}