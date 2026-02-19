import type { EventPriority, GridEvent, EventPayload, EventHandler } from './types';

/**
 * Handler entry with metadata
 */
export interface HandlerEntry<T extends string> {
  handler: EventHandler<GridEvent<EventPayload<T>>>;
  options: { priority?: EventPriority; once?: boolean; filter?: (event: GridEvent) => boolean };
  id: number;
  addedAt: number;
  priority: EventPriority;
}

/**
 * Registry for managing event handlers with optimized lookup
 * 
 * Single Responsibility: Store, retrieve, and manage event handlers
 */
export interface HandlerRegistry {
  add<T extends string>(event: T, entry: HandlerEntry<T>): void;
  remove<T extends string>(event: T, id: number): void;
  get<T extends string>(event: T): HandlerEntry<T>[] | undefined;
  getAll(): HandlerEntry<string>[];
  clear(): void;
  clearForEvent(event: string): void;
  has(event: string): boolean;
  size(): number;
  getHandlerEvent(id: number): { event: string; entry: HandlerEntry<string> } | undefined;
}

/**
 * Create handler registry with optimized storage and retrieval
 */
export function createHandlerRegistry(): HandlerRegistry {
  const handlers = new Map<string, HandlerEntry<string>[]>();
  const handlerIdMap = new Map<number, { event: string; entry: HandlerEntry<string> }>();

  return {
    add<T extends string>(event: T, entry: HandlerEntry<T>): void {
      let handlersList = handlers.get(event);
      if (!handlersList) {
        handlersList = [];
        handlers.set(event, handlersList);
      }

      // Insert handler in priority order (lower number = higher priority)
      const insertIndex = handlersList.findIndex((h) => h.priority > entry.priority);

      if (insertIndex === -1) {
        handlersList.push(entry as HandlerEntry<string>);
      } else {
        handlersList.splice(insertIndex, 0, entry as HandlerEntry<string>);
      }

      handlerIdMap.set(entry.id, { event, entry: entry as HandlerEntry<string> });
    },

    remove<T extends string>(event: T, id: number): void {
      const mapped = handlerIdMap.get(id);
      if (!mapped || mapped.event !== event) return;

      const handlersList = handlers.get(event);
      if (!handlersList) return;

      const index = handlersList.findIndex((h) => h.id === id);
      if (index !== -1) {
        handlersList.splice(index, 1);
      }

      handlerIdMap.delete(id);

      if (handlersList.length === 0) {
        handlers.delete(event);
      }
    },

    get<T extends string>(event: T): HandlerEntry<T>[] | undefined {
      return handlers.get(event) as HandlerEntry<T>[] | undefined;
    },

    getAll(): HandlerEntry<string>[] {
      const all: HandlerEntry<string>[] = [];
      const handlersIterator = handlers.values();
      let current = handlersIterator.next();
      while (!current.done) {
        all.push(...current.value);
        current = handlersIterator.next();
      }
      return all;
    },

    clear(): void {
      handlers.clear();
      handlerIdMap.clear();
    },

    clearForEvent(event: string): void {
      handlers.delete(event);
    },

    has(event: string): boolean {
      return handlers.has(event);
    },

    size(): number {
      let count = 0;
      const handlersIterator = handlers.values();
      let current = handlersIterator.next();
      while (!current.done) {
        count += current.value.length;
        current = handlersIterator.next();
      }
      return count;
    },

    getHandlerEvent(id: number): { event: string; entry: HandlerEntry<string> } | undefined {
      return handlerIdMap.get(id);
    },
  };
}

/**
 * Pattern matching helper for handler matching
 */
export interface PatternMatcher {
  match(handlers: HandlerEntry<string>[], event: string): HandlerEntry<string>[];
  matchesPattern(event: string, pattern: string): boolean;
}

/**
 * Create pattern matcher for event handlers
 */
export function createPatternMatcher(): PatternMatcher {
  function matchesPattern(event: string, pattern: string): boolean {
    if (event === pattern) {
      return true;
    }
    if (pattern === '*') {
      return true;
    }
    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, pattern.indexOf(':*'));
      return event.startsWith(prefix + ':');
    }
    return false;
  }

  function match(handlers: HandlerEntry<string>[], event: string): HandlerEntry<string>[] {
    // Return all handlers that have no pattern restrictions
    // Pattern matching is only for wildcard handlers like 'grid:*' or '*'
    const matched: HandlerEntry<string>[] = [];

    for (const handler of handlers) {
      const pattern = handler.options.filter
        ? handler.options.filter.toString()
        : handler.options.priority?.toString() || 'default';

      // Check if handler has a wildcard pattern
      if (pattern === '*') {
        matched.push(handler);
      } else if (pattern.endsWith(':*')) {
        const prefix = pattern.slice(0, pattern.indexOf(':*'));
        if (event.startsWith(prefix + ':')) {
          matched.push(handler);
        }
      } else {
        // Default: match all handlers unless they have a specific filter
        // The filter function is applied during execution, not pattern matching
        matched.push(handler);
      }
    }

    return matched;
  }

  return {
    matchesPattern,
    match,
  };
}

/**
 * Handler processor for executing handlers with error handling and cleanup
 */
export interface HandlerProcessor {
  executeSync<T extends string>(
    event: T,
    handlers: HandlerEntry<string>[],
    gridEvent: GridEvent
  ): number[];
  execute<T extends string>(
    event: T,
    handlers: HandlerEntry<string>[],
    gridEvent: GridEvent
  ): number[];
}

/**
 * Create handler processor
 */
export function createHandlerProcessor(devMode: boolean = false): HandlerProcessor {
  function executeHandler<T extends string>(
    handler: EventHandler<GridEvent>,
    gridEvent: GridEvent,
    devMode: boolean
  ): void {
    try {
      const result = handler(gridEvent);
      if (result instanceof Promise) {
        result.catch((error) => {
          if (devMode) {
            console.error(`Async error in event handler:`, error);
          }
        });
      }
    } catch (error) {
      if (devMode) {
        console.error(`Error in event handler:`, error);
      }
    }
  }

  function processWithCleanup<T extends string>(
    event: T,
    handlers: HandlerEntry<string>[],
    gridEvent: GridEvent,
    sync: boolean
  ): number[] {
    const toRemove: number[] = [];
    const startTime = performance.now();

    for (const entry of handlers) {
      if (entry.options.filter && !entry.options.filter(gridEvent)) {
        continue;
      }

      if (sync) {
        executeHandler(entry.handler, gridEvent, devMode);
      } else {
        executeHandler(entry.handler, gridEvent, devMode);
      }

      if (entry.options.once) {
        toRemove.push(entry.id);
      }
    }

    if (devMode) {
      const executionTime = performance.now() - startTime;
      if (executionTime > 10) {
        console.warn(`[EventBus] Slow event handler for ${event}: ${executionTime.toFixed(2)}ms`);
      }
    }

    return toRemove;
  }

  return {
    executeSync<T extends string>(
      event: T,
      handlers: HandlerEntry<string>[],
      gridEvent: GridEvent
    ): number[] {
      return processWithCleanup(event, handlers, gridEvent, true);
    },

    execute<T extends string>(
      event: T,
      handlers: HandlerEntry<string>[],
      gridEvent: GridEvent
    ): number[] {
      return processWithCleanup(event, handlers, gridEvent, false);
    },
  };
}
