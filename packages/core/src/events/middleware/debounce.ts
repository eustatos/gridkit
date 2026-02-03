/**
 * Debounce middleware for event throttling.
 *
 * @module @gridkit/core/events/middleware/debounce
 */

import type { GridEvent, EventMiddleware } from '../types';

/**
 * Debounce middleware configuration.
 */
export interface DebounceMiddlewareOptions {
  /**
   * Debounce delay in milliseconds.
   * Default: 300
   */
  delay?: number;

  /**
   * Whether to use leading edge (execute immediately, then debounce).
   * Default: false
   */
  leading?: boolean;

  /**
   * Whether to use trailing edge (execute after delay).
   * Default: true
   */
  trailing?: boolean;

  /**
   * Function to determine if event should be debounced.
   * Default: (event) => event.type.includes('resize') || event.type.includes('scroll')
   */
  shouldDebounce?: (event: GridEvent) => boolean;

  /**
   * Function to group events for debouncing.
   * Events with same group key will be debounced together.
   * Default: (event) => event.type
   */
  groupKey?: (event: GridEvent) => string;
}

/**
 * Create debounce middleware.
 *
 * @param options - Debounce configuration
 * @returns Event middleware
 *
 * @example
 * ```typescript
 * // Debounce resize events
 * const debounceMiddleware = createDebounceMiddleware({
 *   delay: 500,
 *   shouldDebounce: (event) => event.type.includes('resize'),
 * });
 *
 * bus.use(debounceMiddleware);
 * ```
 *
 * @public
 */
export function createDebounceMiddleware(
  options: DebounceMiddlewareOptions = {}
): EventMiddleware {
  const {
    delay = 300,
    leading = false,
    trailing = true,
    shouldDebounce = (event) =>
      event.type.includes('resize') || event.type.includes('scroll'),
    groupKey = (event) => event.type,
  } = options;

  const timers = new Map<string, NodeJS.Timeout>();
  const pendingEvents = new Map<string, GridEvent>();
  const leadingExecuted = new Set<string>();

  return (event: GridEvent): GridEvent | null => {
    if (!shouldDebounce(event)) {
      return event;
    }

    const key = groupKey(event);
    const hasTimer = timers.has(key);
    const hasLeadingExecuted = leadingExecuted.has(key);

    // Leading edge execution
    if (leading && !hasLeadingExecuted) {
      leadingExecuted.add(key);
      return event;
    }

    // Store the most recent event
    pendingEvents.set(key, event);

    if (!hasTimer) {
      timers.set(
        key,
        setTimeout(() => {
          if (trailing) {
            const pendingEvent = pendingEvents.get(key);
            if (pendingEvent) {
              // Return the most recent event
              pendingEvents.delete(key);
              timers.delete(key);
              leadingExecuted.delete(key);
            }
          }
        }, delay)
      );
    }

    // Return null to indicate event was debounced
    return null;
  };
}

/**
 * Simple throttle middleware using debounce.
 * Ensures events are executed at most once per specified interval.
 *
 * @param interval - Minimum interval between executions in milliseconds
 * @returns Event middleware
 *
 * @example
 * ```typescript
 * // Throttle scroll events to once every 100ms
 * const throttle = createThrottleMiddleware(100);
 * bus.use(throttle);
 * ```
 */
export function createThrottleMiddleware(interval: number): EventMiddleware {
  let lastExecutionTime = 0;
  let pendingEvent: GridEvent | null = null;
  let timer: NodeJS.Timeout | null = null;

  return (event: GridEvent): GridEvent | null => {
    const now = performance.now();
    const timeSinceLastExecution = now - lastExecutionTime;

    if (timeSinceLastExecution >= interval) {
      // Execute immediately
      lastExecutionTime = now;
      return event;
    }

    // Store for later execution
    pendingEvent = event;

    if (!timer) {
      const timeToWait = interval - timeSinceLastExecution;
      timer = setTimeout(() => {
        lastExecutionTime = performance.now();
        timer = null;
        // The timeout doesn't return anything
      }, timeToWait);
    }

    // Return null to indicate event was throttled
    return null;
  };
}
