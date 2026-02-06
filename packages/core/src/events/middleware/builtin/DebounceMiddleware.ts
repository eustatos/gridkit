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

    if (options?.leading && !leadingExecuted.has(key)) {
      leadingExecuted.add(key);
      return event;
    }

    if (timers.has(key)) {
      clearTimeout(timers.get(key)!);
    }

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