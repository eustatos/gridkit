// Unified type exports for GridKit Event System
// Implements CORE-005C requirement for extended event types

// Re-export from existing type files
export * from './types/base';
export * from './types/registry';

// Additional types needed for EventBus implementation

/**
 * Event handler options
 */
export interface EventHandlerOptions {
  priority?: EventPriority;
  once?: boolean;
  filter?: (event: GridEvent) => boolean;
  debounce?: number;
  throttle?: number;
}

/**
 * Event middleware function
 * Can modify, cancel, or pass through events
 */
export type EventMiddleware = (event: GridEvent) => GridEvent | null;

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

/**
 * Event subscription handle
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Error thrown when an event is cancelled.
 */
export class EventCancelledError extends Error {
  /** The event that was cancelled */
  public readonly event: GridEvent;

  /** Reason for cancellation */
  public readonly reason?: string;

  constructor(event: GridEvent, reason?: string) {
    super(`Event '${event.type}' was cancelled${reason ? `: ${reason}` : ''}`);
    this.name = 'EventCancelledError';
    this.event = event;
    this.reason = reason;
  }
}

/**
 * Event cancellation interface.
 * Passed to event listeners to allow cancellation.
 */
export interface EventCancellation {
  /**
   * Cancel the event with optional reason.
   *
   * @param reason - Reason for cancellation
   * @throws {Error} If event is not cancelable
   */
  cancel(reason?: string): void;

  /** Whether the event has been cancelled */
  readonly cancelled: boolean;
}