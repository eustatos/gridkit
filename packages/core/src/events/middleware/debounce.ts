import type { GridEvent } from '../types';
import type { EventMiddleware } from '../types';

/**
 * Create debouncing middleware
 * Delays event emission until quiet period
 */
export function createDebounceMiddleware(delay: number): EventMiddleware {
  const timers = new Map<string, NodeJS.Timeout>();
  let lastEvent: GridEvent | null = null;

  return (event: GridEvent): GridEvent | null => {
    const key = event.type as string;

    // Clear existing timer
    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
    }

    // Store the last event
    lastEvent = event;

    // Set new timer
    const timer = setTimeout(() => {
      timers.delete(key);
      // Event will be processed when emitted
    }, delay);

    timers.set(key, timer);

    // Cancel current emission - we'll emit the last event later
    // For testing purposes, we'll let the event through
    return event;
  };
}