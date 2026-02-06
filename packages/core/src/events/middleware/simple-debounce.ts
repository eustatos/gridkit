import type { GridEvent, EventMiddleware } from '../types';

/**
 * Simple debounce middleware for testing
 * Only lets through first event, ignores subsequent ones
 */
export function createSimpleDebounceMiddleware(): EventMiddleware {
  const lastProcessed = new Map<string, number>();
  const DEBOUNCE_MS = 10;

  return (event: GridEvent): GridEvent | null => {
    const eventType = event.type;
    const now = Date.now();
    const lastTime = lastProcessed.get(eventType) || 0;

    // If enough time has passed since last event, let it through
    if (now - lastTime > DEBOUNCE_MS) {
      lastProcessed.set(eventType, now);
      return event;
    }

    // Otherwise, ignore (debounce)
    return null;
  };
}
