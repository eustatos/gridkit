/**
 * Column Enhancer Composition Utility
 *
 * Utility function to compose multiple column enhancers in a clean, functional way.
 *
 * @module @gridkit/tanstack-adapter/columns
 */

import type { ColumnDef } from '@tanstack/react-table'

/**
 * Column enhancer function type
 */
export type ColumnEnhancer<TData, TValue = unknown> = (
  column: ColumnDef<TData, TValue>
) => ColumnDef<TData, TValue>

/**
 * Compose multiple column enhancers into a single enhancer
 *
 * @param enhancers - Array of column enhancers to compose
 * @returns A single enhancer that applies all enhancers in order
 *
 * @example
 * ```typescript
 * const enhance = composeColumnEnhancers(
 *   (col) => withColumnValidation(col, schema),
 *   (col) => withColumnFormat(col, formatter),
 *   (col) => withColumnMetadata(col, meta)
 * )
 * const enhancedColumn = enhance(baseColumn)
 * ```
 */
export function composeColumnEnhancers<TData, TValue = unknown>(
  ...enhancers: ColumnEnhancer<TData, TValue>[]
): ColumnEnhancer<TData, TValue> {
  return (column: ColumnDef<TData, TValue>) =>
    enhancers.reduce(
      (enhanced, enhancer) => enhancer(enhanced),
      column
    )
}

/**
 * Shorthand for creating a composed column enhancer
 * 
 * @param column - Base column definition
 * @param enhancers - Array of enhancers to apply
 * @returns Enhanced column definition
 *
 * @example
 * ```typescript
 * const enhanced = createEnhancedColumn(
 *   { accessorKey: 'price', header: 'Price' },
 *   (col) => withColumnValidation(col, schema),
 *   (col) => withColumnFormat(col, formatters.currency(2)),
 *   (col) => withColumnMetadata(col, { label: 'Price' })
 * )
 * ```
 */
export function createEnhancedColumn<TData, TValue = unknown>(
  column: ColumnDef<TData, TValue>,
  ...enhancers: ColumnEnhancer<TData, TValue>[]
): ColumnDef<TData, TValue> {
  return composeColumnEnhancers(...enhancers)(column)
}
