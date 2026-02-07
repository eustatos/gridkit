import type { EventBus } from './PluginEventBus';
import type { GridEvent } from './PluginEvents';
import { EventSandbox } from '../isolation/EventSandbox';

/**
 * PluginEventForwarder manages event sandboxes for plugins.
 * It creates isolated event buses with automatic cleanup and permission checks.
 */
export class PluginEventForwarder {
  private sandboxes = new Map<string, EventSandbox>();
  private baseBus: EventBus;

  constructor(baseBus: EventBus) {
    this.baseBus = baseBus;
  }

  /**
   * Creates a new event sandbox for a plugin.
   * @param pluginId - The unique identifier for the plugin
   * @param permissions - The permissions granted to this plugin
   * @returns The local event bus for the plugin
   * 
   * @example
   * ```typescript
   * const pluginBus = forwarder.createSandbox('plugin-1', ['emit:test']);
   * ```
   */
  createSandbox(pluginId: string, permissions: string[]): EventBus {
    const sandbox = new EventSandbox(pluginId, this.baseBus, permissions);
    this.sandboxes.set(pluginId, sandbox);
    return sandbox.getBus();
  }

  /**
   * Destroys a plugin's event sandbox and cleans up resources.
   * @param pluginId - The unique identifier for the plugin
   * 
   * @example
   * ```typescript
   * forwarder.destroySandbox('plugin-1');
   * ```
   */
  destroySandbox(pluginId: string): void {
    const sandbox = this.sandboxes.get(pluginId);
    if (sandbox) {
      sandbox.destroy();
      this.sandboxes.delete(pluginId);
    }
  }

  /**
   * Gets the event bus for a plugin's sandbox.
   * @param pluginId - The unique identifier for the plugin
   * @returns The local event bus for the plugin, or undefined if not found
   * 
   * @example
   * ```typescript
   * const pluginBus = forwarder.getSandbox('plugin-1');
   * ```
   */
  getSandbox(pluginId: string): EventBus | undefined {
    return this.sandboxes.get(pluginId)?.getBus();
  }
}