// ThrottleMiddleware.ts

import { GridEvent, EventMiddleware } from '@/events/types';

export function createThrottleMiddleware(
  delay: number
): EventMiddleware {
  const lastExecution = new Map<string, number>();

  return (event: GridEvent) => {
    const key = event.type;
    const now = Date.now();
    const last = lastExecution.get(key) || 0;

    if (now - last >= delay) {
      lastExecution.set(key, now);
      return event;
    }

    return null; // Cancel this event
  };
}