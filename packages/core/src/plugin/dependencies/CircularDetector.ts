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
    const visiting = new Set<string>();
    const chains: string[][] = [];
    const pathMap = new Map<string, string[]>();

    const dfs = (node: string, currentPath: string[]): void => {
      // Already found cycles for this node
      if (visited.has(node)) {
        return;
      }

      // Found a cycle
      if (visiting.has(node)) {
        const cycleStartIndex = currentPath.indexOf(node);
        if (cycleStartIndex !== -1) {
          const cycle = [...currentPath.slice(cycleStartIndex), node];
          // Avoid duplicate cycles by checking if this cycle is already recorded
          const cycleKey = cycle.join('→');
          if (!chains.some((existing) => existing.join('→') === cycleKey)) {
            chains.push(cycle);
          }
        }
        return;
      }

      visiting.add(node);
      pathMap.set(node, currentPath);

      const deps = dependencies.get(node) || [];
      for (const dep of deps) {
        dfs(dep, [...currentPath, node]);
      }

      visiting.delete(node);
      visited.add(node);
    };

    for (const pluginId of dependencies.keys()) {
      if (!visited.has(pluginId)) {
        dfs(pluginId, []);
      }
    }

    return {
      hasCircular: chains.length > 0,
      chains,
    };
  }

  /**
   * Alternative implementation using Kahn's algorithm for topological sort
   * More efficient for large graphs when only boolean result is needed
   */
  static hasCircularDependency(dependencies: Map<string, string[]>): boolean {
    const indegree = new Map<string, number>();
    const queue: string[] = [];
    let visitedCount = 0;

    // Initialize indegree
    for (const [node, deps] of dependencies) {
      indegree.set(node, indegree.get(node) || 0);
      for (const dep of deps) {
        indegree.set(dep, (indegree.get(dep) || 0) + 1);
      }
    }

    // Find nodes with zero indegree
    for (const [node, degree] of indegree) {
      if (degree === 0) {
        queue.push(node);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const node = queue.shift();
      visitedCount++;

      const deps = dependencies.get(node) || [];
      for (const dep of deps) {
        const newDegree = (indegree.get(dep) || 1) - 1;
        indegree.set(dep, newDegree);
        if (newDegree === 0) {
          queue.push(dep);
        }
      }
    }

    return visitedCount !== indegree.size;
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

    const formattedChains = chains.map(
      (chain) => `Circular dependency detected: ${chain.join(' → ')}`
    );

    return [
      `Found ${chains.length} circular dependency chain${chains.length > 1 ? 's' : ''}:`,
      ...formattedChains,
    ].join('\n');
  }

  /**
   * Gets unique circular chains (removes duplicate cycles that are rotations of each other)
   */
  static getUniqueChains(chains: string[][]): string[][] {
    const normalizedChains = new Map<string, string[]>();

    for (const chain of chains) {
      // Remove the duplicate end node to get the actual cycle
      const cycle = chain.slice(0, -1);

      // Find the minimum rotation to normalize the cycle
      let minRotation = [...cycle];
      for (let i = 1; i < cycle.length; i++) {
        const rotated = [...cycle.slice(i), ...cycle.slice(0, i)];
        if (rotated.join('→') < minRotation.join('→')) {
          minRotation = rotated;
        }
      }

      const key = minRotation.join('→');
      if (!normalizedChains.has(key)) {
        normalizedChains.set(key, chain);
      }
    }

    return Array.from(normalizedChains.values());
  }
}
