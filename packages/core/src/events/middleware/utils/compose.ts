// compose.ts

import { EventMiddleware } from '@/events/types';

export function composeMiddlewares(
  ...middlewares: EventMiddleware[]
): EventMiddleware {
  return middlewares.reduceRight(
    (next, middleware) => (event) => {
      const result = middleware(event);
      return result === null ? null : next(result);
    },
    (event) => event
  );
}