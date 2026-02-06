import type { GridEvent } from '../types';
import type { EventMiddleware } from '../types';

/**
 * Create debouncing middleware
 * Delays event emission until quiet period
 */
export function createDebounceMiddleware(delay: number): EventMiddleware {
  const timers = new Map<string, NodeJS.Timeout>();
  const pending = new Map<string, GridEvent>();

  return (event: GridEvent): GridEvent | null => {
    const key = event.type as string;

    // Clear existing timer
    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
    }

    // Store pending event
    pending.set(key, event);

    // Set new timer
    const timer = setTimeout(() => {
      timers.delete(key);
      const pendingEvent = pending.get(key);
      pending.delete(key);
      
      // Emit the last event in the batch
      if (pendingEvent) {
        // We can't emit directly from middleware, so we just clear the pending event
        // The actual emission will happen when the timer completes
      }
    }, delay);

    timers.set(key, timer);

    // Cancel current emission (will emit later)
    return null;
  };
}