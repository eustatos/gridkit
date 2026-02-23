/**
 * Enhanced Middleware System
 * 
 * Enhanced middleware interfaces and factory functions for GridKit's
 * enterprise event system.
 * 
 * @module @gridkit/core/events/middleware/enhanced
 */

export type {
  EnhancedMiddleware,
  EnhancedMiddlewareFunction,
  MiddlewareContext,
  LoggingMiddlewareOptions,
  DebounceMiddlewareOptions,
  ThrottleMiddlewareOptions,
  ValidationMiddlewareOptions,
  AnalyticsMiddlewareOptions,
  EnhancedGridEvent,
  EnhancedTableEvent,
  EnhancedTableSnapshot,
  EnhancedReplayOptions,
  EventMapping,
} from './types';

// Factory functions
export { createLoggingMiddleware } from './logging';
export { createDebounceMiddleware } from './debounce';
export { createThrottleMiddleware } from './throttle';
export { createValidationMiddleware } from './validation';
export { createAnalyticsMiddleware } from './analytics';
