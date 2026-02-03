/**
 * Performance monitoring middleware.
 *
 * @module @gridkit/core/events/middleware/performance
 */

import type { GridEvent, EventMiddleware } from '../types';

/**
 * Performance metrics for an event.
 */
export interface EventMetrics {
  /** Event type */
  type: string;
  /** Timestamp when event was emitted */
  startTime: number;
  /** Timestamp when all handlers completed */
  endTime: number;
  /** Total duration in milliseconds */
  duration: number;
  /** Number of handlers executed */
  handlerCount: number;
  /** Whether event was canceled */
  canceled: boolean;
}

/**
 * Performance middleware configuration.
 */
export interface PerformanceMiddlewareOptions {
  /** Enable/disable performance monitoring */
  enabled?: boolean;

  /** Minimum duration to log (in milliseconds) */
  threshold?: number;

  /** Function to call with performance metrics */
  onMetrics?: (metrics: EventMetrics) => void;

  /** Filter which events to monitor */
  filter?: (event: GridEvent) => boolean;
}

/**
 * Create performance middleware.
 *
 * @param options - Performance configuration
 * @returns Event middleware
 *
 * @example
 * ```typescript
 * const performanceMiddleware = createPerformanceMiddleware({
 *   threshold: 50, // Log events taking > 50ms
 *   onMetrics: (metrics) => console.log('Performance:', metrics),
 * });
 *
 * bus.use(performanceMiddleware);
 * ```
 *
 * @public
 */
export function createPerformanceMiddleware(
  options: PerformanceMiddlewareOptions = {}
): EventMiddleware {
  const {
    enabled = true,
    threshold = 0,
    onMetrics,
    filter = () => true,
  } = options;

  return (event: GridEvent): GridEvent => {
    if (!enabled || !filter(event)) {
      return event;
    }

    const startTime = performance.now();
    let handlerCount = 0;
    let canceled = false;

    // Return a proxy to track handler execution
    const proxy = new Proxy(event, {
      get(target, prop) {
        if (prop === 'canceled') {
          canceled = true;
        }
        return Reflect.get(target, prop);
      },
    });

    // Schedule metrics collection
    queueMicrotask(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration >= threshold && onMetrics) {
        onMetrics({
          type: event.type,
          startTime,
          endTime,
          duration,
          handlerCount,
          canceled,
        });
      }
    });

    return proxy;
  };
}

/**
 * Simple performance tracker middleware.
 * Just tracks execution time without complex metrics.
 *
 * @returns Event middleware
 *
 * @public
 */
export function createPerformanceTrackerMiddleware(): EventMiddleware {
  return (event: GridEvent): GridEvent => {
    const startTime = performance.now();

    // Return proxy to track completion
    return new Proxy(event, {
      get(target, prop) {
        if (prop === 'duration') {
          return performance.now() - startTime;
        }
        return Reflect.get(target, prop);
      },
    });
  };
}

/**
 * Performance logger middleware.
 * Logs slow events to console.
 *
 * @param threshold - Log events slower than this (in ms)
 * @returns Event middleware
 *
 * @public
 */
export function createPerformanceLoggerMiddleware(
  threshold: number = 100
): EventMiddleware {
  return (event: GridEvent): GridEvent => {
    const startTime = performance.now();
    let handlerCount = 0;

    // Track handler count
    const originalEvent = event;
    const proxy = new Proxy(event, {
      get(target, prop) {
        if (prop === 'handlerCount') {
          handlerCount++;
        }
        return Reflect.get(target, prop);
      },
    });

    // Check performance
    queueMicrotask(() => {
      const duration = performance.now() - startTime;
      if (duration >= threshold) {
        console.warn(`Slow event detected: ${event.type}`, {
          duration,
          handlerCount,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return proxy;
  };
}
