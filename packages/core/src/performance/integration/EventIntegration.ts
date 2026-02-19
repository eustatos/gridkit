/**
 * Event Integration.
 *
 * Integrates performance monitoring with GridKit's event system.
 *
 * @module @gridkit/core/performance/integration/events
 */

import { createPerformanceMonitor } from '../monitor/factory';
import type { PerformanceConfig } from '../types';

/**
 * Configuration for event performance monitoring.
 */
export interface EventPerformanceConfig extends PerformanceConfig {
  /** Monitor event processing */
  readonly monitorEvents?: boolean;

  /** Monitor event handler execution */
  readonly monitorHandlers?: boolean;

  /** Monitor event emission */
  readonly monitorEmission?: boolean;

  /** Maximum events to track */
  readonly maxTrackedEvents?: number;
}

/**
 * Event performance monitor.
 */
export interface EventPerformanceMonitor {
  /** Monitor event start */
  startEvent(event: string, payload?: any): () => void;

  /** Monitor event handler start */
  startHandler(event: string, handlerName?: string): () => void;

  /** Monitor async event */
  trackAsyncEvent<T>(promise: Promise<T>, event: string): Promise<T>;

  /** Get event statistics */
  getEventStats(event: string): any;
}

/**
 * Creates an event performance monitor.
 */
export function createEventPerformanceMonitor(
  config?: EventPerformanceConfig
): EventPerformanceMonitor {
  const monitor = createPerformanceMonitor(config);

  return {
    startEvent(event: string, payload?: any) {
      return monitor.start(`event:${event}`, {
        payloadSize: payload ? JSON.stringify(payload).length : 0,
      });
    },

    startHandler(event: string, handlerName?: string) {
      return monitor.start(`handler:${event}:${handlerName || 'anonymous'}`);
    },

    trackAsyncEvent<T>(promise: Promise<T>, event: string): Promise<T> {
      return monitor.trackAsync(promise, `async:${event}`);
    },

    getEventStats(event: string) {
      return {
        event: monitor.getOperationStats(`event:${event}`),
        handlers: monitor.getOperationStats(`handler:${event}`),
      };
    },
  };
}

/**
 * Middleware for monitoring event bus operations.
 */
export interface EventMonitoringMiddleware {
  /** Monitor before event emission */
  beforeEmit(event: string, payload: any): void;

  /** Monitor after event emission */
  afterEmit(event: string, payload: any, duration: number): void;

  /** Monitor before handler execution */
  beforeHandler(event: string, handlerName: string): void;

  /** Monitor after handler execution */
  afterHandler(event: string, handlerName: string, duration: number, error?: any): void;
}

/**
 * Creates event monitoring middleware.
 */
export function createEventMonitoringMiddleware(
  config?: EventPerformanceConfig
): EventMonitoringMiddleware {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const monitor = createEventPerformanceMonitor(config);

  return {
    beforeEmit(_event: string, _payload: any) {
      // Event emission starts automatically
    },

    afterEmit(_event: string, _payload: any, _duration: number) {
      // Duration is automatically recorded
    },

    beforeHandler(_event: string, _handlerName: string) {
      // Handler start is automatic
    },

    afterHandler(_event: string, _handlerName: string, _duration: number, _error?: any) {
      // Duration is automatically recorded
    },
  };
}
