import type { GridEvent, EventMiddleware } from '../types';

/**
 * Simple batch middleware for testing
 * Lets through events in batches
 */
export function createSimpleBatchMiddleware(config: {
  batchSize: number;
}): EventMiddleware {
  const eventCounts = new Map<string, number>();

  return (event: GridEvent): GridEvent | null => {
    const eventType = event.type;
    const currentCount = (eventCounts.get(eventType) || 0) + 1;
    eventCounts.set(eventType, currentCount);

    // Only let through events that are multiples of batchSize
    if (currentCount % config.batchSize === 0) {
      return {
        ...event,
        metadata: {
          ...event.metadata,
          isBatched: true,
          batchCount: currentCount,
        },
      };
    }

    return null;
  };
}
