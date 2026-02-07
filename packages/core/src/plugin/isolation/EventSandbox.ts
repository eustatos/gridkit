import type { EventBus } from '../../events/PluginEventBus';
import type { GridEvent } from '../../events/PluginEvents';

/**
 * EventSandbox provides isolated event handling for plugins.
 * Each plugin gets its own sandboxed event bus with permission-based filtering.
 * 
 * @example
 * ```typescript
 * const sandbox = new EventSandbox('my-plugin', baseBus, ['read:data', 'emit:events']);
 * const localBus = sandbox.getLocalBus();
 * localBus.on('my-event', (event) => {
 *   console.log('Received event:', event);
 * });
 * ```
 */
export class EventSandbox {
  private pluginId: string;
  private baseBus: EventBus;
  private localBus = new EventBus();
  private permissions: Set<string>;

  /**
   * Creates a new event sandbox for a plugin.
   * @param pluginId - The unique identifier for the plugin
   * @param baseBus - The base event bus to forward approved events to
   * @param permissions - The permissions granted to this plugin
   * 
   * @example
   * ```typescript
   * const sandbox = new EventSandbox('plugin-1', eventBus, ['read:data', 'write:config']);
   * ```
   */
  constructor(pluginId: string, baseBus: EventBus, permissions: string[]) {
    this.pluginId = pluginId;
    this.baseBus = baseBus;
    this.permissions = new Set(permissions);

    // Forward approved events from plugin to base bus
    this.localBus.on('*', (event) => {
      if (this.hasPermission(`emit:${event.type}`)) {
        const sandboxedEvent = this.sandboxEvent(event);
        this.baseBus.emit(sandboxedEvent.type, sandboxedEvent.payload);
      }
    });

    // Forward approved events from base bus to plugin
    this.baseBus.on('*', (event) => {
      if (this.canReceiveEvent(event.type)) {
        this.localBus.emit(event.type, event.payload);
      }
    });
  }

  /**
   * Checks if the plugin has permission to perform an action.
   * @param permission - The permission to check
   * @returns true if the plugin has the permission, false otherwise
   * 
   * @example
   * ```typescript
   * const hasPermission = sandbox.hasPermission('read:data');
   * ```
   */
  private hasPermission(permission: string): boolean {
    return this.permissions.has(permission) || this.permissions.has('*');
  }

  /**
   * Checks if the plugin can receive a specific event type.
   * @param eventType - The type of event to check
   * @returns true if the plugin can receive the event, false otherwise
   * 
   * @example
   * ```typescript
   * const canReceive = sandbox.canReceiveEvent('data-update');
   * ```
   */
  private canReceiveEvent(eventType: string): boolean {
    // Plugins can receive events they have permission for
    return this.hasPermission(`receive:${eventType}`) || this.hasPermission('*');
  }

  /**
   * Wraps an event with sandbox metadata.
   * @param event - The event to sandbox
   * @returns The sandboxed event
   * 
   * @example
   * ```typescript
   * const sandboxedEvent = sandbox.sandboxEvent(event);
   * ```
   */
  private sandboxEvent(event: GridEvent): GridEvent {
    return {
      ...event,
      source: `plugin:${this.pluginId}`,
      metadata: {
        ...event.metadata,
        sandboxed: true,
        pluginId: this.pluginId,
      },
    };
  }

  /**
   * Gets the local event bus for this plugin.
   * @returns The local event bus
   * 
   * @example
   * ```typescript
   * const localBus = sandbox.getLocalBus();
   * localBus.on('my-event', handler);
   * ```
   */
  public getLocalBus(): EventBus {
    return this.localBus;
  }

  /**
   * Cleans up the event sandbox, removing all event listeners.
   * 
   * @example
   * ```typescript
   * sandbox.destroy();
   * ```
   */
  public destroy(): void {
    this.localBus.clear();
    // Note: We don't clear the baseBus listeners as they're managed elsewhere
  }
}