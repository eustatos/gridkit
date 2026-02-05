// Core EventBus implementation for GridKit

import { EventPriority, type EventHandler, type GridEvent } from './types/base';
import { type CoreEventType, type EventType, type EventPayload } from './types/registry';
import { safeRemoveHandler, clearAllHandlers } from './utils/cleanup';
import { extractNamespace } from './utils/namespace';

type HandlerEntry<T extends CoreEventType> = {
  handler: EventHandler<T>;
  priority: EventPriority;
  once: boolean;
};

export class EventBus {
  private handlers = new Map<string, Set<HandlerEntry<CoreEventType>>>();
  private wildcardHandlers = new Set<HandlerEntry<CoreEventType>>();

  /**
   * Subscribe to an event
   * @param event - The event type to subscribe to
   * @param handler - The handler function
   * @param priority - The execution priority (default: NORMAL)
   * @returns Unsubscribe function
   */
  on<T extends EventType>(
    event: T,
    handler: EventHandler<Extract<CoreEventType, { type: T }>>,
    priority: EventPriority = EventPriority.NORMAL
  ): () => void {
    const entry: HandlerEntry<CoreEventType> = { handler, priority, once: false };
    
    if (event === '*') {
      this.wildcardHandlers.add(entry as HandlerEntry<CoreEventType>);
    } else {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(entry as HandlerEntry<CoreEventType>);
    }

    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event and automatically unsubscribe after first call
   * @param event - The event type to subscribe to
   * @param handler - The handler function
   * @param priority - The execution priority (default: NORMAL)
   * @returns Unsubscribe function
   */
  once<T extends EventType>(
    event: T,
    handler: EventHandler<Extract<CoreEventType, { type: T }>>,
    priority: EventPriority = EventPriority.NORMAL
  ): () => void {
    const entry: HandlerEntry<CoreEventType> = { handler, priority, once: true };
    
    if (event === '*') {
      this.wildcardHandlers.add(entry as HandlerEntry<CoreEventType>);
    } else {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(entry as HandlerEntry<CoreEventType>);
    }

    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event
   * @param event - The event type to unsubscribe from
   * @param handler - The handler function to remove
   */
  off<T extends EventType>(
    event: T,
    handler: EventHandler<Extract<CoreEventType, { type: T }>>
  ): void {
    if (event === '*') {
      for (const entry of this.wildcardHandlers) {
        if (entry.handler === handler) {
          this.wildcardHandlers.delete(entry);
          break;
        }
      }
    } else {
      const handlers = this.handlers.get(event);
      if (handlers) {
        for (const entry of handlers) {
          if (entry.handler === handler) {
            handlers.delete(entry);
            break;
          }
        }
      }
    }
  }

  /**
   * Emit an event
   * @param event - The event type to emit
   * @param payload - The event payload
   */
  emit<T extends EventType>(event: T, payload: EventPayload<T>): void {
    const gridEvent: GridEvent<EventPayload<T>> = {
      type: event,
      payload,
      timestamp: Date.now(),
    };

    // Sort handlers by priority
    const allHandlers: HandlerEntry<CoreEventType>[] = [];
    
    // Add specific event handlers
    const specificHandlers = this.handlers.get(event);
    if (specificHandlers) {
      allHandlers.push(...specificHandlers);
    }
    
    // Add wildcard handlers
    allHandlers.push(...this.wildcardHandlers);
    
    // Add namespace handlers
    const namespace = extractNamespace(event);
    if (namespace) {
      const namespaceEvent = `${namespace}.*`;
      const namespaceHandlers = this.handlers.get(namespaceEvent);
      if (namespaceHandlers) {
        allHandlers.push(...namespaceHandlers);
      }
    }

    // Sort by priority (lower number = higher priority)
    allHandlers.sort((a, b) => a.priority - b.priority);

    // Execute handlers
    for (const entry of allHandlers) {
      // Type assertion to handle the generic nature of the handler
      const handler = entry.handler as EventHandler<GridEvent<EventPayload<T>>>;
      handler(gridEvent);
      
      // Remove once handlers
      if (entry.once) {
        if (entry.handler === handler) {
          if (event === '*') {
            this.wildcardHandlers.delete(entry as HandlerEntry<CoreEventType>);
          } else {
            const handlers = this.handlers.get(event);
            if (handlers) {
              handlers.delete(entry as HandlerEntry<CoreEventType>);
            }
          }
        }
      }
    }
  }

  /**
   * Clear all event handlers
   */
  clear(): void {
    clearAllHandlers(this.handlers as Map<string, Set<unknown>>);
    this.wildcardHandlers.clear();
  }
}