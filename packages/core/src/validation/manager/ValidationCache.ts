/**
 * Validation cache for performance optimization.
 *
 * Caches validation results to avoid redundant validation.
 *
 * @module @gridkit/core/validation/manager
 */

import type { ValidationResult } from '../result/ValidationResult';

// ===================================================================
// Validation Cache Interface
// ===================================================================

/**
 * Simple LRU cache implementation for validation results.
 */
export interface ValidationCache {
  /**
   * Get a cached result.
   *
   * @param key - Cache key
   * @returns Cached result or undefined
   */
  get<T = any>(key: string): ValidationResult<T> | undefined;

  /**
   * Set a cached result.
   *
   * @param key - Cache key
   * @param result - Result to cache
   */
  set<T = any>(key: string, result: ValidationResult<T>): void;

  /**
   * Check if a key exists in cache.
   *
   * @param key - Cache key
   * @returns Whether key exists
   */
  has(key: string): boolean;

  /**
   * Delete a cached result.
   *
   * @param key - Cache key
   */
  delete(key: string): void;

  /**
   * Clear all cached results.
   */
  clear(): void;

  /**
   * Get cache statistics.
   *
   * @returns Cache statistics
   */
  getStats(): CacheStats;

  /**
   * Get cache size.
   */
  readonly size: number;

  /**
   * Cache hit count.
   */
  hits: number;

  /**
   * Cache miss count.
   */
  misses: number;

  /**
   * Cache hit rate (0-1).
   */
  hitRate: number;
}

/**
 * Cache statistics.
 */
export interface CacheStats {
  /**
   * Current cache size.
   */
  readonly size: number;

  /**
   * Maximum cache size.
   */
  readonly maxSize: number;

  /**
   * Total hits.
   */
  readonly hits: number;

  /**
   * Total misses.
   */
  readonly misses: number;

  /**
   * Hit rate (0-1).
   */
  readonly hitRate: number;

  /**
   * Total entries evicted.
   */
  readonly evicted: number;
}

/**
 * Cache key generator for validation results.
 */
export interface ValidationCacheKeyGenerator {
  /**
   * Generate a cache key for validation.
   *
   * @param data - Data being validated
   * @param schemaId - Schema identifier
   * @param mode - Validation mode
   * @returns Cache key
   */
  generateKey(data: unknown, schemaId?: string, mode?: string): string;
}

/**
 * Default cache key generator implementation.
 */
export class DefaultCacheKeyGenerator implements ValidationCacheKeyGenerator {
  /**
   * Generate a cache key for validation.
   *
   * @param data - Data being validated
   * @param schemaId - Schema identifier
   * @param mode - Validation mode
   * @returns Cache key
   */
  generateKey(data: unknown, schemaId?: string, mode?: string): string {
    const dataHash = this.hashData(data);
    const modeHash = mode || 'default';
    const schemaHash = schemaId || 'no-schema';

    return `validation:${schemaHash}:${modeHash}:${dataHash}`;
  }

  /**
   * Hash data for cache key generation.
   *
   * @param data - Data to hash
   * @returns Hash string
   */
  private hashData(data: unknown): string {
    try {
      const jsonString = JSON.stringify(data);
      let hash = 0;

      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = (hash * 31 + char) | 0; // Keep as 32-bit integer
      }

      return Math.abs(hash).toString(16);
    } catch {
      // Fallback for circular references
      return `fallback_${data !== null ? typeof data : 'null'}`;
    }
  }
}

/**
 * Simple LRU cache implementation.
 */
export class SimpleLRUCache implements ValidationCache {
  private cache: Map<string, ValidationResult> = new Map();
  private maxSize: number;
  hits: number = 0;
  misses: number = 0;
  private evicted: number = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get<T = any>(key: string): ValidationResult<T> | undefined {
    const result = this.cache.get(key);

    if (result) {
      this.hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, result);
      return result as ValidationResult<T>;
    }

    this.misses++;
    return undefined;
  }

  set<T = any>(key: string, result: ValidationResult<T>): void {
    // Remove if already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.evicted++;
      }
    }

    this.cache.set(key, result);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evicted = 0;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      evicted: this.evicted,
    };
  }

  get size(): number {
    return this.cache.size;
  }

  get hitsCount(): number {
    return this.hits;
  }

  get missesCount(): number {
    return this.misses;
  }

  get hitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
}

/**
 * Cache statistics for validation manager.
 */
export interface ValidationCacheStats {
  /**
   * Cache hit rate (0-1).
   */
  readonly hitRate: number;

  /**
   * Average cache size.
   */
  readonly avgCacheSize: number;

  /**
   * Peak cache size.
   */
  readonly peakCacheSize: number;

  /**
   * Total cache evictions.
   */
  readonly totalEvictions: number;

  /**
   * Total validation operations.
   */
  readonly totalOperations: number;

  /**
   * Cached operations.
   */
  readonly cachedOperations: number;

  /**
   * Fresh operations.
   */
  readonly freshOperations: number;
}
