/**
 * Enhanced Middleware Types
 * 
 * Type definitions for enhanced middleware in GridKit's event system.
 * 
 * @module @gridkit/core/events/middleware/enhanced/types
 */

import type { EnhancedGridEvent, EnhancedTableEvent, EnhancedTableSnapshot, EnhancedReplayOptions, EventMapping } from '@/events/types/enhanced';

// ===================================================================
// Middleware Options
// ===================================================================

/**
 * Logging middleware options
 */
export interface LoggingMiddlewareOptions {
  /**
   * Logger function
   */
  logger?: (message: string) => void;
  /**
   * Log level filter
   */
  level?: 'all' | 'error' | 'warn' | 'info' | 'debug';
  /**
   * Include event payload in log
   */
  includePayload?: boolean;
  /**
   * Maximum payload size to log
   */
  maxPayloadSize?: number;
}

/**
 * Debounce middleware options
 */
export interface DebounceMiddlewareOptions {
  /**
   * Wait time in milliseconds
   */
  wait?: number;
  /**
   * Leading edge execution
   */
  leading?: boolean;
  /**
   * Trailing edge execution
   */
  trailing?: boolean;
  /**
   * Debounce by event type or full event
   */
  debounceBy?: 'type' | 'event';
}

/**
 * Throttle middleware options
 */
export interface ThrottleMiddlewareOptions {
  /**
   * Wait time in milliseconds
   */
  wait?: number;
  /**
   * Leading edge execution
   */
  leading?: boolean;
  /**
   * Trailing edge execution
   */
  trailing?: boolean;
  /**
   * Throttle by event type or full event
   */
  throttleBy?: 'type' | 'event';
}

/**
 * Validation middleware options
 */
export interface ValidationMiddlewareOptions<T = unknown> {
  /**
   * Schema validation function
   */
  schema?: (payload: T) => boolean;
  /**
   * Custom validator function
   */
  validate?: (event: EnhancedGridEvent<T>) => boolean;
  /**
   * Action on validation failure
   */
  onInvalid?: 'cancel' | 'log' | 'report';
  /**
   * Report invalid events
   */
  report?: (event: EnhancedGridEvent<T>, error: string) => void;
}

/**
 * Analytics middleware options
 */
export interface AnalyticsMiddlewareOptions {
  /**
   * Analytics provider name
   */
  provider?: 'mixpanel' | 'amplitude' | 'ga' | 'custom';
  /**
   * Event mappings
   */
  eventMap?: Array<{
    gridEvent: string;
    analyticsEvent: string;
    transform?: (payload: unknown) => unknown;
  }>;
  /**
   * User identifier
   */
  userId?: string;
  /**
   * Track all events
   */
  trackAll?: boolean;
  /**
   * Custom analytics track function
   */
  track?: (event: string, properties?: unknown) => void;
}

/**
 * Correlation middleware options
 */
export interface CorrelationMiddlewareOptions {
  /**
   * Generate correlation ID for each event
   */
  generateCorrelationId?: boolean;
  /**
   * Correlation ID header name
   */
  correlationHeader?: string;
  /**
   * Correlation ID generator function
   */
  generateId?: () => string;
}

/**
 * Middleware context for enhanced middleware
 */
export interface MiddlewareContext<T extends EnhancedGridEvent = EnhancedGridEvent> {
  /**
   * Current event
   */
  event: T;
  /**
   * Cancel the event
   */
  cancel: () => void;
  /**
   * Check if event is cancelled
   */
  isCancelled: () => boolean;
  /**
   * Get correlation ID
   */
  getCorrelationId: () => string | undefined;
  /**
   * Set correlation ID
   */
  setCorrelationId: (id: string) => void;
}

// ===================================================================
// Enhanced Middleware Interface
// ===================================================================

/**
 * Enhanced middleware interface with initialization and cleanup
 */
export interface EnhancedMiddleware<T extends EnhancedGridEvent = EnhancedGridEvent> {
  /**
   * Middleware name
   */
  name: string;
  /**
   * Middleware version
   */
  version: string;
  /**
   * Middleware priority (lower = executed first)
   */
  priority?: number;
  /**
   * Initialize middleware
   */
  initialize?(): Promise<void>;
  /**
   * Handle event
   */
  handle(event: T, context: MiddlewareContext<T>): Promise<T | null>;
  /**
   * Destroy middleware
   */
  destroy?(): Promise<void>;
}

/**
 * Async middleware function
 */
export type EnhancedMiddlewareFunction<T extends EnhancedGridEvent = EnhancedGridEvent> = (
  event: T,
  context: MiddlewareContext<T>
) => Promise<T | null>;

// Re-export types from enhanced
export type { EnhancedGridEvent, EnhancedTableEvent, EnhancedTableSnapshot, EnhancedReplayOptions, EventMapping } from '@/events/types/enhanced';
