/**
 * Enhanced Event Bus
 * 
 * Extended event bus with enhanced middleware, event sourcing, and correlation
 * tracking for GridKit's enterprise event system.
 * 
 * @module @gridkit/core/events/EnhancedEventBus
 */

import type { EnhancedMiddleware, EnhancedMiddlewareFunction } from '@/events/middleware/enhanced/types';
import type { EnhancedGridEvent, EnhancedTableEvent, EnhancedTableSnapshot, EnhancedReplayOptions, EnhancedEventStoreOptions } from '@/events/types/enhanced';
import { EventBus } from './EventBus';
import { EventStore, createEventStore } from './sourcing/EventStore';
import { CorrelationManager, createCorrelationManager } from './correlation/CorrelationManager';
import type { MiddlewareContext } from '@/events/types/enhanced';
import type { EventMiddleware } from '@/events/types';

// ===================================================================
// Internal Middleware Interface
// ===================================================================

/**
 * Internal middleware wrapper for enhanced bus
 */
interface InternalMiddleware {
  middleware: EnhancedMiddleware;
  priority: number;
}

// ===================================================================
// Enhanced Event Bus
// ===================================================================

/**
 * Enhanced event bus with middleware, event sourcing, and correlation support
 */
export class EnhancedEventBus extends EventBus {
  private middlewares: InternalMiddleware[] = [];
  private eventStore?: EventStore;
  private correlationManager?: CorrelationManager;
  private nextEventId = 0;
  private eventCount = 0;

  constructor(options?: {
    eventStore?: EnhancedEventStoreOptions;
    correlationManager?: boolean;
  }) {
    super();

    // Initialize event store if enabled
    if (options?.eventStore) {
      this.enableEventSourcing(options.eventStore);
    }

    // Initialize correlation manager if enabled
    if (options?.correlationManager) {
      this.enableCorrelationTracking();
    }
  }

  // ===================================================================
  // Middleware Management
  // ===================================================================

  /**
   * Add middleware to the bus
   * 
   * @param middlewares - Middleware(s) to add
   * @returns This bus for chaining
   */
  use(...middlewares: (EnhancedMiddleware | EnhancedMiddlewareFunction | EventMiddleware)[]): () => void {
    // Track removal functions from parent class for EventMiddleware
    const parentRemovals: (() => void)[] = [];
    
    const result: (() => void)[] = [];
    for (const middleware of middlewares) {
      // Check if this is a basic EventMiddleware (non-enhanced)
      if (!('name' in middleware || typeof middleware === 'function')) {
        // Use parent's use method for basic middleware
        parentRemovals.push(super.use(middleware as EventMiddleware));
        continue;
      }
      
      // Check if this is a function-based middleware
      if (typeof middleware === 'function') {
        const wrappedMiddleware = this.createWrappedMiddleware(middleware as EnhancedMiddlewareFunction);
        const wrappedMiddlewareWithPriority: InternalMiddleware = {
          middleware: wrappedMiddleware,
          priority: wrappedMiddleware.priority ?? 500,
        };

        // Insert in sorted order by priority
        const index = this.middlewares.findIndex((m) => m.priority > wrappedMiddlewareWithPriority.priority);
        if (index === -1) {
          this.middlewares.push(wrappedMiddlewareWithPriority);
        } else {
          this.middlewares.splice(index, 0, wrappedMiddlewareWithPriority);
        }
        continue;
      }
      
      const wrappedMiddleware: InternalMiddleware = {
        middleware: middleware as EnhancedMiddleware,
        priority: (middleware as EnhancedMiddleware).priority ?? 500,
      };

      // Insert in sorted order by priority
      const index = this.middlewares.findIndex((m) => m.priority > wrappedMiddleware.priority);
      if (index === -1) {
        this.middlewares.push(wrappedMiddleware);
      } else {
        this.middlewares.splice(index, 0, wrappedMiddleware);
      }
    }

    // Initialize middleware
    this.middlewares.forEach(async (m) => {
      await m.middleware.initialize?.();
    });

    return () => {
      this.clear();
    };
  }

  /**
   * Remove middleware by name
   * 
   * @param name - Middleware name
   * @returns true if middleware was removed
   */
  removeMiddleware(name: string): boolean {
    const index = this.middlewares.findIndex((m) => m.middleware.name === name);
    if (index === -1) return false;

    // Destroy middleware
    this.middlewares[index].middleware.destroy?.();

    this.middlewares.splice(index, 1);
    return true;
  }

  /**
   * Get all middlewares
   * 
   * @returns Array of middlewares
   */
  getMiddlewares(): EnhancedMiddleware[] {
    return this.middlewares.map((m) => m.middleware);
  }

  /**
   * Create wrapped middleware for function-based middleware
   */
  private createWrappedMiddleware(fn: EnhancedMiddlewareFunction): EnhancedMiddleware {
    return {
      name: 'anonymous',
      version: '1.0.0',
      priority: 500,
      async handle(event, context) {
        return await fn(event, context);
      },
    };
  }

  // ===================================================================
  // Event Sourcing
  // ===================================================================

  /**
   * Enable event sourcing
   * 
   * @param options - Event store options
   */
  enableEventSourcing(options?: EnhancedEventStoreOptions): void {
    if (!this.eventStore) {
      this.eventStore = createEventStore(options);
    }
  }

  /**
   * Disable event sourcing
   */
  disableEventSourcing(): void {
    this.eventStore?.destroy();
    this.eventStore = undefined;
  }

  /**
   * Check if event sourcing is enabled
   * 
   * @returns true if enabled
   */
  isEventSourcingEnabled(): boolean {
    return !!this.eventStore;
  }

  /**
   * Get event store
   * 
   * @returns Event store or undefined
   */
  getEventStore(): EventStore | undefined {
    return this.eventStore;
  }

  /**
   * Replay events
   * 
   * @param options - Replay options
   */
  replay(options?: EnhancedReplayOptions): void {
    if (!this.eventStore) {
      throw new Error('Event sourcing is not enabled');
    }

    const events = this.eventStore.replay(options?.from, options?.to);
    const speed = options?.speed ?? 1;
    const pause = options?.pause ?? 0;

    // Replay events with optional delay
    let delay = 0;
    for (const event of events) {
      setTimeout(() => {
        // Extract payload from EnhancedEventPayload (data is direct property)
        const payload = (event as any).data ?? (event as any).payload ?? event;
        this.emit(event.type, payload, {
          source: (event as any).source,
          metadata: (event as any).metadata,
        });
      }, delay);

      delay += (1000 / speed) + (pause ?? 0);
    }
  }

  /**
   * Get event history
   * 
   * @param filter - Optional event filter
   * @returns Array of events
   */
  getEventHistory(filter?: (event: EnhancedTableEvent | EnhancedGridEvent) => boolean): (EnhancedTableEvent | EnhancedGridEvent)[] {
    if (!this.eventStore) {
      return [];
    }

    let events = this.eventStore.getAllEvents();

    if (filter) {
      events = events.filter(filter);
    }

    return events;
  }

  /**
   * Create snapshot
   * 
   * @param state - Current state
   * @returns Snapshot or undefined
   */
  createSnapshot(state?: Record<string, unknown>): EnhancedTableSnapshot | undefined {
    return this.eventStore?.createSnapshot(state);
  }

  /**
   * Get snapshots
   * 
   * @returns Array of snapshots
   */
  getSnapshots(): EnhancedTableSnapshot[] {
    return this.eventStore?.getSnapshots() ?? [];
  }

  // ===================================================================
  // Correlation Tracking
  // ===================================================================

  /**
   * Enable correlation tracking
   * 
   * @param options - Correlation manager options
   */
  enableCorrelationTracking(options?: any): void {
    if (!this.correlationManager) {
      this.correlationManager = createCorrelationManager(options);
    }
  }

  /**
   * Disable correlation tracking
   */
  disableCorrelationTracking(): void {
    this.correlationManager?.clearAll();
    this.correlationManager = undefined;
  }

  /**
   * Check if correlation tracking is enabled
   * 
   * @returns true if enabled
   */
  isCorrelationTrackingEnabled(): boolean {
    return !!this.correlationManager;
  }

  /**
   * Get correlation manager
   * 
   * @returns Correlation manager or undefined
   */
  getCorrelationManager(): CorrelationManager | undefined {
    return this.correlationManager;
  }

  /**
   * Create correlation ID
   * 
   * @param metadata - Optional metadata
   * @returns Correlation ID
   */
  createCorrelationId(metadata?: Record<string, unknown>): string {
    return this.correlationManager?.createCorrelation(metadata) ?? '';
  }

  /**
   * Get related events
   * 
   * @param correlationId - Correlation ID
   * @returns Array of events
   */
  getRelatedEvents(correlationId: string): (EnhancedTableEvent | EnhancedGridEvent)[] {
    return this.correlationManager?.getRelatedEvents(correlationId) ?? [];
  }

  // ===================================================================
  // Event Emission
  // ===================================================================

  /**
   * Emit an event with enhanced functionality
   */
  emit<T extends string>(
    event: T,
    payload: any,
    options?: {
      priority?: number;
      source?: string;
      metadata?: Record<string, unknown>;
      correlationId?: string;
    }
  ): void {
    // Generate event ID
    const eventId = `evt-${Date.now()}-${this.nextEventId++}`;

    // Create enhanced event
    const enhancedEvent: EnhancedGridEvent<any> = {
      type: event,
      payload: {
        data: payload,
        timestamp: Date.now(),
        source: options?.source,
        metadata: options?.metadata,
        correlationId: options?.correlationId,
      },
      timestamp: Date.now(),
      source: options?.source ?? 'unknown',
      metadata: options?.metadata,
      eventId,
      version: 1,
      priority: (typeof options?.priority === 'number' ? 'normal' : options?.priority) ?? 'normal',
    };

    // Track correlation if enabled
    if (this.correlationManager && options?.correlationId) {
      this.correlationManager.addEvent(options.correlationId, enhancedEvent);
    }

    // Store event if event sourcing enabled
    if (this.eventStore) {
      this.eventStore.append(enhancedEvent as any);
      this.eventCount++;
    }

    // Process through middlewares
    this.processWithMiddleware(enhancedEvent, options?.priority as number | undefined);

    // Emit to regular handlers (for backward compatibility)
    super.emit(event, payload, {
      priority: options?.priority,
      source: options?.source,
      metadata: options?.metadata,
    });
  }

  /**
   * Process event through middlewares
   */
  private async processWithMiddleware(
    event: EnhancedGridEvent,
    priority?: number
  ): Promise<void> {
    // Sort middlewares by priority
    const sortedMiddlewares = [...this.middlewares].sort((a, b) => a.priority - b.priority);

    // Create context
    const context: MiddlewareContext<EnhancedGridEvent> = {
      event,
      cancel: () => {
        // Set a cancelled flag on the context
        (context as any).cancelled = true;
      },
      isCancelled: () => {
        return (context as any).cancelled === true;
      },
      getCorrelationId: () => event.payload.correlationId,
      setCorrelationId: (id: string) => {
        event.payload.correlationId = id;
      },
    };

    // Execute middlewares
    for (const { middleware } of sortedMiddlewares) {
      const result = await middleware.handle(event, context);

      if (context.isCancelled() || result === null) {
        return; // Event cancelled
      }

      if (result) {
        event = result;
      }
    }
  }

  // ===================================================================
  // Statistics
  // ===================================================================

  /**
   * Get event count
   * 
   * @returns Total event count
   */
  getEventCount(): number {
    return this.eventCount;
  }

  /**
   * Clear all data
   */
  clear(): void {
    super.clear();
    this.middlewares = [];
    this.eventStore?.clear();
    this.correlationManager?.clearAll();
    this.nextEventId = 0;
    this.eventCount = 0;
  }

  /**
   * Destroy the event bus
   */
  destroy(): void {
    this.clear();
    this.middlewares.forEach((m) => m.middleware.destroy?.());
    this.middlewares = [];
    this.eventStore?.destroy();
    this.correlationManager?.clearAll();
  }
}

/**
 * Create enhanced event bus instance
 * 
 * @param options - Bus options
 * @returns Enhanced event bus instance
 */
export function createEnhancedEventBus(
  options?: {
    eventStore?: EnhancedEventStoreOptions;
    correlationManager?: boolean;
  }
): EnhancedEventBus {
  return new EnhancedEventBus(options);
}
