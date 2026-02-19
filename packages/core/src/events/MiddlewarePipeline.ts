import type { GridEvent, EventMiddleware } from './types';

/**
 * Middleware pipeline for processing events through a chain of middleware functions
 * 
 * Single Responsibility: Manage and execute middleware chain for event transformation
 */
export interface MiddlewarePipeline {
  add(middleware: EventMiddleware): void;
  remove(middleware: EventMiddleware): void;
  apply(event: GridEvent): GridEvent | null;
  clear(): void;
  size(): number;
  has(middleware: EventMiddleware): boolean;
}

/**
 * Create middleware pipeline for event processing
 */
export function createMiddlewarePipeline(): MiddlewarePipeline {
  const middlewares: EventMiddleware[] = [];

  return {
    add(middleware: EventMiddleware): void {
      middlewares.push(middleware);
    },

    remove(middleware: EventMiddleware): void {
      const index = middlewares.indexOf(middleware);
      if (index !== 1) {
        middlewares.splice(index, 1);
      }
    },

    apply<T>(event: GridEvent<T>): GridEvent<T> | null {
      if (middlewares.length === 0) {
        return event;
      }

      // Fast path for single middleware (common case)
      if (middlewares.length === 1) {
        const result = middlewares[0](event);
        return result === null ? null : (result as GridEvent<T>);
      }

      // For multiple middlewares
      let currentEvent: GridEvent<T> = event;

      for (let i = 0; i < middlewares.length; i++) {
        const result = middlewares[i](currentEvent);
        if (result === null) {
          return null;
        }
        currentEvent = result as GridEvent<T>;
      }

      return currentEvent;
    },

    clear(): void {
      middlewares.length = 0;
    },

    size(): number {
      return middlewares.length;
    },

    has(middleware: EventMiddleware): boolean {
      return middlewares.includes(middleware);
    },
  };
}
