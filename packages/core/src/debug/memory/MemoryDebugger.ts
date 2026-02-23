/**
 * Memory debugger for GridKit.
 * Provides memory snapshots, leak detection, and memory analysis.
 * 
 * @module @gridkit/core/debug/memory
 */

import type { MemorySnapshot, MemoryDiff, MemoryLeak, TrackedObject, MemoryGrowthReport, RetainedObject, HeapSnapshot } from '@/debug/types';

/**
 * Memory debugger for leak detection and analysis
 */
export class MemoryDebugger {
  private snapshots: MemorySnapshot[] = [];
  private trackedObjects: Map<string, TrackedObject> = new Map();
  private intervalId: number | null = null;
  private leakDetector: LeakDetector;

  constructor(
    private config: {
      enabled: boolean;
      interval?: number;
      trackLeaks?: boolean;
      snapshotOnLeak?: boolean;
    } = { enabled: true, interval: 1000, trackLeaks: true }
  ) {
    this.leakDetector = new LeakDetector(this.config.trackLeaks ? 100 : 1000);
  }

  /**
   * Create a memory snapshot
   */
  createSnapshot(): MemorySnapshot {
    const timestamp = Date.now();
    const memory = this.getHeapStats();

    const objects = this.countObjects();

    const snapshot: MemorySnapshot = {
      timestamp,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      objects,
    };

    this.snapshots.push(snapshot);

    // Check for leaks if enabled
    if (this.config.trackLeaks) {
      this.checkForLeaks(snapshot);
    }

    return snapshot;
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(before: MemorySnapshot, after: MemorySnapshot): MemoryDiff {
    return {
      timeDelta: after.timestamp - before.timestamp,
      heapUsedDelta: after.heapUsed - before.heapUsed,
      heapTotalDelta: after.heapTotal - before.heapTotal,
      externalDelta: after.external - before.external,
      objectDeltas: {
        rows: after.objects.rows - before.objects.rows,
        columns: after.objects.columns - before.objects.columns,
        cells: after.objects.cells - before.objects.cells,
        subscriptions: after.objects.subscriptions - before.objects.subscriptions,
      },
    };
  }

  /**
   * Detect memory leaks
   */
  detectLeaks(): MemoryLeak[] {
    return this.leakDetector.detectLeaks();
  }

  /**
   * Track an object for leak detection
   */
  trackObject(obj: any, label: string): void {
    if (!this.config.trackLeaks) {
      return;
    }

    const existing = this.trackedObjects.get(label);
    const lastAccessed = existing ? existing.lastAccessed : Date.now();

    const tracked: TrackedObject = {
      label,
      ref: new WeakRef(obj),
      created: existing ? existing.created : Date.now(),
      lastAccessed,
    };

    this.trackedObjects.set(label, tracked);
  }

  /**
   * Get all tracked objects
   */
  getTrackedObjects(): TrackedObject[] {
    const result: TrackedObject[] = [];
    for (const [label, tracked] of this.trackedObjects.entries()) {
      if (tracked.ref.deref() !== undefined) {
        result.push(tracked);
      } else {
        this.trackedObjects.delete(label);
      }
    }
    return result;
  }

  /**
   * Analyze memory growth
   */
  analyzeMemoryGrowth(): MemoryGrowthReport {
    if (this.snapshots.length < 2) {
      return {
        period: 0,
        totalGrowth: 0,
        growthRate: 0,
        byType: {},
        isConcerning: false,
      };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const period = last.timestamp - first.timestamp;

    const totalGrowth = last.heapUsed - first.heapUsed;
    const growthRate = period > 0 ? totalGrowth / period : 0;

    // Analyze object growth
    const byType: Record<string, number> = {};
    if (first.objects && last.objects) {
      byType.rows = last.objects.rows - first.objects.rows;
      byType.columns = last.objects.columns - first.objects.columns;
      byType.cells = last.objects.cells - first.objects.cells;
      byType.subscriptions = last.objects.subscriptions - first.objects.subscriptions;
    }

    const isConcerning = growthRate > 10000 || totalGrowth > 1000000;

    return {
      period,
      totalGrowth,
      growthRate,
      byType,
      isConcerning,
    };
  }

  /**
   * Find retained objects
   */
  findRetainedObjects(): RetainedObject[] {
    const retained: RetainedObject[] = [];
    
    // Placeholder for actual retention path analysis
    for (const [label, tracked] of this.trackedObjects.entries()) {
      if (tracked.ref.deref() !== undefined) {
        retained.push({
          type: label,
          size: 0, // Would need detailed heap analysis
          retentionPath: [label, 'global', 'window'],
        });
      }
    }

    return retained;
  }

  /**
   * Start automatic snapshot collection
   */
  startCollection(interval: number = this.config.interval || 1000): void {
    if (this.intervalId) {
      this.stopCollection();
    }
    this.intervalId = window.setInterval(() => {
      this.createSnapshot();
    }, interval);
  }

  /**
   * Stop automatic snapshot collection
   */
  stopCollection(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Create heap snapshot
   */
  createHeapSnapshot(): HeapSnapshot {
    return {
      timestamp: Date.now(),
      totalSize: this.snapshots.length > 0 
        ? this.snapshots[this.snapshots.length - 1].heapUsed 
        : 0,
      objectTypes: this.collectObjectTypes(),
      retentionPaths: this.collectRetentionPaths(),
    };
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots = [];
    this.trackedObjects.clear();
    this.leakDetector.clear();
    this.stopCollection();
  }

  /**
   * Check for leaks in snapshot
   */
  private checkForLeaks(snapshot: MemorySnapshot): void {
    const leaks = this.leakDetector.analyze(snapshot);
    
    for (const leak of leaks) {
      if (this.config.snapshotOnLeak) {
        this.snapshots.push(snapshot);
      }
    }
  }

  /**
   * Get heap statistics
   */
  private getHeapStats(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
      };
    }

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const perf = performance as any;
      return {
        heapUsed: perf.memory.usedJSHeapSize || 0,
        heapTotal: perf.memory.totalJSHeapSize || 0,
        external: 0,
      };
    }

    return { heapUsed: 0, heapTotal: 0, external: 0 };
  }

  /**
   * Count objects in current state
   */
  private countObjects(): {
    rows: number;
    columns: number;
    cells: number;
    subscriptions: number;
  } {
    // These would be tracked by the actual system
    return {
      rows: 0,
      columns: 0,
      cells: 0,
      subscriptions: this.trackedObjects.size,
    };
  }

  /**
   * Collect object types
   */
  private collectObjectTypes(): Record<string, number> {
    return {};
  }

  /**
   * Collect retention paths
   */
  private collectRetentionPaths(): string[][] {
    return [];
  }
}

/**
 * Leak detector implementation
 */
class LeakDetector {
  private referenceCounts: Map<string, number> = new Map();
  private observedObjects: Map<string, WeakRef<any>> = new Map();
  private threshold: number;

  constructor(threshold: number = 100) {
    this.threshold = threshold;
  }

  analyze(snapshot: MemorySnapshot): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Check for subscription leaks
    const subscriptionCount = this.referenceCounts.get('subscription') || 0;
    if (subscriptionCount > this.threshold) {
      leaks.push({
        type: 'subscription',
        count: subscriptionCount,
        size: subscriptionCount * 100,
        objects: [],
        severity: subscriptionCount > this.threshold * 2 ? 'critical' : 'medium',
      });
    }

    // Check for listener leaks
    const listenerCount = this.referenceCounts.get('listener') || 0;
    if (listenerCount > this.threshold) {
      leaks.push({
        type: 'listener',
        count: listenerCount,
        size: listenerCount * 50,
        objects: [],
        severity: 'low',
      });
    }

    return leaks;
  }

  detectLeaks(): MemoryLeak[] {
    return this.analyze({
      timestamp: Date.now(),
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      objects: { rows: 0, columns: 0, cells: 0, subscriptions: 0 },
    });
  }

  clear(): void {
    this.referenceCounts.clear();
    this.observedObjects.clear();
  }
}
