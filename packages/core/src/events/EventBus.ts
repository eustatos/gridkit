// Core EventBus implementation for GridKit

import { EventPriority, type EventHandler, type GridEvent } from './types/base';
import { type CoreEventType, type EventType, type EventPayload } from './types/registry';
import { clearAllHandlers } from './utils/cleanup';
import { extractNamespace } from './utils/namespace';

type HandlerEntry<T extends CoreEventType> = {
  handler: EventHandler<T>;
  priority: EventPriority;
  once: boolean;
};

// Type for event handler that can handle any event type
type GenericEventHandler = EventHandler<CoreEventType>;

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
    const entry: HandlerEntry<CoreEventType> = { 
      handler: handler as unknown as EventHandler<CoreEventType>, 
      priority, 
      once: false 
    };
    
    if (event === '*' as unknown as T) {
      this.wildcardHandlers.add(entry);
    } else {
      const eventType = event as string;
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, new Set());
      }
      this.handlers.get(eventType)!.add(entry);
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
    const entry: HandlerEntry<CoreEventType> = { 
      handler: handler as unknown as EventHandler<CoreEventType>, 
      priority, 
      once: true 
    };
    
    if (event === '*' as unknown as T) {
      this.wildcardHandlers.add(entry);
    } else {
      const eventType = event as string;
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, new Set());
      }
      this.handlers.get(eventType)!.add(entry);
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
    if (event === '*' as unknown as T) {
      for (const entry of this.wildcardHandlers) {
        if (entry.handler === handler) {
          this.wildcardHandlers.delete(entry);
          break;
        }
      }
    } else {
      const eventType = event as string;
      const handlers = this.handlers.get(eventType);
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
      type: event as string,
      payload,
      timestamp: Date.now(),
    };

    // Sort handlers by priority
    const allHandlers: HandlerEntry<CoreEventType>[] = [];
    
    // Add specific event handlers
    const specificHandlers = this.handlers.get(event as string);
    if (specificHandlers) {
      allHandlers.push(...specificHandlers);
    }
    
    // Add wildcard handlers
    allHandlers.push(...this.wildcardHandlers);
    
    // Add namespace handlers
    const namespace = extractNamespace(event as string);
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
        // For simplicity, we'll remove the handler from the specific event handlers
        // In a more robust implementation, we'd need to track where the handler was added
        const handlers = this.handlers.get(event as string);
        if (handlers) {
          handlers.delete(entry as HandlerEntry<CoreEventType>);
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