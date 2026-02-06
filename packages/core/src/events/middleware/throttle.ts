import type { GridEvent, EventMiddleware } from '../types';

/**
 * Simple throttle middleware for testing
 * Only lets through events at certain intervals
 */
export function createSimpleThrottleMiddleware(
  intervalMs: number
): EventMiddleware {
  const lastProcessed = new Map<string, number>();

  return (event: GridEvent): GridEvent | null => {
    const eventType = event.type;
    const now = Date.now();
    const lastTime = lastProcessed.get(eventType) || 0;

    // If enough time has passed since last event, let it through
    if (now - lastTime >= intervalMs) {
      lastProcessed.set(eventType, now);
      return event;
    }

    // Otherwise, throttle (ignore)
    return null;
  };
}
