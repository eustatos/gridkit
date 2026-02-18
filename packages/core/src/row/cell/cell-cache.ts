/**
 * Cell cache system for efficient cell storage and retrieval.
 * 
 * Provides O(1) lookups for cells using column IDs as keys.
 * Memory-efficient caching with automatic cleanup support.
 * 
 * @module @gridkit/core/row/cell-cache
 */

import type { RowData } from '@/types';
import type { Cell } from '@/types/row/Cell';
// Column is not used - kept for potential future use
// import type { Column } from '@/types/column/ColumnInstance';

/**
 * Cell cache entry for storing cell instances.
 */
interface CellCacheEntry<TData extends RowData> {
  cell: Cell<TData, unknown>;
  lastAccessed: number;
}

/**
 * Cell cache with LRU-like eviction and O(1) lookups.
 * 
 * @template TData - Row data type
 */
export class CellCache<TData extends RowData> {
  private cache = new Map<string, CellCacheEntry<TData>>();
  private maxSize: number;
  private accessCounter = 0;

  /**
   * Creates a new cell cache.
   * @param maxSize - Maximum number of cells to keep in cache (default: 1000)
   */
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  /**
   * Get a cell from cache by column ID.
   * @param columnId - Column identifier
   * @returns Cached cell or undefined
   */
  get<TValue = unknown>(
    columnId: string
  ): Cell<TData, TValue> | undefined {
    const entry = this.cache.get(columnId) as CellCacheEntry<TData> | undefined;
    if (entry) {
      entry.lastAccessed = ++this.accessCounter;
      return entry.cell as Cell<TData, TValue>;
    }
    return undefined;
  }

  /**
   * Set a cell in the cache.
   * @param columnId - Column identifier
   * @param cell - Cell instance to cache
   */
  set<TValue = unknown>(columnId: string, cell: Cell<TData, TValue>): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(columnId, {
      cell: cell as Cell<TData, unknown>,
      lastAccessed: ++this.accessCounter,
    });
  }

  /**
   * Check if a cell exists in cache.
   * @param columnId - Column identifier
   * @returns True if cached, false otherwise
   */
  has(columnId: string): boolean {
    return this.cache.has(columnId);
  }

  /**
   * Remove a cell from cache.
   * @param columnId - Column identifier
   * @returns True if cell was removed, false otherwise
   */
  delete(columnId: string): boolean {
    return this.cache.delete(columnId);
  }

  /**
   * Clear all cached cells.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring.
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      accessCounter: this.accessCounter,
    };
  }

  /**
   * Evict the least recently accessed cell.
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestAccessed = Number.MAX_SAFE_INTEGER;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccessed) {
        oldestAccessed = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Destroy cache and clean up references.
   */
  destroy(): void {
    this.clear();
  }
}

/**
 * Creates a new cell cache instance.
 * @template TData - Row data type
 * @param maxSize - Maximum cache size (default: 1000)
 * @returns New cell cache instance
 */
export function createCellCache<TData extends RowData>(
  maxSize?: number
): CellCache<TData> {
  return new CellCache<TData>(maxSize);
}
