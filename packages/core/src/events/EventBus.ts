import type {
  EventType,
  EventPayload,
  EventHandler,
  EventHandlerOptions,
  GridEvent,
  EventPriority,
  EventMiddleware,
  EventNamespace,
  EventSubscription,
} from './types';
import { createPriorityQueue, type PriorityQueue } from './utils/priority';
import { createCleanupManager, type CleanupManager } from './utils/cleanup';
import { extractNamespace } from './utils/namespace';

/**
 * Handler entry with metadata
 */
interface HandlerEntry {
  handler: EventHandler;
  options: EventHandlerOptions;
  id: symbol;
  addedAt: number;
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
  private handlers = new Map<string, Set<HandlerEntry>>();
  private middlewares: EventMiddleware[] = [];
  private priorityQueue: PriorityQueue;
  private cleanupManager: CleanupManager;
  private isProcessing = false;
  private stats: EventBusStats;
  private devMode: boolean;

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
    handler: EventHandler<EventPayload<T>>,
    options: EventHandlerOptions = {}
  ): () => void {
    const entry: HandlerEntry = {
      handler: handler as EventHandler,
      options,
      id: Symbol('handler'),
      addedAt: performance.now(),
    };

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    this.handlers.get(event)!.add(entry);
    this.stats.totalHandlers++;

    // Register with cleanup manager
    this.cleanupManager.track(entry.id, () => {
      this.handlers.get(event)?.delete(entry);
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
    handler: EventHandler<EventPayload<T>>
  ): () => void {
    return this.on(event, handler, { once: true });
  }

  /**
   * Unsubscribe from event
   */
  off<T extends EventType>(
    event: T,
    handler: EventHandler<EventPayload<T>>
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
      namespace: extractNamespace(event),
      payload,
      timestamp: performance.now(),
      source: options?.source,
      metadata: options?.metadata,
    };

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
      this.scheduleProcessing(priority);
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
    for (const { event, payload, priority } of events) {
      this.emit(event, payload, { priority: priority ?? EventPriority.LOW });
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
  }

  // ============================================
  // Private Methods
  // ============================================

  private executeHandlers(event: string, gridEvent: GridEvent): void {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) return;

    const toRemove: HandlerEntry[] = [];
    const startTime = performance.now();

    for (const entry of handlers) {
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

  private applyMiddleware(event: GridEvent): GridEvent | null {
    let currentEvent = event;

    for (const middleware of this.middlewares) {
      const result = middleware(currentEvent);
      if (result === null) {
        return null; // Event cancelled
      }
      currentEvent = result;
    }

    return currentEvent;
  }

  private scheduleProcessing(priority: EventPriority): void {
    if (this.isProcessing) return;

    this.isProcessing = true;

    if (priority === EventPriority.HIGH) {
      queueMicrotask(() => {
        this.priorityQueue.process();
        this.isProcessing = false;
      });
    } else if (priority === EventPriority.LOW) {
      // Use requestIdleCallback if available
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          this.priorityQueue.process();
          this.isProcessing = false;
        });
      } else {
        setTimeout(() => {
          this.priorityQueue.process();
          this.isProcessing = false;
        }, 0);
      }
    } else {
      // NORMAL priority
      Promise.resolve().then(() => {
        this.priorityQueue.process();
        this.isProcessing = false;
      });
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
      devMode: process.env.NODE_ENV !== 'production',
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