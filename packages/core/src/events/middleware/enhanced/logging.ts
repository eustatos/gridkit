/**
 * Logging Middleware
 * 
 * Logs all events passing through the event bus with configurable options.
 * 
 * @module @gridkit/core/events/middleware/enhanced/logging
 */

import type { EnhancedMiddleware, LoggingMiddlewareOptions } from './types';
import { EventPriority } from '@/events/types';
import type { EnhancedGridEvent } from '@/events/types/enhanced';

/**
 * Create logging middleware
 * 
 * @param options - Logging options
 * @returns Logging middleware
 */
export function createLoggingMiddleware(
  options: LoggingMiddlewareOptions = {}
): EnhancedMiddleware {
  const {
    logger = console.log,
    level = 'all',
    includePayload = false,
    maxPayloadSize = 1000,
  } = options;

  const levels = ['debug', 'info', 'warn', 'error'] as const;
  const levelPriority: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

  return {
    name: 'logging',
    version: '1.0.0',
    priority: 1000, // Run last for logging

    async handle(event, context) {
      const shouldLog = level === 'all' || level === 'error' || level === 'warn' || level === 'info' || level === 'debug';

      if (!shouldLog) {
        return event;
      }

      // Format payload for logging
      let payloadStr = 'null';
      if (includePayload && event.payload) {
        try {
          const payload = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload);
          payloadStr = payload.length > maxPayloadSize 
            ? payload.substring(0, maxPayloadSize) + '...' 
            : payload;
        } catch {
          payloadStr = '[Non-serializable payload]';
        }
      }

      // Determine log level based on event type or error
      // Check for error in the data property of EnhancedEventPayload
      const payloadData = (event.payload as any).data ?? event.payload;
      const isError = (payloadData as any)?.error || event.type.includes('error') || event.type.includes('fail');
      const isWarning = event.type.includes('warn') || event.type.includes('slow');
      
      let logMethod = logger;
      if (level !== 'all') {
        if (isError && (level === 'error' || level === 'warn' || level === 'info')) {
          logMethod = console.error;
        } else if (isWarning && (level === 'warn' || level === 'info')) {
          logMethod = console.warn;
        } else if (level === 'info' || level === 'debug') {
          logMethod = console.log;
        }
      }

      logMethod(
        `[GridKit Event] ${event.type} | ` +
        `Timestamp: ${event.timestamp} | ` +
        `Source: ${event.source || 'unknown'} | ` +
        `Priority: ${event.priority || EventPriority.NORMAL} | ` +
        `Payload: ${payloadStr}`
      );

      return event;
    },
  };
}
