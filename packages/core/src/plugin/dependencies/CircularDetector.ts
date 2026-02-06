// CircularDetector.ts - Circular dependency detection

/**
 * Circular dependency detection result
 */
export interface CircularDependencyResult {
  /** Whether circular dependencies were detected */
  hasCircular: boolean;
  /** The circular dependency chains found */
  chains: string[][];
}

/**
 * Circular dependency detector for detecting circular dependencies in plugin graphs
 */
export class CircularDetector {
  /**
   * Detects circular dependencies in a plugin dependency graph
   * @param dependencies - A map of plugin IDs to their dependencies
   * @returns The circular dependency detection result
   */
  static detect(dependencies: Map<string, string[]>): CircularDependencyResult {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const chains: string[][] = [];
    
    // DFS function to detect cycles
    const dfs = (node: string, path: string[]): void => {
      // If node is already in recursion stack, we found a cycle
      if (recursionStack.has(node)) {
        // Extract the cycle from the path
        const cycleStartIndex = path.indexOf(node);
        if (cycleStartIndex !== -1) {
          const cycle = [...path.slice(cycleStartIndex), node];
          chains.push(cycle);
        }
        return;
      }
      
      // If node was already visited, skip it
      if (visited.has(node)) {
        return;
      }
      
      // Mark node as visited and add to recursion stack
      visited.add(node);
      recursionStack.add(node);
      
      // Visit all dependencies
      const deps = dependencies.get(node) || [];
      for (const dep of deps) {
        dfs(dep, [...path, node]);
      }
      
      // Remove node from recursion stack
      recursionStack.delete(node);
    };
    
    // Run DFS for all nodes
    for (const pluginId of dependencies.keys()) {
      if (!visited.has(pluginId)) {
        dfs(pluginId, []);
      }
    }
    
    return {
      hasCircular: chains.length > 0,
      chains
    };
  }

  /**
   * Formats circular dependency chains for display
   * @param chains - The circular dependency chains
   * @returns A formatted string describing the circular dependencies
   */
  static formatChains(chains: string[][]): string {
    if (chains.length === 0) {
      return 'No circular dependencies found';
    }
    
    return chains.map(chain => 
      `Circular dependency: ${chain.join(' -> ')}`
    ).join('
');
  }
}