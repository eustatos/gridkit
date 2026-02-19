// LoggingMiddleware.ts

import { GridEvent, EventMiddleware } from '@/events/types';

export function createLoggingMiddleware(
  logger: (message: string) => void
): EventMiddleware {
  return (event: GridEvent) => {
    logger(`Event: ${event.type}`);
    return event;
  };
}