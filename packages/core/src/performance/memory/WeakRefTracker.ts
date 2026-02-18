/**
 * Weak Reference Utilities.
 *
 * Helper utilities for working with WeakRef and FinalizationRegistry.
 *
 * @module @gridkit/core/performance/memory/weakref
 */

/**
 * Safe tracker using weak references to prevent memory leaks.
 */
export class SafeWeakRefTracker<T extends object> {
  private refs: WeakRef<T>[] = [];
  private registry?: FinalizationRegistry<string>;

  constructor() {
    if (typeof FinalizationRegistry !== 'undefined') {
      this.registry = new FinalizationRegistry((key: string) => {
        this.handleCleanup(key);
      });
    }
  }

  /**
   * Track an object with optional key.
   */
  track(object: T, key?: string): void {
    this.refs.push(new WeakRef(object));
    if (key && this.registry) {
      this.registry.register(object, key);
    }
  }

  /**
   * Get all alive references.
   */
  getAlive(): T[] {
    return this.refs
      .map((ref) => ref.deref())
      .filter((ref): ref is T => ref !== undefined);
  }

  /**
   * Count alive references.
   */
  count(): number {
    return this.getAlive().length;
  }

  /**
   * Clear all tracked objects.
   */
  clear(): void {
    this.refs = [];
  }

  /**
   * Handle cleanup notification.
   */
  private handleCleanup(_key: string): void {
    // Object was garbage collected
  }
}

/**
 * Memory-safe object pool using weak references.
 */
export class WeakObjectPool<T extends object> {
  private objects = new Map<string, WeakRef<T>>();

  /**
   * Add object to pool.
   */
  add(key: string, object: T): void {
    this.objects.set(key, new WeakRef(object));
  }

  /**
   * Get object from pool if alive.
   */
  get(key: string): T | undefined {
    const ref = this.objects.get(key);
    return ref?.deref();
  }

  /**
   * Check if object exists and is alive.
   */
  has(key: string): boolean {
    const ref = this.objects.get(key);
    return ref?.deref() !== undefined;
  }

  /**
   * Remove object from pool.
   */
  remove(key: string): void {
    this.objects.delete(key);
  }

  /**
   * Clear all objects.
   */
  clear(): void {
    this.objects.clear();
  }

  /**
   * Get number of alive objects.
   */
  size(): number {
    let count = 0;
    for (const ref of this.objects.values()) {
      if (ref.deref() !== undefined) {
        count++;
      }
    }
    return count;
  }
}

/**
 * Creates a safe weak ref tracker.
 */
export function createSafeWeakRefTracker<T extends object>(): SafeWeakRefTracker<T> {
  return new SafeWeakRefTracker<T>();
}

/**
 * Creates a weak object pool.
 */
export function createWeakObjectPool<T extends object>(): WeakObjectPool<T> {
  return new WeakObjectPool<T>();
}
