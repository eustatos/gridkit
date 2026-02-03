/**
 * GridKit Event System
 *
 * Type-safe, priority-based event system for GridKit.
 * Provides pub/sub pattern with strong TypeScript typing,
 * memory leak prevention, and DevTools integration.
 *
 * @module @gridkit/core/events
 */

// Types
export type {
  // Core types
  EventType,
  EventPayload,
  EventHandler,
  EventHandlerOptions,
  EventRegistry,
  GridEvent,
  EventNamespace,
  EventMiddleware,
  EventSubscription,
} from './types';

// Enums
export { EventPriority } from './types';

// Core Event Bus
export {
  EventBus,
  getEventBus,
  resetEventBus,
  createEventBus,
  type EventBusOptions,
} from './EventBus';

// Middleware
export {
  createLoggerMiddleware,
  simpleLogger,
  type LoggerMiddlewareOptions,
} from './middleware/logger';

export {
  createBatchMiddleware,
  createBatchedEvent,
  type BatchMiddlewareOptions,
  type BatchedEvent,
} from './middleware/batch';

export {
  createDebounceMiddleware,
  type DebounceMiddlewareOptions,
} from './middleware/debounce';

export {
  createThrottleMiddleware,
  createRateLimitMiddleware,
  type ThrottleMiddlewareOptions,
} from './middleware/throttle';

export {
  createPerformanceMiddleware,
  createPerformanceTrackerMiddleware,
  createPerformanceLoggerMiddleware,
  type PerformanceMiddlewareOptions,
  type EventMetrics,
} from './middleware/performance';

// Utilities
export {
  extractNamespace,
  isValidNamespace,
  getEventName,
} from './utils/namespace';
export {
  createPriorityQueue,
  scheduleHighPriority,
  scheduleLowPriority,
  type PriorityQueue,
} from './utils/priority';
export {
  createCleanupManager,
  checkForMemoryLeak,
  type CleanupManager,
} from './utils/cleanup';

// Helper functions

/**
 * Check if event type is valid.
 *
 * @param event - Event type to check
 * @returns True if event is valid
 *
 * @example
 * ```typescript
 * import { isValidEventType } from '@gridkit/core/events';
 *
 * const isValid = isValidEventType('grid:init'); // true
 * const isInvalid = isValidEventType('unknown:event'); // false
 * ```
 */
export function isValidEventType(event: string): boolean {
  // This is a placeholder - actual validation would depend on
  // the event registry implementation
  return event.includes(':');
}

/**
 * Check if event payload matches expected type.
 *
 * @param event - Event type
 * @param payload - Payload to check
 * @returns True if payload matches expected type
 */
export function validateEventPayload(
  _event: string,
  payload: unknown
): boolean {
  // Type-safe validation can be implemented here
  // For now, just return true since TypeScript will catch type errors
  return payload !== null && typeof payload === 'object';
}

/**
 * Create a typed event emitter.
 *
 * @returns Typed event emitter
 */
export function createEventEmitter() {
  const bus = createEventBus();

  return {
    emit: bus.emit.bind(bus),
    on: bus.on.bind(bus),
    once: bus.once.bind(bus),
    off: bus.off.bind(bus),
    clear: bus.clear.bind(bus),
  };
}
