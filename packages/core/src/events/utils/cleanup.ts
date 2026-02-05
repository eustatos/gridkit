// Basic cleanup utilities for GridKit Event System

/**
 * Checks if a value is a valid event handler
 * @param handler - The value to check
 * @returns True if the value is a function
 */
export function isValidHandler(handler: unknown): handler is Function {
  return typeof handler === 'function';
}

/**
 * Safely removes an event handler from a set
 * @param handlers - The set of handlers
 * @param handler - The handler to remove
 * @returns True if the handler was found and removed
 */
export function safeRemoveHandler<T>(handlers: Set<T>, handler: T): boolean {
  if (handlers.has(handler)) {
    handlers.delete(handler);
    return true;
  }
  return false;
}

/**
 * Clears all handlers from a map of event handlers
 * @param handlerMap - The map of event handlers to clear
 */
export function clearAllHandlers(handlerMap: Map<string, Set<unknown>>): void {
  for (const handlers of handlerMap.values()) {
    handlers.clear();
  }
  handlerMap.clear();
}