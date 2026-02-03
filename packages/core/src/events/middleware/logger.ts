/**
 * Logger middleware for development and debugging.
 *
 * @module @gridkit/core/events/middleware/logger
 */

import type { GridEvent, EventMiddleware } from '../types';

/**
 * Logger middleware configuration.
 */
export interface LoggerMiddlewareOptions {
  /** Enable/disable logging */
  enabled?: boolean;

  /** Log level: 'debug', 'info', 'warn', 'error' */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /** Filter events to log (regex pattern or function) */
  filter?: string | ((event: GridEvent) => boolean);

  /** Include payload in logs */
  includePayload?: boolean;

  /** Include metadata in logs */
  includeMetadata?: boolean;

  /** Custom logger function */
  logger?: (message: string, event: GridEvent) => void;
}

/**
 * Create logger middleware.
 *
 * @param options - Logger configuration
 * @returns Event middleware
 *
 * @example
 * ```typescript
 * // Basic usage
 * bus.use(createLoggerMiddleware());
 *
 * // With custom configuration
 * bus.use(createLoggerMiddleware({
 *   level: 'info',
 *   filter: /row:|column:/,
 *   includePayload: true,
 * }));
 * ```
 *
 * @public
 */
export function createLoggerMiddleware(
  options: LoggerMiddlewareOptions = {}
): EventMiddleware {
  const {
    enabled = true,
    level = 'info',
    filter,
    includePayload = false,
    includeMetadata = false,
    logger = console.log,
  } = options;

  return (event: GridEvent): GridEvent | null => {
    if (!enabled) {
      return event;
    }

    // Apply filter
    if (filter) {
      if (typeof filter === 'string') {
        const regex = new RegExp(filter);
        if (!regex.test(event.type)) {
          return event;
        }
      } else if (typeof filter === 'function') {
        if (!filter(event)) {
          return event;
        }
      }
    }

    // Format log message
    const parts = [
      `[GridKit Event] ${event.type}`,
      `(${event.namespace})`,
      `@${event.timestamp.toFixed(2)}ms`,
    ];

    if (includePayload && event.payload) {
      parts.push(`payload: ${JSON.stringify(event.payload, null, 2)}`);
    }

    if (includeMetadata && event.metadata) {
      parts.push(`metadata: ${JSON.stringify(event.metadata, null, 2)}`);
    }

    const message = parts.join(' ');

    // Log based on level
    switch (level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
      default:
        console.log(message);
    }

    // Custom logger
    if (logger !== console.log) {
      logger(message, event);
    }

    return event;
  };
}

/**
 * Simple console logger for quick debugging.
 *
 * @returns Event middleware
 *
 * @public
 */
export function simpleLogger(): EventMiddleware {
  return (event: GridEvent): GridEvent | null => {
    console.log(`[Event] ${event.type}:`, event.payload);
    return event;
  };
}
