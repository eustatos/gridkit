/**
 * Batch middleware for grouping events.
 *
 * @module @gridkit/core/events/middleware/batch
 */

import type { GridEvent, EventMiddleware } from '../types';

/**
 * Batched event container.
 */
export interface BatchedEvent<T> {
  type: string;
  events: Array<GridEvent<T>>;
  timestamp: number;
}

/**
 * Batch middleware configuration.
 */
export interface BatchMiddlewareOptions<T = unknown> {
  /**
   * Maximum batch size (number of events).
   * When reached, the batch is flushed automatically.
   * Default: 100
   */
  maxSize?: number;

  /**
   * Maximum batch age in milliseconds.
   * After this time, the batch is flushed automatically.
   * Default: 1000 (1 second)
   */
  maxAge?: number;

  /**
   * Function to determine if event should be batched.
   * Default: batchedEvents.has(event.type)
   */
  shouldBatch?: (event: GridEvent<T>) => boolean;

  /**
   * Function to transform batched events.
   * Can be used to aggregate or summarize events.
   */
  transformBatch?: (events: Array<GridEvent<T>>) => GridEvent<unknown>;

  /**
   * Callback when batch is flushed.
   */
  onFlush?: (batchedEvents: Array<GridEvent<T>>) => void;
}

/**
 * Create batch middleware.
 *
 * @param options - Batch configuration
 * @returns Event middleware
 *
 * @example
 * ```typescript
 * // Batch all row events
 * const batchMiddleware = createBatchMiddleware({
 *   shouldBatch: (event) => event.type.startsWith('row:'),
 *   maxSize: 50,
 *   maxAge: 500,
 * });
 *
 * bus.use(batchMiddleware);
 * ```
 *
 * @public
 */
export function createBatchMiddleware<T = unknown>(
  options: BatchMiddlewareOptions<T> = {}
): EventMiddleware {
  const {
    maxSize = 100,
    maxAge = 1000,
    shouldBatch = () => false,
    transformBatch,
    onFlush,
  } = options;

  let batch: Array<GridEvent<T>> = [];
  let flushTimeout: NodeJS.Timeout | null = null;

  const flush = () => {
    if (batch.length === 0) return null;

    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }

    const events = [...batch];
    batch = [];

    if (onFlush) {
      onFlush(events);
    }

    if (transformBatch) {
      return transformBatch(events);
    }

    // Return null to indicate events were batched but not forwarded
    return null;
  };

  const scheduleFlush = () => {
    if (flushTimeout) return;
    flushTimeout = setTimeout(() => {
      flush();
    }, maxAge);
  };

  return (event: GridEvent): GridEvent | null => {
    if (!shouldBatch(event as GridEvent<T>)) {
      return event;
    }

    batch.push(event as GridEvent<T>);

    if (batch.length >= maxSize) {
      return flush();
    }

    scheduleFlush();

    // Return null to indicate event was batched
    return null;
  };
}

/**
 * Create a batched event for grouped events.
 *
 * @param eventType - Type of batched event
 * @param events - Array of original events
 * @returns Batched event
 *
 * @example
 * ```typescript
 * const events = [...]; // Array of GridEvent
 * const batchedEvent = createBatchedEvent('rows:batch-update', events);
 * ```
 *
 * @public
 */
export function createBatchedEvent<T>(
  eventType: string,
  events: Array<GridEvent<T>>
): GridEvent<BatchedEvent<T>> {
  return {
    type: eventType,
    namespace: 'batch' as any, // Temporary workaround for EventNamespace
    payload: {
      type: eventType,
      events,
      timestamp: performance.now(),
    },
    timestamp: performance.now(),
    source: 'batch-middleware',
  };
}
