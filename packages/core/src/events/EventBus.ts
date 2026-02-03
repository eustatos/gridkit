/**
 * GridKit Event Bus
 *
 * Type-safe, priority-based event bus for GridKit system.
 * Features:
 * - Type-safe event emission and handling
 * - Priority-based event scheduling
 * - Memory leak prevention
 * - Middleware support
 * - DevTools integration
 *
 * @module @gridkit/core/events/EventBus
 */

import type {
  EventType,
  EventPayload,
  EventHandler,
  EventHandlerOptions,
  GridEvent,
  EventMiddleware,
} from './types';
import { EventPriority } from './types';
import { createCleanupManager, type CleanupManager } from './utils/cleanup';
import { extractNamespace } from './utils/namespace';
import { createPriorityQueue, type PriorityQueue } from './utils/priority';

// Declare requestIdleCallback for TypeScript
interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

type RequestIdleCallback = (
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout?: number }
) => number;

interface Window {
  requestIdleCallback?: RequestIdleCallback;
  cancelIdleCallback?: (handle: number) => void;
}

/**
 * Handler entry with metadata.
 */
interface HandlerEntry {
  handler: EventHandler;
  options: EventHandlerOptions;
  id: symbol;
  addedAt: number;
}

/**
 * Event bus statistics for DevTools.
 */
interface EventBusStats {
  totalEvents: number;
  totalHandlers: number;
  eventCounts: Map<string, number>;
  avgExecutionTime: Map<string, number>;
  lastError?: Error;
}

/**
 * Event bus configuration.
 */
export interface EventBusOptions {
  /** Enable development mode for debugging */
  devMode?: boolean;

  /** Maximum handlers per event (prevent memory leaks) */
  maxHandlersPerEvent?: number;

  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;

  /** Custom middleware to apply */
  middleware?: EventMiddleware[];
}

/**
 * Core event bus implementation.
 * Singleton pattern for grid-wide event coordination.
 *
 * @public
 */
export class EventBus {
  private handlers = new Map<string, Set<HandlerEntry>>();
  private middlewares: EventMiddleware[] = [];
  private priorityQueue: PriorityQueue;
  private cleanupManager: CleanupManager;
  private isProcessing = false;
  private stats: EventBusStats;
  private devMode: boolean;
  private maxHandlersPerEvent: number;

  constructor(options: EventBusOptions = {}) {
    this.priorityQueue = createPriorityQueue();
    this.cleanupManager = createCleanupManager();
    this.devMode = options.devMode ?? false;
    this.maxHandlersPerEvent = options.maxHandlersPerEvent ?? 1000;

    this.stats = {
      totalEvents: 0,
      totalHandlers: 0,
      eventCounts: new Map(),
      avgExecutionTime: new Map(),
    };

    // Add custom middleware if provided
    if (options.middleware) {
      this.middlewares.push(...options.middleware);
    }

    // Add built-in middleware
    if (this.devMode) {
      this.addDevToolsMiddleware();
    }
  }

  /**
   * Subscribe to an event.
   *
   * @template T - Event type
   * @param event - Event type
   * @param handler - Event handler
   * @param options - Handler options
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * // Subscribe to grid initialization event
   * const unsubscribe = bus.on('grid:init', (event) => {
   *   console.log('Grid initialized:', event.payload);
   * });
   *
   * // Unsubscribe later
   * unsubscribe();
   * ```
   */
  on<T extends EventType>(
    event: T,
    handler: EventHandler<T>,
    options: EventHandlerOptions = {}
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    const eventHandlers = this.handlers.get(event)!;

    // Enforce handler limit to prevent memory leaks
    if (eventHandlers.size >= this.maxHandlersPerEvent) {
      if (this.devMode) {
        console.warn(
          `Maximum handler limit reached for event "${event}". ` +
            `Consider using different event types or cleaning up unused handlers.`
        );
      }
      return () => {};
    }

    const id = Symbol(`handler-${event}`);
    const entry: HandlerEntry = {
      handler,
      options,
      id,
      addedAt: performance.now(),
    };

    eventHandlers.add(entry);

    // Update stats
    this.stats.totalHandlers++;

    const unsubscribe = () => {
      if (eventHandlers.has(entry)) {
        eventHandlers.delete(entry);
        this.stats.totalHandlers--;
      }
    };

    // Register cleanup
    this.cleanupManager.track(entry.id, unsubscribe);

    return unsubscribe;
  }

  /**
   * Subscribe to an event for a single execution.
   *
   * @template T - Event type
   * @param event - Event type
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  once<T extends EventType>(event: T, handler: EventHandler<T>): () => void {
    const onceHandler: EventHandler<T> = (gridEvent) => {
      handler(gridEvent);
      unsubscribe();
    };

    const unsubscribe = this.on(event, onceHandler);
    return unsubscribe;
  }

  /**
   * Unsubscribe from an event.
   *
   * @template T - Event type
   * @param event - Event type
   * @param handler - Event handler to remove
   */
  off<T extends EventType>(event: T, handler: EventHandler<T>): void {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers) return;

    for (const entry of eventHandlers) {
      if (entry.handler === handler) {
        eventHandlers.delete(entry);
        this.stats.totalHandlers--;
        break;
      }
    }
  }

  /**
   * Emit an event.
   *
   * @template T - Event type
   * @param event - Event type
   * @param payload - Event payload
   * @param options - Emission options
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
    // Create grid event
    const gridEvent: GridEvent<EventPayload<T>> = {
      type: event,
      namespace: extractNamespace(event),
      payload,
      timestamp: performance.now(),
      source: options?.source,
      metadata: options?.metadata,
    };

    // Apply middleware
    let processedEvent: GridEvent<EventPayload<T>> | null = gridEvent;
    for (const middleware of this.middlewares) {
      if (processedEvent === null) break;
      processedEvent = middleware(processedEvent);
    }

    if (processedEvent === null) {
      // Event was canceled by middleware
      return;
    }

    // Update statistics
    this.stats.totalEvents++;
    const currentCount = this.stats.eventCounts.get(event) || 0;
    this.stats.eventCounts.set(event, currentCount + 1);

    const priority = options?.priority ?? EventPriority.NORMAL;
    const handlers = this.handlers.get(event);

    const executeHandlers = () => {
      if (!handlers || handlers.size === 0) return;

      const startTime = performance.now();
      let errorCount = 0;
      const asyncErrors: Error[] = [];

      for (const entry of handlers) {
        try {
          const result = entry.handler(processedEvent);

          // Handle async handlers
          if (
            result &&
            typeof result.then === 'function' &&
            typeof result.catch === 'function'
          ) {
            result.catch((error: Error) => {
              asyncErrors.push(error);
              if (this.devMode) {
                console.error(
                  `Async error in event handler for ${event}:`,
                  error
                );
              }
            });
          }
        } catch (error) {
          errorCount++;
          if (this.devMode) {
            console.error(`Error in event handler for ${event}:`, error);
          }
          this.stats.lastError = error as Error;
        }
      }

      const executionTime = performance.now() - startTime;
      const avgTime = this.stats.avgExecutionTime.get(event) || 0;
      const newAvg = (avgTime + executionTime) / 2;
      this.stats.avgExecutionTime.set(event, newAvg);

      // Handle async errors after the fact
      if (asyncErrors.length > 0) {
        errorCount += asyncErrors.length;
        this.stats.lastError = asyncErrors[asyncErrors.length - 1];

        if (this.devMode && asyncErrors.length > 0) {
          console.warn(
            `${asyncErrors.length} async handler(s) failed for event ${event}`
          );
        }
      }

      if (this.devMode && errorCount > 0) {
        console.warn(`${errorCount} handler(s) failed for event ${event}`);
      }
    };

    // Schedule based on priority
    switch (priority) {
      case EventPriority.IMMEDIATE:
        executeHandlers();
        break;

      case EventPriority.HIGH:
        queueMicrotask(() => {
          this.priorityQueue.enqueue(executeHandlers, 1); // High priority
          this.processQueue();
        });
        break;

      case EventPriority.NORMAL:
        this.priorityQueue.enqueue(executeHandlers, 2); // Normal priority
        this.scheduleQueueProcessing();
        break;

      case EventPriority.LOW:
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(
            () => {
              this.priorityQueue.enqueue(executeHandlers, 3); // Low priority
              this.processQueue();
            },
            { timeout: 5000 }
          );
        } else {
          // Fallback for Node.js or browsers without requestIdleCallback
          setTimeout(() => {
            this.priorityQueue.enqueue(executeHandlers, 3);
            this.processQueue();
          }, 0);
        }
        break;
    }
  }

  /**
   * Emit multiple events in batch.
   *
   * @param events - Array of events to emit
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
   * Add middleware to the event bus.
   *
   * @param middleware - Middleware function
   */
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Clear all event handlers and cleanup resources.
   */
  clear(): void {
    this.handlers.clear();
    this.priorityQueue.clear();
    this.cleanupManager.cleanup();
    this.middlewares = [];
    this.stats.totalHandlers = 0;
  }

  /**
   * Get event bus statistics.
   *
   * @returns Statistics object
   */
  getStats(): EventBusStats {
    return { ...this.stats };
  }

  /**
   * Get number of handlers for a specific event.
   *
   * @param event - Event type
   * @returns Number of handlers
   */
  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }

  /**
   * Process the priority queue.
   */
  private processQueue(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      this.priorityQueue.process();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Schedule queue processing.
   */
  private scheduleQueueProcessing(): void {
    if (this.isProcessing) return;

    queueMicrotask(() => {
      this.processQueue();
    });
  }

  /**
   * Add DevTools middleware for debugging.
   */
  private addDevToolsMiddleware(): void {
    this.use((event) => {
      if (this.devMode) {
        console.debug('[GridKit Event Bus]', event);
      }
      return event;
    });
  }
}

/**
 * Global event bus instance.
 */
let globalEventBus: EventBus | null = null;

/**
 * Get the global event bus instance.
 *
 * @returns Global event bus instance
 */
export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus({
      devMode: process.env.NODE_ENV === 'development',
    });
  }
  return globalEventBus;
}

/**
 * Reset the global event bus (for testing).
 */
export function resetEventBus(): void {
  globalEventBus?.clear();
  globalEventBus = null;
}

/**
 * Create a new isolated event bus instance.
 *
 * @param options - Event bus options
 * @returns New event bus instance
 */
export function createEventBus(options: EventBusOptions = {}): EventBus {
  return new EventBus(options);
}
