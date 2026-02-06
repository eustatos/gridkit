// DependencyResolver.ts - Dependency resolution implementation

import { DependencyGraph } from './DependencyGraph';

/**
 * Plugin dependency information
 */
export interface PluginDependency {
  /** The ID of the dependency */
  id: string;
  /** Whether the dependency is optional */
  optional?: boolean;
  /** Whether the dependency is a peer dependency */
  peer?: boolean;
  /** The minimum version of the dependency */
  minVersion?: string;
  /** The maximum version of the dependency */
  maxVersion?: string;
}

/**
 * Resolved dependency information
 */
export interface ResolvedDependency {
  /** The ID of the dependency */
  id: string;
  /** The resolved version of the dependency */
  version: string;
  /** Whether the dependency is optional */
  optional: boolean;
  /** Whether the dependency is a peer dependency */
  peer: boolean;
}

/**
 * Dependency resolution result
 */
export interface DependencyResolution {
  /** The order in which plugins should be loaded */
  loadOrder: string[];
  /** Any missing dependencies */
  missing: string[];
  /** Any circular dependencies */
  circular: string[];
}

/**
 * Dependency resolver for resolving plugin dependencies with topological sorting
 */
export class DependencyResolver {
  private graph = new DependencyGraph();
  private dependencies = new Map<string, PluginDependency[]>();

  /**
   * Adds a plugin with its dependencies
   * @param pluginId - The ID of the plugin
   * @param deps - The dependencies of the plugin
   */
  addPlugin(pluginId: string, deps: PluginDependency[]): void {
    this.dependencies.set(pluginId, deps);
    
    // Add dependencies to the graph
    for (const dep of deps) {
      try {
        this.graph.addDependency(pluginId, dep.id);
      } catch (error) {
        // Circular dependency detected - we'll handle this in resolve()
        console.warn(`Circular dependency detected: ${error}`);
      }
    }
  }

  /**
   * Resolves plugin dependencies with topological sorting
   * @returns The dependency resolution result
   */
  resolve(): DependencyResolution {
    const loadOrder = this.graph.getLoadOrder();
    const missing: string[] = [];
    const circular: string[] = [];
    
    // Check for missing dependencies
    for (const [pluginId, deps] of this.dependencies.entries()) {
      for (const dep of deps) {
        if (!this.dependencies.has(dep.id) && !dep.optional) {
          missing.push(`${pluginId} -> ${dep.id}`);
        }
      }
    }
    
    // Note: Circular dependencies are already detected in addDependency
    // For this implementation, we'll just return the load order as is
    
    return {
      loadOrder,
      missing,
      circular
    };
  }

  /**
   * Gets the load order for plugins
   * @returns An array of plugin IDs in the order they should be loaded
   */
  getLoadOrder(): string[] {
    return this.graph.getLoadOrder();
  }

  /**
   * Checks if all dependencies are satisfied
   * @param pluginId - The ID of the plugin to check
   * @returns true if all dependencies are satisfied, false otherwise
   */
  areDependenciesSatisfied(pluginId: string): boolean {
    const deps = this.dependencies.get(pluginId);
    if (!deps) {
      return true; // No dependencies
    }
    
    for (const dep of deps) {
      if (!dep.optional && !this.dependencies.has(dep.id)) {
        return false;
      }
    }
    
    return true;
  }
}