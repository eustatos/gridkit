import type { HandlerRegistry, HandlerEntry, PatternMatcher, HandlerProcessor } from './HandlerRegistry';
import { createHandlerRegistry, createPatternMatcher, createHandlerProcessor } from './HandlerRegistry';
import type { MiddlewarePipeline } from './MiddlewarePipeline';
import { createMiddlewarePipeline } from './MiddlewarePipeline';
import type { Scheduler } from './Scheduler';
import { createScheduler } from './Scheduler';
import type { StatsCollector, EventBusStats } from './StatsCollector';
import { createStatsCollector } from './StatsCollector';
import type { EventPayload, EventHandlerOptions, GridEvent, EventMiddleware, EventHandler } from './types';
import { EventPriority } from './types/base';
import { createCleanupManager, type CleanupManager } from './utils/cleanup';

/**
 * Performance-optimized event bus implementation
 * 
 * This class follows Single Responsibility Principle by delegating
 * specific concerns to specialized components:
 * - HandlerRegistry: Manages event handlers
 * - PatternMatcher: Matches events to handler patterns
 * - HandlerProcessor: Executes handlers safely
 * - MiddlewarePipeline: Processes events through middleware
 * - StatsCollector: Collects performance metrics
 * - Scheduler: Manages event processing timing
 * 
 * Main Responsibilities:
 * - Public API surface for event subscription and emission
 * - Lifecycle management (clear, cleanup)
 * - Dependency injection of specialized components
 */
export class EventBus {
  // Core components with single responsibilities
  private readonly handlerRegistry: HandlerRegistry;
  private readonly patternMatcher: PatternMatcher;
  private readonly handlerProcessor: HandlerProcessor;
  private readonly middlewarePipeline: MiddlewarePipeline;
  private readonly statsCollector: StatsCollector;
  private readonly scheduler: Scheduler;
  private readonly cleanupManager: CleanupManager;
  private readonly devMode: boolean;
  private nextHandlerId = 1;

  constructor(options: { devMode?: boolean } = {}) {
    // Initialize specialized components
    this.handlerRegistry = createHandlerRegistry();
    this.patternMatcher = createPatternMatcher();
    this.handlerProcessor = createHandlerProcessor(options.devMode ?? false);
    this.middlewarePipeline = createMiddlewarePipeline();
    this.statsCollector = createStatsCollector();
    this.scheduler = createScheduler();
    this.cleanupManager = createCleanupManager();
    this.devMode = options.devMode ?? false;
  }

  /**
   * Subscribe to an event with performance optimizations
   */
  on<T extends string>(
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

    // Register handler with the registry
    this.handlerRegistry.add(event, entry);

    // Track for cleanup
    const cleanupKey = `handler-${id}`;
    this.cleanupManager.track(cleanupKey as unknown as symbol, () => {
      this.handlerRegistry.remove(event, id);
    });

    this.statsCollector.incrementTotalHandlers();

    // Return optimized unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Subscribe to event once
   */
  once<T extends string>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): () => void {
    return this.on(event, handler, { once: true });
  }

  /**
   * Unsubscribe from event
   */
  off<T extends string>(
    event: T,
    handler: EventHandler<GridEvent<EventPayload<T>>>
  ): void {
    const handlers = this.handlerRegistry.get(event);
    if (!handlers) return;

    // Find and remove handler
    const index = handlers.findIndex((entry) => entry.handler === handler);
    if (index !== -1) {
      this.removeHandler(event, index);
    }
  }

  /**
   * High-performance emit with optimizations
   */
  emit<T extends string>(
    event: T,
    payload: EventPayload<T>,
    options?: {
      priority?: EventPriority;
      source?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    this.statsCollector.incrementTotalEvents();
    this.statsCollector.incrementEventCount(event);

    const priority = options?.priority ?? EventPriority.NORMAL;

    // Create event
    const gridEvent: GridEvent = {
      type: event,
      payload,
      timestamp: performance.now(),
      source: options?.source,
      metadata: options?.metadata,
    };

    // Process through middleware
    const processedEvent = this.middlewarePipeline.apply(gridEvent);
    if (processedEvent === null) {
      return;
    }

    // Execute handlers
    if (priority === EventPriority.IMMEDIATE) {
      this.executeImmediate(event, processedEvent);
    } else {
      this.scheduleProcessing(event, processedEvent, priority);
    }
  }

  /**
   * Optimized batch emit
   */
  emitBatch<T extends string>(
    events: Array<{
      event: T;
      payload: EventPayload<T>;
      priority?: EventPriority;
    }>
  ): void {
    if (events.length === 0) return;

    for (const { event, payload, priority = EventPriority.NORMAL } of events) {
      this.emit(event, payload, { priority });
    }
  }

  /**
   * Add middleware
   */
  use(middleware: EventMiddleware): () => void {
    this.middlewarePipeline.add(middleware);
    return () => {
      this.middlewarePipeline.remove(middleware);
    };
  }

  /**
   * Get event bus statistics
   */
  getStats(): Readonly<EventBusStats> {
    return this.statsCollector.getStats();
  }

  /**
   * Process all scheduled tasks (for testing)
   */
  processPending(): void {
    this.scheduler.process();
  }

  /**
   * Get internal scheduler for testing purposes
   */
  get _scheduler(): Scheduler {
    return this.scheduler;
  }

  /**
   * Get internal stats collector for testing purposes
   */
  get _stats(): StatsCollector {
    return this.statsCollector;
  }

  /**
   * Clear all handlers and reset state
   */
  clear(): void {
    this.handlerRegistry.clear();
    this.middlewarePipeline.clear();
    this.statsCollector.clear();
    this.scheduler.clear();
    this.cleanupManager.cleanup();
    this.nextHandlerId = 1;
  }

  /**
   * Execute handlers for an event immediately (synchronously)
   */
  private executeImmediate<T extends string>(
    event: T,
    gridEvent: GridEvent
  ): void {
    const handlers = this.handlerRegistry.getAll();
    const matchedHandlers = this.patternMatcher.match(handlers, event);
    
    const toRemove = this.handlerProcessor.executeSync(event, matchedHandlers, gridEvent);
    this.removeOnceHandlers(toRemove);
  }

  /**
   * Schedule event processing for later execution
   */
  private scheduleProcessing<T extends string>(
    event: T,
    gridEvent: GridEvent,
    priority: EventPriority
  ): void {
    const handlers = this.handlerRegistry.getAll();
    const matchedHandlers = this.patternMatcher.match(handlers, event);

    this.scheduler.schedule(() => {
      const toRemove = this.handlerProcessor.execute(event, matchedHandlers, gridEvent);
      this.removeOnceHandlers(toRemove);
    }, priority);
  }

  /**
   * Remove once handlers from the registry
   */
  private removeOnceHandlers(toRemove: number[]): void {
    if (toRemove.length === 0) return;

    // Group removals by event for efficiency
    const removalsByEvent = new Map<string, number[]>();
    
    for (const id of toRemove) {
      const mapped = this.handlerRegistry.getHandlerEvent(id);
      if (mapped) {
        let eventRemovals = removalsByEvent.get(mapped.event);
        if (!eventRemovals) {
          eventRemovals = [];
          removalsByEvent.set(mapped.event, eventRemovals);
        }
        eventRemovals.push(mapped.entry.id);
      }
    }

    // Remove handlers from the registry
    for (const [event, ids] of removalsByEvent) {
      const handlers = this.handlerRegistry.get(event);
      if (handlers) {
        for (const id of ids) {
          const index = handlers.findIndex((h) => h.id === id);
          if (index !== -1) {
            handlers.splice(index, 1);
            this.statsCollector.decrementTotalHandlers();
          }
        }
        
        // Clean up empty arrays
        if (handlers.length === 0) {
          this.handlerRegistry.clearForEvent(event);
        }
      }
    }
  }

  /**
   * Remove handler at specific index
   */
  private removeHandler<T extends string>(event: T, index: number): void {
    const handlers = this.handlerRegistry.get(event);
    if (!handlers || index < 0 || index >= handlers.length) return;

    const [removed] = handlers.splice(index, 1);

    // Remove from registry (this will update internal tracking)
    this.handlerRegistry.remove(event, removed.id);
    this.statsCollector.decrementTotalHandlers();
    
    const cleanupKey = `handler-${removed.id}`;
    this.cleanupManager.untrack(cleanupKey as unknown as symbol);

    // Clean up empty arrays
    if (handlers.length === 0) {
      this.handlerRegistry.clearForEvent(event);
    }
  }
}

/**
 * Create event bus instance
 */
export function createEventBus(options?: { devMode?: boolean }): EventBus {
  return new EventBus(options);
}

/**
 * Get singleton event bus instance
 */
export function getEventBus(): EventBus {
  return createEventBus();
}

/**
 * Reset singleton event bus
 */
export function resetEventBus(): void {
  // Note: This would need a singleton manager for proper cleanup
  // For now, just a placeholder
}
