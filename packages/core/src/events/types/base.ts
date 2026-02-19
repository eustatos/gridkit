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
 * Event handler options
 */
export interface EventHandlerOptions {
  /**
   * Priority level for this handler
   */
  priority?: EventPriority;
  /**
   * Only execute once
   */
  once?: boolean;
  /**
   * Filter condition
   */
  filter?: (event: GridEvent) => boolean;
}

/**
 * Event middleware function type
 */
export type EventMiddleware<T extends GridEvent = GridEvent> = (event: T) => T | null;

/**
 * Event handler function type
 */
export type EventHandler<T extends GridEvent = GridEvent<unknown>> = (event: T) => void | Promise<void>;

/**
 * Event subscription handle
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Type helper for event types (string literals)
 * Used for general event type definitions
 */
export type EventType = string;

/**
 * Type helper for event payloads
 * @template T - Event type string
 */
export type EventPayload<T extends EventType = string> = T extends `${string}:${string}`
  ? Record<string, unknown>
  : unknown;

/**
 * Event namespace aligned with core architecture
 */
export type EventNamespace =
  | 'grid'
  | 'column'
  | 'column-group'
  | 'row'
  | 'cell'
  | 'selection'
  | 'virtualization'
  | 'sorting'
  | 'filtering'
  | 'validation'
  | 'config'
  | 'plugin'
  | 'state'
  | 'data'
  | 'custom';
