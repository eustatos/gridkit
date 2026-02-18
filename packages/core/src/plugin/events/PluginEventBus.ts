import { createEventBus, type EventBus } from '../../events';
import type { PluginEventType } from './PluginEvents';

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
 * Reset the global plugin event bus (for testing)
 */
export function resetPluginEventBus(): void {
  if (globalPluginEventBus) {
    globalPluginEventBus.clear();
    globalPluginEventBus = null;
  }
}