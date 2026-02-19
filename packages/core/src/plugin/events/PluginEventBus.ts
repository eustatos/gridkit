import { createEventBus, type EventBus } from '../../events';

/**
 * Create a plugin-scoped event bus
 * 
 * @returns Event bus instance for plugin communication
 */
export function createPluginEventBus(): EventBus {
  return createEventBus();
}

// Re-export createEventBus for test compatibility
export { createEventBus } from '../../events';

/**
 * Get the global plugin event bus
 * 
 * @returns Global event bus instance for plugin system
 */
let globalPluginEventBus: EventBus | null = null;

export function getPluginEventBus(): EventBus {
  if (!globalPluginEventBus) {
    globalPluginEventBus = createEventBus({ devMode: process.env.NODE_ENV !== 'production' });
  }
  return globalPluginEventBus;
}

/**
 * Reset the global plugin event bus
 * 
 * @returns void
 */
export function resetPluginEventBus(): void {
  globalPluginEventBus = null;
}

// Re-export EventBus for test compatibility
export { EventBus } from '../../events';
