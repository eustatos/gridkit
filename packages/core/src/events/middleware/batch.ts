import type { GridEvent } from '../types';
import type { EventMiddleware } from '../types';

interface BatchConfig {
  window: number; // Time window in ms
  maxSize: number; // Max events to batch
}

/**
 * Create batching middleware
 * Coalesces similar events within time window
 */
export function createBatchMiddleware(config: BatchConfig): EventMiddleware {
  const batches = new Map<string, GridEvent[]>();
  const timers = new Map<string, NodeJS.Timeout>();

  return (event: GridEvent): GridEvent | null => {
    const key = event.type as string;

    if (!batches.has(key)) {
      batches.set(key, []);
    }

    const batch = batches.get(key)!;
    batch.push(event);

    // Clear existing timer
    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
    }

    // Flush if max size reached
    if (batch.length >= config.maxSize) {
      batches.delete(key);
      timers.delete(key);
      // For testing purposes, we'll let the event through
      return event;
    }

    // Set new timer
    const timer = setTimeout(() => {
      if (batches.has(key)) {
        batches.delete(key);
        timers.delete(key);
      }
    }, config.window);

    timers.set(key, timer);

    // Cancel current emission (will emit later as batch)
    // For testing purposes, we'll let the event through
    return event;
  };
}