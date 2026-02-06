// DebounceMiddleware.ts

import { GridEvent, EventMiddleware } from '../core/EventPipeline';

export function createDebounceMiddleware(
  delay: number,
  options?: { leading?: boolean }
): EventMiddleware {
  const timers = new Map<string, NodeJS.Timeout>();
  const leadingExecuted = new Set<string>();

  return (event: GridEvent) => {
    const key = event.type;

    // Handle leading edge
    if (options?.leading && !leadingExecuted.has(key)) {
      leadingExecuted.add(key);
      
      // Set up timer to clear the leading flag after delay
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          if (options?.leading) {
            leadingExecuted.delete(key);
          }
        }, delay)
      );
      
      return event;
    }

    // Clear existing timer if any
    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
    }

    // Set up new timer
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        if (options?.leading) {
          leadingExecuted.delete(key);
        }
      }, delay)
    );

    return null; // Cancel this event
  };
}