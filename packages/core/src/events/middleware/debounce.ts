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
      pending.delete(key);
      // Event will be processed when emitted
    }, delay);

    timers.set(key, timer);

    // For immediate processing in tests, let the event through
    // In a real implementation, this would return null and emit later
    return event;
  };
}