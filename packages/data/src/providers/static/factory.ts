/**
 * Factory functions for StaticDataProvider.
 *
 * @example
 * ```typescript
 * import { createStaticProvider, staticProvider } from '@gridkit/data/providers';
 *
 * // Using createStaticProvider
 * const provider1 = createStaticProvider(users, { applySorting: true });
 *
 * // Using staticProvider (shorthand)
 * const provider2 = staticProvider(users);
 * ```
 */

import type { StaticProviderOptions } from './StaticDataProvider';
import { StaticDataProvider } from './StaticDataProvider';
import type { RowData } from '@gridkit/core/types';

/**
 * Creates a new static data provider.
 *
 * @template TData - Row data type
 * @param data - Initial data array
 * @param options - Provider options
 * @returns Static data provider instance
 */
export function createStaticProvider<TData extends RowData>(
  data: TData[] = [],
  options: StaticProviderOptions = {}
): StaticDataProvider<TData> {
  return new StaticDataProvider(data, options);
}

/**
 * Creates a static provider from existing data.
 * Shorthand for createStaticProvider.
 */
export function staticProvider<TData extends RowData>(
  data: TData[] = [],
  options: StaticProviderOptions = {}
): StaticDataProvider<TData> {
  return createStaticProvider(data, options);
}
