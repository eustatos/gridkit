// compose.ts

import { EventMiddleware } from '../core/EventPipeline';

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