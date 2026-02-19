import type { Table, TableOptions, RowData } from '../../types';
import { initializeTableInstance } from '../instance/initialization';
import { createTableInstance } from '../instance/TableInstance';

import { wrapCreationError , logCreationMetrics } from './error-handling';
import { validateAndNormalize } from './validation';

/**
 * Creates a production-ready table instance with comprehensive validation,
 * performance monitoring, and lifecycle management.
 *
 * @template TData - Row data type (extends RowData)
 * @param options - Type-safe table configuration
 * @returns Fully initialized, memory-safe table instance
 *
 * @example
 * ```typescript
 * const table = createTable({
 *   columns: [{ accessorKey: 'name', header: 'Name' }],
 *   data: users,
 *   getRowId: (row) => row.id,
 *   debug: { performance: true }
 * });
 * ```
 */
export function createTable<TData extends RowData>(
  options: TableOptions<TData>
): Table<TData> {
  // 1. Performance tracking (debug mode)
  const perfStart = performance.now();

  try {
    // 2. Phase 1: Validation & Normalization
    const validated = validateAndNormalize(options);

    // 3. Phase 2: Core Instance Creation
    const instance = createTableInstance(validated);

    // 4. Phase 3: Setup & Initialization
    initializeTableInstance(instance, validated);

    // 5. Performance logging
    if (validated.debug?.performance) {
      logCreationMetrics(perfStart);
    }

    return instance;
  } catch (error) {
    // 6. Error handling with context
    throw wrapCreationError(error, options);
  }
}