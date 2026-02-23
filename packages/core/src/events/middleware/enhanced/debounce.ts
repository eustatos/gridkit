/**
 * Debounce Middleware
 * 
 * Debounces events to reduce rapid-fire event emissions.
 * 
 * @module @gridkit/core/events/middleware/enhanced/debounce
 */

import type { EnhancedMiddleware, DebounceMiddlewareOptions } from './types';

/**
 * Create debounce middleware
 * 
 * @param options - Debounce options
 * @returns Debounce middleware
 */
export function createDebounceMiddleware(
  options: DebounceMiddlewareOptions = {}
): EnhancedMiddleware {
  const {
    wait = 300,
    leading = false,
    trailing = true,
    debounceBy = 'type',
  } = options;

  const timers = new Map<string, NodeJS.Timeout>();
  const leadingExecuted = new Set<string>();
  const pendingEvents = new Map<string, any>();

  return {
    name: 'debounce',
    version: '1.0.0',
    priority: 100,

    async handle(event, context) {
      // Get the actual payload data
      const payloadData = event.payload?.data;
      const key = debounceBy === 'type' 
        ? event.type 
        : `${event.type}:${(payloadData as any)?.id || (payloadData as any)?.rowId || 'unknown'}`;

      // Clear existing timer
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
      }

      // Handle leading edge
      if (leading && !leadingExecuted.has(key)) {
        leadingExecuted.add(key);
        return event;
      }

      // Store pending event
      pendingEvents.set(key, event);

      // Set up new timer
      const timer = setTimeout(() => {
        timers.delete(key);
        leadingExecuted.delete(key);

        // Execute trailing event
        if (trailing && pendingEvents.has(key)) {
          const pendingEvent = pendingEvents.get(key);
          pendingEvents.delete(key);
          
          // Re-process the event (skip this middleware on re-emit)
          context.event = pendingEvent;
          return pendingEvent;
        }
      }, wait);

      timers.set(key, timer);

      // Cancel current event (will be re-emitted after delay)
      return null;
    },

    async destroy() {
      // Clear all timers on destruction
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      leadingExecuted.clear();
      pendingEvents.clear();
    },
  };
}
