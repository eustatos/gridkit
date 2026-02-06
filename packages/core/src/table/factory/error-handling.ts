/**
 * Wraps creation errors with additional context for better debugging.
 */
function wrapCreationError(error: unknown, options: TableOptions<unknown>): GridError {
  // If it's already a GridKit error, just rethrow
  if (error instanceof GridKitError) {
    return error;
  }

  // If it's a validation aggregate error, preserve it
  if (error instanceof ValidationAggregateError) {
    return error;
  }

  // For unexpected errors, wrap with context
  return new GridKitError(
    'TABLE_CREATION_FAILED',
    `Failed to create table: ${error instanceof Error ? error.message : 'Unknown error'}`,
    {
      originalError: error,
      options: {
        // Only include safe metadata, not actual data
        columnCount: Array.isArray(options.columns) ? options.columns.length : 0,
        hasData: Array.isArray(options.data) && options.data.length > 0,
        hasGetRowId: typeof options.getRowId === 'function',
        hasDebug: Boolean(options.debug),
      },
    }
  );
}

/**
 * Logs creation metrics for performance monitoring.
 */
function logCreationMetrics(startTime: number, memoryBefore: number): void {
  const duration = performance.now() - startTime;
  const memoryAfter = measureMemory();
  const memoryUsed = memoryAfter - memoryBefore;

  console.debug('[GridKit] Table creation metrics', {
    duration: `${duration.toFixed(2)}ms`,
    memory: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
  });
}

/**
 * Measures memory usage (simplified version).
 */
function measureMemory(): number {
  // In a real implementation, this would use performance.memory or similar APIs
  // For now, we'll return 0 as a placeholder
  return 0;
}