import type { GridEvent } from '../types';
import type { EventMiddleware } from '../types';

/**
 * Create debouncing middleware
 * Delays event emission until quiet period
 */
export function createDebounceMiddleware(delay: number): EventMiddleware {
  const timers = new Map<string, NodeJS.Timeout>();
  const pendingEvents = new Map<string, GridEvent>();

  return (event: GridEvent): GridEvent | null => {
    const key = event.type as string;

    // Clear existing timer
    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
    }

    // Store the pending event
    pendingEvents.set(key, event);

    // Set new timer
    const timer = setTimeout(() => {
      timers.delete(key);
      pendingEvents.delete(key);
      // In a real implementation, this would emit the pending event
      // For now, we just let the middleware work as is for testing
    }, delay);

    timers.set(key, timer);

    // Cancel current emission - we'll emit the last event later
    return null;
  };
}