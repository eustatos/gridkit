/**
 * Throttle middleware for rate-limiting events.
 *
 * @module @gridkit/core/events/middleware/throttle
 */

import type { GridEvent, EventMiddleware } from '../types';

/**
 * Throttle middleware configuration.
 */
export interface ThrottleMiddlewareOptions {
  /**
   * Minimum interval between events in milliseconds.
   * Default: 1000
   */
  interval?: number;

  /**
   * Function to determine if event should be throttled.
   * Default: (event) => event.type.includes('scroll') || event.type.includes('mousemove')
   */
  shouldThrottle?: (event: GridEvent) => boolean;

  /**
   * Function to group events for throttling.
   * Events with same group key will be throttled independently.
   * Default: (event) => event.type
   */
  groupKey?: (event: GridEvent) => string;

  /**
   * Whether to execute the first event immediately.
   * Default: true
   */
  leading?: boolean;

  /**
   * Whether to execute the last event after interval.
   * Default: true
   */
  trailing?: boolean;
}

/**
 * Create throttle middleware.
 *
 * @param options - Throttle configuration
 * @returns Event middleware
 *
 * @example
 * ```typescript
 * // Throttle scroll events to once per 500ms
 * const throttleMiddleware = createThrottleMiddleware({
 *   interval: 500,
 *   shouldThrottle: (event) => event.type.includes('scroll'),
 * });
 *
 * bus.use(throttleMiddleware);
 * ```
 *
 * @public
 */
export function createThrottleMiddleware(
  options: ThrottleMiddlewareOptions = {}
): EventMiddleware {
  const {
    interval = 1000,
    shouldThrottle = (event) =>
      event.type.includes('scroll') || event.type.includes('mousemove'),
    groupKey = (event) => event.type,
    leading = true,
    trailing = true,
  } = options;

  const lastExecutionTimes = new Map<string, number>();
  const pendingEvents = new Map<string, GridEvent>();
  const timers = new Map<string, NodeJS.Timeout>();

  const executePending = (key: string) => {
    const pendingEvent = pendingEvents.get(key);
    if (pendingEvent) {
      pendingEvents.delete(key);
      timers.delete(key);
      return pendingEvent;
    }
    return null;
  };

  return (event: GridEvent): GridEvent | null => {
    if (!shouldThrottle(event)) {
      return event;
    }

    const key = groupKey(event);
    const now = performance.now();
    const lastExecutionTime = lastExecutionTimes.get(key) || 0;
    const timeSinceLastExecution = now - lastExecutionTime;

    // Check if we can execute immediately
    if (timeSinceLastExecution >= interval) {
      if (leading) {
        // Leading execution
        lastExecutionTimes.set(key, now);
        return event;
      }
    }

    // Store for potential trailing execution
    if (trailing) {
      pendingEvents.set(key, event);
    }

    // Schedule trailing execution if not already scheduled
    if (!timers.has(key) && trailing) {
      const timeToWait = interval - timeSinceLastExecution;
      timers.set(
        key,
        setTimeout(
          () => {
            lastExecutionTimes.set(key, performance.now());
            const result = executePending(key);
            if (result) {
              // Return throttled event
              return result;
            }
          },
          Math.max(0, timeToWait)
        )
      );
    }

    // Return null to indicate event was throttled
    return null;
  };
}

/**
 * Simple rate limiter middleware.
 * Limits events to a maximum number per time window.
 *
 * @param limit - Maximum number of events
 * @param windowMs - Time window in milliseconds
 * @returns Event middleware
 *
 * @example
 * ```typescript
 * // Limit to 10 events per second
 * const rateLimit = createRateLimitMiddleware(10, 1000);
 * bus.use(rateLimit);
 * ```
 *
 * @public
 */
export function createRateLimitMiddleware(
  limit: number,
  windowMs: number
): EventMiddleware {
  const eventCounts = new Map<string, number>();
  const resetTimes = new Map<string, number>();

  return (event: GridEvent): GridEvent | null => {
    const key = event.type;
    const now = performance.now();
    const resetTime = resetTimes.get(key) || 0;

    // Reset counter if window has passed
    if (now >= resetTime) {
      eventCounts.set(key, 1);
      resetTimes.set(key, now + windowMs);
      return event;
    }

    // Check if limit reached
    const count = eventCounts.get(key) || 0;
    if (count >= limit) {
      // Event is rate-limited
      return null;
    }

    // Increment counter and allow event
    eventCounts.set(key, count + 1);
    return event;
  };
}
