/**
 * Performance Column Enhancer for TanStack Table
 *
 * Adds caching and memoization capabilities to column definitions.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

import type { ColumnDef } from '@tanstack/react-table'

/**
 * Performance options for column
 */
export interface ColumnPerformanceOptions {
  cacheable?: boolean
  memoize?: boolean
}

/**
 * Performant column definition type
 */
export interface PerformantColumnDef<TData, TValue = unknown> 
  extends ColumnDef<TData, TValue> {
  cacheable: boolean
  memoize: boolean
}

/**
 * Create a performant column definition with caching
 *
 * @param column - Base column definition
 * @param options - Performance options
 * @returns Performant column definition
 *
 * @example
 * ```typescript
 * const performantColumn = withColumnPerformance(
 *   { accessorKey: 'complexField', header: 'Complex' },
 *   { cacheable: true, memoize: true }
 * )
 * ```
 */
export function withColumnPerformance<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  options?: ColumnPerformanceOptions
): PerformantColumnDef<TData, TValue> {
  const cache = new Map<string, any>()
  const memoizeCache = new Map<string, any>()
  
  const cacheable = options?.cacheable ?? true
  const memoize = options?.memoize ?? true

  return {
    ...column,
    cacheable,
    memoize,

    cell: (info) => {
      if (cacheable) {
        const cacheKey = `${info.row.id}-${column.id}`
        
        if (cache.has(cacheKey)) {
          return cache.get(cacheKey)
        }
      }

      const baseCell = typeof column.cell === 'function'
        ? column.cell(info)
        : info.getValue()

      if (cacheable) {
        const cacheKey = `${info.row.id}-${column.id}`
        cache.set(cacheKey, baseCell)
      }

      if (memoize) {
        const memoizeKey = JSON.stringify(info.row.original)
        
        if (memoizeCache.has(memoizeKey)) {
          return memoizeCache.get(memoizeKey)
        }

        memoizeCache.set(memoizeKey, baseCell)
      }

      return baseCell
    },
  } as PerformantColumnDef<TData, TValue>
}

/**
 * Clear all caches for a column
 */
export function clearColumnPerformanceCache<TData, TValue = unknown>(
  column: PerformantColumnDef<TData, TValue>
): void {
  // Caches are stored in closure, so we can't clear them directly
  // This is a limitation of the current implementation
  // In production, consider using WeakMap or context-based caching
}
