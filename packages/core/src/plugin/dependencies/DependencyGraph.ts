// DependencyGraph.ts - Topological sorting & resolution

/**
 * Dependency graph for managing plugin dependencies with topological sorting
 * and circular dependency detection
 */
export class DependencyGraph {
  private graph = new Map<string, Set<string>>();
  private reverseGraph = new Map<string, Set<string>>();

  /**
   * Adds a dependency relationship between two plugins
   * @param dependent - The plugin that depends on another plugin
   * @param dependency - The plugin that is being depended on
   * @throws Error if adding this dependency would create a circular dependency
   */
  addDependency(dependent: string, dependency: string): void {
    // Add to forward graph
    if (!this.graph.has(dependent)) {
      this.graph.set(dependent, new Set());
    }
    this.graph.get(dependent)!.add(dependency);

    // Add to reverse graph for circular detection
    if (!this.reverseGraph.has(dependency)) {
      this.reverseGraph.set(dependency, new Set());
    }
    this.reverseGraph.get(dependency)!.add(dependent);

    this.detectCircularDependency(dependent);
  }

  /**
   * Gets the order in which plugins should be loaded based on their dependencies
   * @returns An array of plugin IDs in the order they should be loaded
   */
  getLoadOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (node: string, path: string[] = []) => {
      if (visited.has(node)) return;
      visited.add(node);

      const dependencies = this.graph.get(node) || new Set();
      for (const dep of dependencies) {
        visit(dep, [...path, node]);
      }

      order.push(node);
    };

    for (const node of this.graph.keys()) {
      visit(node);
    }

    return order;
  }

  /**
   * Detects circular dependencies starting from a given node
   * @param startNode - The node to start checking for circular dependencies
   * @throws Error if a circular dependency is detected
   */
  private detectCircularDependency(startNode: string): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      const dependencies = this.graph.get(node) || new Set();
      for (const dependency of dependencies) {
        if (hasCycle(dependency)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    if (hasCycle(startNode)) {
      throw new Error(`Circular dependency detected involving ${startNode}`);
    }
  }
}