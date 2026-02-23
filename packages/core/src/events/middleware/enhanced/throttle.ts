/**
 * Throttle Middleware
 * 
 * Throttles events to ensure they don't fire too frequently.
 * 
 * @module @gridkit/core/events/middleware/enhanced/throttle
 */

import type { EnhancedMiddleware, ThrottleMiddlewareOptions } from './types';

/**
 * Create throttle middleware
 * 
 * @param options - Throttle options
 * @returns Throttle middleware
 */
export function createThrottleMiddleware(
  options: ThrottleMiddlewareOptions = {}
): EnhancedMiddleware {
  const {
    wait = 300,
    leading = true,
    trailing = true,
    throttleBy = 'type',
  } = options;

  let lastExecuted = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingEvent: any = null;

  return {
    name: 'throttle',
    version: '1.0.0',
    priority: 100,

    async handle(event, context) {
      const now = Date.now();

      // Handle leading edge
      if (leading && now - lastExecuted >= wait) {
        lastExecuted = now;
        return event;
      }

      // If already throttling, track pending event
      if (trailing) {
        pendingEvent = event;

        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            timeoutId = null;
            const now = Date.now();

            // Handle trailing edge
            if (trailing && now - lastExecuted >= wait && pendingEvent) {
              lastExecuted = now;
              const eventToExecute = pendingEvent;
              pendingEvent = null;

              // Re-process the event
              context.event = eventToExecute;
              return eventToExecute;
            }
          }, wait);
        }
      }

      // Cancel current event
      return null;
    },

    async destroy() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingEvent = null;
    },
  };
}
