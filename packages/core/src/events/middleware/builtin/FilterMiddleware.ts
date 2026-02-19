// FilterMiddleware.ts

import { GridEvent, EventMiddleware } from '@/events/types';

export function createFilterMiddleware(
  predicate: (event: GridEvent) => boolean
): EventMiddleware {
  return (event: GridEvent) => {
    return predicate(event) ? event : null;
  };
}