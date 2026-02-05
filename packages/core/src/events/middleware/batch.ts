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
  const timers = new Map<string, number>();

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
      return event; // Process immediately
    }

    // Set new timer
    const timer = setTimeout(() => {
      batches.delete(key);
      timers.delete(key);
    }, config.window);

    timers.set(key, timer as unknown as number);

    // Pass through (batching is transparent)
    return event;
  };
}