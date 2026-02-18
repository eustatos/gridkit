/**
 * Memory Leak Detection.
 *
 * Advanced memory leak detection with weak reference tracking.
 * Uses FinalizationRegistry for automatic cleanup detection.
 *
 * @module @gridkit/core/performance/memory
 */

import type { SuspectedLeak, LeakDetectionStats, CategoryStats } from '../types';

/**
 * Tracked object with metadata.
 */
interface TrackedObject {
  object: WeakRef<object>;
  category: string;
  meta?: object;
  createdAt: number;
  retained: boolean;
}

/**
 * Memory leak detector with weak reference tracking.
 */
export interface MemoryLeakDetector {
  /**
   * Track object creation with optional category.
   */
  track(object: object, category?: string, meta?: object): void;

  /**
   * Mark object as intentionally retained.
   */
  retain(object: object, reason?: string): void;

  /**
   * Check for suspected leaks.
   */
  checkLeaks(): SuspectedLeak[];

  /**
   * Get memory leak statistics.
   */
  getStats(): LeakDetectionStats;

  /**
   * Clear tracking data.
   */
  clear(): void;
}

/**
 * Memory leak detector implementation.
 */
export class MemoryLeakDetectorImpl implements MemoryLeakDetector {
  private trackedObjects = new Map<string, TrackedObject[]>();
  private retainedObjects = new Set<object>();
  private finalizationRegistry?: FinalizationRegistry<string>;

  constructor() {
    // Set up finalization registry for automatic cleanup detection
    if (typeof FinalizationRegistry !== 'undefined') {
      this.finalizationRegistry = new FinalizationRegistry((heldValue) => {
        this.handleCollection(heldValue);
      });
    }
  }

  track(object: object, category: string = 'default', meta?: object): void {
    const tracked: TrackedObject = {
      object: new WeakRef(object),
      category,
      meta,
      createdAt: Date.now(),
      retained: false,
    };

    let objects = this.trackedObjects.get(category);
    if (!objects) {
      objects = [];
      this.trackedObjects.set(category, objects);
    }

    objects.push(tracked);

    // Register for cleanup notification
    this.finalizationRegistry?.register(object, category);

    // Track retained status
    if (this.retainedObjects.has(object)) {
      tracked.retained = true;
    }
  }

  retain(object: object, reason: string = 'unknown'): void {
    this.retainedObjects.add(object);
    this.updateTrackedObject(object, (o) => {
      o.retained = true;
      o.meta = { ...o.meta, retainedReason: reason };
    });
  }

  checkLeaks(): SuspectedLeak[] {
    const leaks: SuspectedLeak[] = [];
    const now = Date.now();

    for (const [category, objects] of this.trackedObjects.entries()) {
      // Filter out collected objects
      const activeObjects = objects.filter((o) => o.object.deref() !== undefined);

      if (activeObjects.length === 0 && objects.length > 0) {
        // All objects in this category were collected - no leak
        continue;
      }

      // Check for growth patterns
      const growthRate = this.calculateGrowthRate(category);

      // suspected leak if: high count, growing, not explicitly retained
      const suspectedCount = activeObjects.filter((o) => !o.retained).length;

      if (suspectedCount > 10 && growthRate > 0.1) {
        const sampleObjects = activeObjects
          .slice(0, 5)
          .map((o) => o.object);

        leaks.push({
          category,
          count: suspectedCount,
          growthRate,
          firstSeen: activeObjects[0]?.createdAt ?? now,
          lastSeen: activeObjects[activeObjects.length - 1]?.createdAt ?? now,
          sampleObjects,
        });
      }
    }

    return leaks;
  }

  getStats(): LeakDetectionStats {
    const trackedObjects = new Set<number>();
    let collectedObjects = 0;
    const categories: Record<string, CategoryStats> = {};

    for (const [category, objects] of this.trackedObjects.entries()) {
      const active = objects.filter((o) => o.object.deref() !== undefined);
      const collected = objects.length - active.length;

      trackedObjects.add(active.length);
      collectedObjects += collected;

      const categoryStats: CategoryStats = {
        current: active.length,
        peak: objects.length, // Track peak over time
        collected,
        growthRate: this.calculateGrowthRate(category),
      };

      categories[category] = categoryStats;
    }

    return {
      trackedObjects: trackedObjects.size,
      collectedObjects,
      retainedObjects: this.retainedObjects.size,
      suspectedLeaks: this.checkLeaks().length,
      categories,
    };
  }

  clear(): void {
    this.trackedObjects.clear();
    this.retainedObjects.clear();
    this.finalizationRegistry?.register(new Object(), 'clear');
  }

  // ===================================================================
  // Private Methods
  // ===================================================================

  private updateTrackedObject(
    object: object,
    updater: (o: TrackedObject) => void
  ): void {
    for (const objects of this.trackedObjects.values()) {
      for (const tracked of objects) {
        if (tracked.object.deref() === object) {
          updater(tracked);
          return;
        }
      }
    }
  }

  private handleCollection(_key: string): void {
    // Object was collected - this is expected
  }

  private calculateGrowthRate(category: string): number {
    const objects = this.trackedObjects.get(category) || [];
    if (objects.length < 2) return 0;

    const now = Date.now();
    const first = objects[0]?.createdAt ?? now;
    const last = objects[objects.length - 1]?.createdAt ?? now;
    const timeSpan = last - first;

    if (timeSpan <= 0) return 0;

    // Calculate growth rate as objects per second
    return (objects.length / timeSpan) * 1000;
  }
}

/**
 * Creates a memory leak detector.
 */
export function createMemoryLeakDetector(): MemoryLeakDetector {
  return new MemoryLeakDetectorImpl();
}

/**
 * Tracks an object for memory leak detection.
 *
 * @param detector - Memory leak detector instance
 * @param object - Object to track
 * @param category - Optional category for grouping
 * @param meta - Optional metadata
 */
export function trackObject(
  detector: MemoryLeakDetector,
  object: object,
  category?: string,
  meta?: object
): void {
  detector.track(object, category, meta);
}

/**
 * Checks for suspected memory leaks.
 *
 * @param detector - Memory leak detector instance
 * @returns Array of suspected leaks
 */
export function checkForLeaks(detector: MemoryLeakDetector): SuspectedLeak[] {
  return detector.checkLeaks();
}
