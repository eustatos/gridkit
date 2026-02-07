import type {
  EventType,
  EventPayload,
  EventHandlerOptions,
  GridEvent,
  EventMiddleware,
  EventHandler,
} from './types';
import { EventPriority } from './types/base';
import { createCleanupManager, type CleanupManager } from './utils/cleanup';
import { createPriorityQueue, type PriorityQueue } from './utils/priority';

/**
 * Handler entry with metadata
 */
interface HandlerEntry<T extends EventType> {
  handler: EventHandler<GridEvent<EventPayload<T>>>;
  options: EventHandlerOptions;
  id: number;
  addedAt: number;
  priority: EventPriority;
}

/**
 * Optimized event bus statistics
 */
interface EventBusStats {
  totalEvents: number;
  totalHandlers: number;
  eventCounts: Map<string, number>;
  avgExecutionTime: Map<string, number>;
}

/**
 * Performance-optimized event bus implementation
 */
export class EventBus {
  private handlers = new Map<string, HandlerEntry<EventType>[]>();
  private handlerIdMap = new Map<number, HandlerEntry<EventType>>();
  private middlewares: EventMiddleware[] = [];
  private priorityQueue: PriorityQueue;
  private cleanupManager: CleanupManager;
  private isProcessing = false;
  private stats: EventBusStats;
  private devMode: boolean;
  private flushScheduled = false;
  private nextHandlerId = 1;
  private immediateEvents: Array<() => void> = [];
  private immediateProcessing = false;
  private scheduledFlush = false;

  // Cache for common operations
  private emptyArray: HandlerEntry<EventType>[] = [];
  constructor(options: { devMode?: boolean } = {}) {
    this.priorityQueue = createPriorityQueue();
    this.cleanupManager = createCleanupManager();
    this.devMode = options.devMode ?? false;
    this.stats = {
      totalEvents: 0,
      totalHandlers: 0,
      eventCounts: new Map(),
      avgExecutionTime: new Map(),
    };
  }

  /**
   * Subscribe to an event with performance optimizations
   */
  on<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>,
    options: EventHandlerOptions = {}
  ): () => void {
    const id = this.nextHandlerId++;
    const entry: HandlerEntry<T> = {
      handler,
      options,
      id,
      addedAt: performance.now(),
      priority: options.priority ?? EventPriority.NORMAL,
    };

    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = [];
      this.handlers.set(event, handlers);
    }

    // Insert handler in priority order (lower number = higher priority)
    // If priorities are equal, maintain insertion order (FIFO)
    const insertIndex = handlers.findIndex((h) => h.priority > entry.priority);

    if (insertIndex === -1) {
      handlers.push(entry as HandlerEntry<EventType>);
    } else {
      handlers.splice(insertIndex, 0, entry as HandlerEntry<EventType>);
    }

    this.handlerIdMap.set(id, entry as HandlerEntry<EventType>);
    this.stats.totalHandlers++;

    // Optimized cleanup tracking
    this.cleanupManager.track(id, () => {
      if (this.handlerIdMap.has(id)) {
        this.removeHandler(event, id);
      }
    });

    // Return optimized unsubscribe function
    return () => {
      if (this.handlerIdMap.has(id)) {
        this.removeHandler(event, id);
      }
    };
  }

  /**
   * Subscribe to event once
   */
  once<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): () => void {
    return this.on(event, handler, { once: true });
  }

  /**
   * Unsubscribe from event - optimized version
   */
  off<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Fast path for small arrays
    if (handlers.length <= 10) {
      for (let i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i].handler === handler) {
          this.removeHandlerAtIndex(event, i);
          break;
        }
      }
    } else {
      // For larger arrays, use indexOf
      const index = handlers.findIndex((entry) => entry.handler === handler);
      if (index !== -1) {
        this.removeHandlerAtIndex(event, index);
      }
    }
  }

  /**
   * High-performance emit with optimizations
   */
  emit<T extends EventType>(
    event: T,
    payload: EventPayload<T>,
    options?: {
      priority?: EventPriority;
      source?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    // Quick check for cancelled events
    this.stats.totalEvents++;
    this.stats.eventCounts.set(
      event,
      (this.stats.eventCounts.get(event) || 0) + 1
    );

    const priority = options?.priority ?? EventPriority.NORMAL;

    // Fast path for IMMEDIATE priority - execute synchronously
    if (priority === EventPriority.IMMEDIATE) {
      const gridEvent = this.createEvent(event, payload, options);
      const processedEvent = this.applyMiddlewareFast(gridEvent, event);

      if (processedEvent) {
        this.executeHandlersSync(event, processedEvent);
      }
      return;
    }

    // For non-immediate events, schedule processing
    const gridEvent = this.createEvent(event, payload, options);
    const processedEvent = this.applyMiddlewareFast(gridEvent, event);

    if (!processedEvent) {
      return;
    }

    this.priorityQueue.enqueue(
      () => this.executeHandlers(event, processedEvent),
      priority
    );

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      this.scheduleProcessing();
    }
  }

  /**
   * Optimized batch emit
   */
  emitBatch<T extends EventType>(
    events: Array<{
      event: T;
      payload: EventPayload<T>;
      priority?: EventPriority;
    }>
  ): void {
    if (events.length === 0) return;

    // Process all events in order
    for (let i = 0; i < events.length; i++) {
      const { event, payload, priority = EventPriority.NORMAL } = events[i];
      this.emit(event, payload, { priority });
    }
  }

  /**
   * Add middleware
   */
  use(middleware: EventMiddleware): () => void {
    this.middlewares.push(middleware);
    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index > -1) {
        this.middlewares.splice(index, 1);
      }
    };
  }

  /**
   * Get event bus statistics
   */
  getStats(): Readonly<EventBusStats> {
    return { ...this.stats };
  }

  /**
   * Clear all handlers and reset state - optimized
   */
  clear(): void {
    this.handlers.clear();
    this.handlerIdMap.clear();
    this.middlewares.length = 0;
    this.priorityQueue.clear();
    this.cleanupManager.cleanup();
    this.immediateEvents.length = 0;
    this.stats = {
      totalEvents: 0,
      totalHandlers: 0,
      eventCounts: new Map(),
      avgExecutionTime: new Map(),
    };
    this.flushScheduled = false;
    this.immediateProcessing = false;
    this.scheduledFlush = false;
    this.nextHandlerId = 1;
  }

  // ============================================
  // Private Methods - Optimized
  // ============================================

  private removeHandler(event: string, id: number): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Use lastIndexOf for faster removal
    for (let i = handlers.length - 1; i >= 0; i--) {
      if (handlers[i].id === id) {
        this.removeHandlerAtIndex(event, i);
        break;
      }
    }
  }

  private removeHandlerAtIndex(event: string, index: number): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    const [removed] = handlers.splice(index, 1);

    this.handlerIdMap.delete(removed.id);
    this.stats.totalHandlers--;
    this.cleanupManager.untrack(removed.id);

    // Clean up empty arrays
    if (handlers.length === 0) {
      this.handlers.delete(event);
    }
  }

  private createEvent<T extends EventType>(
    event: T,
    payload: EventPayload<T>,
    options?: {
      priority?: EventPriority;
      source?: string;
      metadata?: Record<string, unknown>;
    }
  ): GridEvent<EventPayload<T>> {
    return {
      type: event,
      payload,
      timestamp: performance.now(),
      source: options?.source,
      metadata: options?.metadata,
    } as GridEvent<EventPayload<T>>;
  }

  private executeHandlers<T extends EventType>(
    event: T,
    gridEvent: GridEvent<EventPayload<T>>
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.length === 0) return;

    const toRemove: number[] = [];
    const startTime = performance.now();
    const length = handlers.length;

    // Optimized loop - pre-calculate length
    for (let i = 0; i < length; i++) {
      const entry = handlers[i];

      // Skip if removed (checked via handlerIdMap)
      if (!this.handlerIdMap.has(entry.id)) {
        continue;
      }

      // Apply filter if present
      if (entry.options.filter && !entry.options.filter(gridEvent)) {
        continue;
      }

      try {
        const result = entry.handler(gridEvent);

        // Handle async handlers
        if (result instanceof Promise) {
          result.catch((error) => {
            if (this.devMode) {
              console.error(
                `Async error in event handler for ${event}:`,
                error
              );
            }
          });
        }
      } catch (error) {
        if (this.devMode) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }

      // Mark for removal if once
      if (entry.options.once) {
        toRemove.push(entry.id);
      }
    }

    // Cleanup one-time handlers
    if (toRemove.length > 0) {
      for (let i = 0; i < toRemove.length; i++) {
        const id = toRemove[i];
        if (this.handlerIdMap.has(id)) {
          this.removeHandler(event, id);
        }
      }
    }

    // Update execution time statistics
    const executionTime = performance.now() - startTime;
    const avgTime = this.stats.avgExecutionTime.get(event) ?? 0;
    const count = this.stats.eventCounts.get(event) ?? 1;
    this.stats.avgExecutionTime.set(
      event,
      (avgTime * (count - 1) + executionTime) / count
    );

    if (this.devMode && executionTime > 10) {
      console.warn(
        `[EventBus] Slow event handler for ${event}: ${executionTime.toFixed(2)}ms`
      );
    }
  }

  private executeHandlersSync<T extends EventType>(
    event: T,
    gridEvent: GridEvent<EventPayload<T>>
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.length === 0) return;

    const toRemove: number[] = [];
    const startTime = performance.now();
    const length = handlers.length;

    // Sync execution for immediate events
    for (let i = 0; i < length; i++) {
      const entry = handlers[i];

      if (!this.handlerIdMap.has(entry.id)) {
        continue;
      }

      if (entry.options.filter && !entry.options.filter(gridEvent)) {
        continue;
      }

      try {
        entry.handler(gridEvent);
      } catch (error) {
        if (this.devMode) {
          console.error(
            `Error in immediate event handler for ${event}:`,
            error
          );
        }
      }

      if (entry.options.once) {
        toRemove.push(entry.id);
      }
    }

    // Cleanup one-time handlers
    if (toRemove.length > 0) {
      for (let i = 0; i < toRemove.length; i++) {
        const id = toRemove[i];
        if (this.handlerIdMap.has(id)) {
          this.removeHandler(event, id);
        }
      }
    }

    // Update stats
    const executionTime = performance.now() - startTime;
    const avgTime = this.stats.avgExecutionTime.get(event) ?? 0;
    const count = this.stats.eventCounts.get(event) ?? 1;
    this.stats.avgExecutionTime.set(
      event,
      (avgTime * (count - 1) + executionTime) / count
    );
  }

  private applyMiddlewareFast<T extends EventType>(
    event: GridEvent<EventPayload<T>>,
    eventType: T
  ): GridEvent<EventPayload<T>> | null {
    if (this.middlewares.length === 0) {
      return event;
    }

    // Fast path for single middleware (common case)
    if (this.middlewares.length === 1) {
      const result = this.middlewares[0](event);
      return result === null ? null : (result as GridEvent<EventPayload<T>>);
    }

    // For multiple middlewares
    let currentEvent: any = event;

    for (let i = 0; i < this.middlewares.length; i++) {
      const result = this.middlewares[i](currentEvent);
      if (result === null) {
        // Don't cache cancellation - each event should be evaluated independently
        return null;
      }
      currentEvent = result;
    }

    return currentEvent as GridEvent<EventPayload<T>>;
  }

  private scheduleProcessing(): void {
    if (this.scheduledFlush) return;

    this.scheduledFlush = true;

    // Use the most efficient scheduling available
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => this.processQueue());
    } else if (typeof setImmediate !== 'undefined') {
      setImmediate(() => this.processQueue());
    } else {
      setTimeout(() => this.processQueue(), 0);
    }
  }

  private processQueue(): void {
    this.scheduledFlush = false;
    this.flushScheduled = false;

    try {
      this.priorityQueue.process();
    } finally {
      // Check if more events were added during processing
      if (this.priorityQueue.size() > 0) {
        this.flushScheduled = true;
        this.scheduleProcessing();
      }
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let instance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!instance) {
    instance = new EventBus({
      devMode:
        typeof process !== 'undefined'
          ? process.env.NODE_ENV !== 'production'
          : false,
    });
  }
  return instance;
}

export function resetEventBus(): void {
  instance?.clear();
  instance = null;
}

export function createEventBus(options?: { devMode?: boolean }): EventBus {
  return new EventBus(options);
}
