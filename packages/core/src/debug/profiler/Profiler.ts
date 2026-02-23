/**
 * Performance profiler for GridKit.
 * Provides profiling, flame graph generation, and performance analysis.
 * 
 * @module @gridkit/core/debug/profiler
 */

import type { ProfilingResult, FlameGraph, FlameGraphNode, ProfileSession, OperationProfile, ProfilingAnalysis } from '@/debug/types';

/**
 * Performance profiler for debugging
 */
export class Profiler {
  private activeProfiles: Map<string, ProfileSession> = new Map();
  private completedProfiles: ProfilingResult[] = [];
  private operationStack: OperationProfile[] = [];

  /**
   * Profile a function
   */
  profile<T>(label: string, fn: () => T): ProfilingResult<T> {
    this.start(label);
    let result: T | undefined;

    try {
      result = fn();
    } finally {
      const profile = this.stop(label);
      return {
        ...profile,
        result,
      };
    }
  }

  /**
   * Start profiling
   */
  start(label: string): void {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    const session: ProfileSession = {
      label,
      startTime,
      startMemory,
      operations: [],
    };

    this.activeProfiles.set(label, session);
  }

  /**
   * Stop profiling
   */
  stop(label: string): ProfilingResult {
    const session = this.activeProfiles.get(label);
    if (!session) {
      throw new Error(`No active profile for label: ${label}`);
    }

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    const result: ProfilingResult = {
      label: session.label,
      duration: endTime - session.startTime,
      memory: {
        before: session.startMemory,
        after: endMemory,
        delta: endMemory - session.startMemory,
      },
      operations: session.operations,
    };

    this.activeProfiles.delete(label);
    this.completedProfiles.push(result);

    return result;
  }

  /**
   * Generate flame graph from profiling results
   */
  generateFlameGraph(results: ProfilingResult[]): FlameGraph {
    const root: FlameGraphNode = {
      name: 'Root',
      value: 0,
      children: [],
    };

    let totalDuration = 0;
    let maxDepth = 0;

    for (const result of results) {
      totalDuration += result.duration;
      const depth = this.buildFlameGraphNode(result, root, 0);
      maxDepth = Math.max(maxDepth, depth);
    }

    return {
      root,
      totalDuration,
      maxDepth,
    };
  }

  /**
   * Analyze profiling results
   */
  analyze(results: ProfilingResult[]): ProfilingAnalysis {
    const totalOperations = results.length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / totalOperations;

    // Collect all operations from all results
    const allOperations: OperationProfile[] = [];
    for (const result of results) {
      allOperations.push(...result.operations);
    }

    // Sort by duration (slowest first)
    const slowest = allOperations
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Sort by frequency (most frequent first)
    const mostFrequent = allOperations
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    return {
      totalOperations,
      totalDuration,
      averageDuration,
      slowest,
      mostFrequent,
    };
  }

  /**
   * Get bottlenecks above threshold
   */
  getBottlenecks(threshold: number): ProfilerBottleneck[] {
    const bottlenecks: ProfilerBottleneck[] = [];

    for (const result of this.completedProfiles) {
      if (result.duration >= threshold) {
        const bottleneck: ProfilerBottleneck = {
          operation: result.label,
          duration: result.duration,
          percentage: (result.duration / this.completedProfiles.reduce((sum, r) => sum + r.duration, 0)) * 100,
          recommendations: this.generateRecommendations(result),
        };
        bottlenecks.push(bottleneck);
      }
    }

    return bottlenecks.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Get all completed profiles
   */
  getCompletedProfiles(): ProfilingResult[] {
    return this.completedProfiles;
  }

  /**
   * Get active profiles
   */
  getActiveProfiles(): Map<string, ProfileSession> {
    return this.activeProfiles;
  }

  /**
   * Clear all profiles
   */
  clear(): void {
    this.activeProfiles.clear();
    this.completedProfiles = [];
    this.operationStack = [];
  }

  /**
   * Build flame graph node from profiling result
   */
  private buildFlameGraphNode(
    result: ProfilingResult,
    parent: FlameGraphNode,
    depth: number
  ): number {
    const node: FlameGraphNode = {
      name: result.label,
      value: result.duration,
      children: [],
    };

    for (const childOp of result.operations) {
      const childNode: FlameGraphNode = {
        name: childOp.name,
        value: childOp.duration,
        children: [],
      };
      node.children.push(childNode);
    }

    parent.children.push(node);
    return depth + 1;
  }

  /**
   * Generate recommendations for bottleneck
   */
  private generateRecommendations(result: ProfilingResult): string[] {
    const recommendations: string[] = [];

    if (result.duration > 100) {
      recommendations.push('Consider caching results');
    }

    if (result.memory.delta > 100000) {
      recommendations.push('Memory allocation detected - consider object pooling');
    }

    if (result.operations.length > 10) {
      recommendations.push('Many sub-operations - consider consolidation');
    }

    if (result.operations.some(op => op.duration > result.duration / 2)) {
      recommendations.push('Single operation dominates - profile sub-operations');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance acceptable');
    }

    return recommendations;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }
}

/**
 * Performance bottleneck interface
 */
export interface ProfilerBottleneck {
  operation: string;
  duration: number;
  percentage: number;
  recommendations: string[];
}
