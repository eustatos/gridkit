// Base interfaces & enums for GridKit Event System

/**
 * Event priority levels for execution order control
 */
export enum EventPriority {
  IMMEDIATE = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

/**
 * Base interface for all GridKit events
 */
export interface GridEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: number;
  readonly source?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event handler function type
 */
export type EventHandler<T extends GridEvent = GridEvent<unknown>> = (event: T) => void | Promise<void>;

/**
 * Event subscription with cleanup function
 */
export interface EventSubscription {
  /**
   * Unsubscribe from the event
   */
  unsubscribe: () => void;
}