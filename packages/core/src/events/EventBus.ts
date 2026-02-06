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
  id: symbol;
  addedAt: number;
  priority: EventPriority; // Store handler priority
}

/**
 * Event bus statistics for DevTools
 */
interface EventBusStats {
  totalEvents: number;
  totalHandlers: number;
  eventCounts: Map<string, number>;
  avgExecutionTime: Map<string, number>;
}

/**
 * Core event bus implementation
 * Singleton pattern for grid-wide event coordination
 *
 * Features:
 * - Type-safe event emission and handling
 * - Priority-based event scheduling
 * - Memory leak prevention
 * - Middleware support
 * - DevTools integration
 */
export class EventBus {
  private handlers = new Map<string, Set<HandlerEntry<EventType>>>();
  private middlewares: EventMiddleware[] = [];
  private priorityQueue: PriorityQueue;
  private cleanupManager: CleanupManager;
  private isProcessing = false;
  private stats: EventBusStats;
  private devMode: boolean;
  private flushScheduled = false;

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
   * Subscribe to an event
   *
   * @example
   * const unsubscribe = bus.on('row:add', (event) => {
   *   console.log('Row added:', event.payload.rowId);
   * });
   */
  on<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>,
    options: EventHandlerOptions = {}
  ): () => void {
    const entry: HandlerEntry<T> = {
      handler,
      options,
      id: Symbol('handler'),
      addedAt: performance.now(),
      priority: options.priority ?? EventPriority.NORMAL, // Store handler priority
    };

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(entry as HandlerEntry<EventType>);
    this.stats.totalHandlers++;

    // Register with cleanup manager
    this.cleanupManager.track(entry.id, () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(entry as HandlerEntry<EventType>);
      }
    });

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to event once
   * Automatically unsubscribes after first invocation
   */
  once<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): () => void {
    return this.on(event, handler, { once: true });
  }

  /**
   * Unsubscribe from event
   */
  off<T extends EventType>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    for (const entry of handlers) {
      if (entry.handler === handler) {
        handlers.delete(entry);
        this.stats.totalHandlers--;
        this.cleanupManager.untrack(entry.id);
        break;
      }
    }

    // Remove event entry if no handlers left
    if (handlers.size === 0) {
      this.handlers.delete(event);
    }
  }

  /**
   * Emit an event
   *
   * @example
   * bus.emit('row:add', {
   *   rowId: createRowId('123'),
   *   index: 0,
   *   isNew: true
   * });
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
    const gridEvent: GridEvent<EventPayload<T>> = {
      type: event,
      payload,
      timestamp: performance.now(),
      source: options?.source,
      metadata: options?.metadata,
    } as GridEvent<EventPayload<T>>;

    // Update statistics
    this.stats.totalEvents++;
    const count = this.stats.eventCounts.get(event) ?? 0;
    this.stats.eventCounts.set(event, count + 1);

    // Apply middleware
    const processedEvent = this.applyMiddleware(gridEvent);

    // Event cancelled by middleware
    if (!processedEvent) {
      if (this.devMode) {
        console.log(`[EventBus] Event cancelled by middleware: ${event}`);
      }
      return;
    }

    const priority = options?.priority ?? EventPriority.NORMAL;

    if (priority === EventPriority.IMMEDIATE) {
      // Execute synchronously
      this.executeHandlers(event, processedEvent);
    } else {
      // Schedule in priority queue
      this.priorityQueue.enqueue(
        () => this.executeHandlers(event, processedEvent),
        priority
      );

      // Schedule async processing if not already scheduled
      if (!this.flushScheduled) {
        this.flushScheduled = true;
        this.scheduleProcessing();
      }
    }
  }

  /**
   * Emit multiple events in batch
   * More efficient than individual emits
   */
  emitBatch<T extends EventType>(
    events: Array<{
      event: T;
      payload: EventPayload<T>;
      priority?: EventPriority;
    }>
  ): void {
    // Group by priority for optimization
    const immediateEvents = [];
    const queuedEvents = [];

    for (const { event, payload, priority } of events) {
      const eventPriority = priority ?? EventPriority.NORMAL;
      if (eventPriority === EventPriority.IMMEDIATE) {
        immediateEvents.push({ event, payload });
      } else {
        queuedEvents.push({ event, payload, priority: eventPriority });
      }
    }

    // Execute immediate events synchronously
    for (const { event, payload } of immediateEvents) {
      this.emit(event, payload, { priority: EventPriority.IMMEDIATE });
    }

    // Queue other events
    for (const { event, payload, priority } of queuedEvents) {
      this.emit(event, payload, { priority });
    }
  }

  /**
   * Add middleware
   * Middleware can modify or cancel events
   */
  use(middleware: EventMiddleware): () => void {
    this.middlewares.push(middleware);

    // Return function to remove middleware
    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index > -1) {
        this.middlewares.splice(index, 1);
      }
    };
  }

  /**
   * Get event bus statistics (for DevTools)
   */
  getStats(): Readonly<EventBusStats> {
    return { ...this.stats };
  }

  /**
   * Clear all handlers and reset state
   */
  clear(): void {
    this.handlers.clear();
    this.middlewares = [];
    this.priorityQueue.clear();
    this.cleanupManager.cleanup();
    this.stats = {
      totalEvents: 0,
      totalHandlers: 0,
      eventCounts: new Map(),
      avgExecutionTime: new Map(),
    };
    this.flushScheduled = false;
  }

  // ============================================
  // Private Methods
  // ============================================

  private executeHandlers<T extends EventType>(
    event: T,
    gridEvent: GridEvent<EventPayload<T>>
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) return;

    const toRemove: HandlerEntry<EventType>[] = [];
    const startTime = performance.now();

    // Convert to array and sort by handler priority (lower number = higher priority)
    // OPTIMIZATION: Only sort if there are multiple handlers with different priorities
    const handlersArray = Array.from(handlers);
    if (handlersArray.length > 1) {
      // Check if all handlers have the same priority (common case)
      const firstPriority = handlersArray[0].priority;
      let allSamePriority = true;
      
      for (let i = 1; i < handlersArray.length; i++) {
        if (handlersArray[i].priority !== firstPriority) {
          allSamePriority = false;
          break;
        }
      }
      
      // Only sort if priorities differ
      if (!allSamePriority) {
        handlersArray.sort((a, b) => {
          // Lower priority number = higher priority (0 = IMMEDIATE is highest)
          return a.priority - b.priority;
        });
      }
    }
    
    for (const entry of handlersArray) {
      // Check if handler still exists (might have been removed by another handler)
      if (!handlers.has(entry)) {
        continue;
      }

      // Apply filter
      if (entry.options.filter && !entry.options.filter(gridEvent)) {
        continue;
      }

      try {
        const result = entry.handler(gridEvent);

        // Handle async handlers
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Async error in event handler for ${event}:`, error);
          });
        }
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }

      // Mark for removal if once
      if (entry.options.once) {
        toRemove.push(entry);
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

    // Cleanup one-time handlers
    toRemove.forEach((entry) => {
      handlers.delete(entry);
      this.stats.totalHandlers--;
      this.cleanupManager.untrack(entry.id);
    });

    if (this.devMode && executionTime > 10) {
      console.warn(
        `[EventBus] Slow event handler for ${event}: ${executionTime.toFixed(2)}ms`
      );
    }
  }

  private applyMiddleware<T extends EventType>(
    event: GridEvent<EventPayload<T>>
  ): GridEvent<EventPayload<T>> | null {
    let currentEvent: any = event;

    for (const middleware of this.middlewares) {
      const result = middleware(currentEvent);
      if (result === null) {
        return null; // Event cancelled
      }
      currentEvent = result;
    }

    return currentEvent as GridEvent<EventPayload<T>>;
  }

  private scheduleProcessing(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;

    // Use microtask for next tick execution
    const scheduleNextTick = () => {
      if (typeof queueMicrotask !== 'undefined') {
        queueMicrotask(() => this.processQueue());
      } else if (typeof setImmediate !== 'undefined') {
        setImmediate(() => this.processQueue());
      } else {
        setTimeout(() => this.processQueue(), 0);
      }
    };

    scheduleNextTick();
  }

  private processQueue(): void {
    try {
      this.priorityQueue.process();
    } finally {
      this.isProcessing = false;

      // Check if more events were added during processing
      if (this.priorityQueue.size() > 0) {
        this.flushScheduled = true;
        this.scheduleProcessing();
      } else {
        this.flushScheduled = false;
      }
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let instance: EventBus | null = null;

/**
 * Get global event bus instance
 */
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

/**
 * Reset event bus (for testing)
 */
export function resetEventBus(): void {
  instance?.clear();
  instance = null;
}

/**
 * Create isolated event bus instance
 * Useful for testing or multiple grid instances
 */
export function createEventBus(options?: { devMode?: boolean }): EventBus {
  return new EventBus(options);
}