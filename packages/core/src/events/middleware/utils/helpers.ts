// helpers.ts

import { GridEvent, EventMiddleware } from '../core/EventPipeline';

export function createConditionalMiddleware(
  condition: (event: GridEvent) => boolean,
  middleware: EventMiddleware
): EventMiddleware {
  return (event: GridEvent) => {
    if (condition(event)) {
      return middleware(event);
    }
    return event;
  };
}