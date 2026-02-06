// DebounceMiddleware.ts

import { GridEvent, EventMiddleware } from '../core/EventPipeline';

export function createDebounceMiddleware(
  delay: number,
  options?: { leading?: boolean }
): EventMiddleware {
  const timers = new Map<string, NodeJS.Timeout>();
  const leadingExecuted = new Set<string>();
  const timerFired = new Map<string, boolean>(); // Track if timer just fired

  return (event: GridEvent) => {
    const key = event.type;

    // Handle leading edge
    if (options?.leading && !leadingExecuted.has(key)) {
      leadingExecuted.add(key);
      
      // Set up timer
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          timerFired.set(key, true);
        }, delay)
      );
      
      return event;
    }

    // If timer just fired, allow this event to pass through
    if (timerFired.get(key)) {
      timerFired.delete(key);
      
      // Set up new timer
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          timerFired.set(key, true);
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
        timerFired.set(key, true);
      }, delay)
    );

    return null; // Cancel this event
  };
}