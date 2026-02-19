import type { GridEvent, EventMiddleware } from '../types';

/**
 * Simple throttle middleware for testing
 * Only lets through events at certain intervals
 */
export function createSimpleThrottleMiddleware(
  intervalMs: number
): EventMiddleware {
  const lastProcessed = new Map<string, number | null>();

  return (event: GridEvent): GridEvent | null => {
    const eventType = event.type;
    const now = Date.now();
    const lastTime = lastProcessed.get(eventType);

    // If no previous event, let it through
    if (lastTime === undefined) {
      lastProcessed.set(eventType, now);
      return event;
    }

    // If enough time has passed since last event, let it through
    if (now - lastTime >= intervalMs) {
      lastProcessed.set(eventType, now);
      return event;
    }

    // Otherwise, throttle (ignore)
    return null;
  };
}
