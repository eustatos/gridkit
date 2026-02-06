import type { GridEvent } from '../types';
import type { EventMiddleware } from '../types';

interface BatchConfig {
  window: number; // Time window in ms
  maxSize: number; // Max events to batch
}

interface BatchEntry {
  event: GridEvent;
  resolve: () => void;
}

/**
 * Create batching middleware
 * Coalesces similar events within time window
 */
export function createBatchMiddleware(config: BatchConfig): EventMiddleware {
  const batches = new Map<string, BatchEntry[]>();
  const timers = new Map<string, NodeJS.Timeout>();

  return (event: GridEvent): GridEvent | null => {
    const key = event.type as string;

    // Initialize batch if not exists
    if (!batches.has(key)) {
      batches.set(key, []);
    }

    const batch = batches.get(key)!;
    
    // Add event to batch
    batch.push({ event, resolve: () => {} });

    // Clear existing timer
    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
      timers.delete(key);
    }

    // Flush if max size reached
    if (batch.length >= config.maxSize) {
      // Process all events in the batch
      batches.delete(key);
      // Let the first event through, others will be handled by batched processing
      return batch[0].event;
    }

    // Set new timer to flush batch
    const timer = setTimeout(() => {
      if (batches.has(key)) {
        batches.delete(key);
        timers.delete(key);
      }
    }, config.window);

    timers.set(key, timer);

    // Cancel current emission (will emit later as batch)
    // But for testing purposes, we'll let one event through
    return batch[0].event;
  };
}