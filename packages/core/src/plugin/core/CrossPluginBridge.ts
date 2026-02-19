import { EventBus, EventPriority } from '../../events/core';
import { EventSandbox } from '../isolation';

import { PluginEventForwarder } from './PluginEventForwarder';

/**
 * CrossPluginBridge enables controlled communication between plugins
 * through approved channels with proper event forwarding.
 *
 * The cross-plugin bridge provides a secure mechanism for plugins to
 * communicate with each other through approved channels. It enforces
 * event type restrictions and adds cross-plugin metadata to events.
 *
 * @example
 * ```typescript
 * const bridge = new CrossPluginBridge(forwarder);
 * const channelBus = bridge.createChannel('data-channel', ['plugin-a', 'plugin-b']);
 * ```
 */
export class CrossPluginBridge {
  private channels = new Map<string, EventBus>();
  private channelSubscriptions = new Map<string, Array<() => void>>();
  private forwarder: PluginEventForwarder;

  constructor(forwarder: PluginEventForwarder) {
    this.forwarder = forwarder;
  }

  /**
   * Creates a new communication channel for cross-plugin communication.
   * @param channelId - The unique identifier for the channel
   * @param allowedPlugins - The plugins allowed to participate in this channel
   * @returns The event bus for the channel
   *
   * @example
   * ```typescript
   * const channelBus = bridge.createChannel('data-channel', ['plugin-a', 'plugin-b']);
   * ```
   */
  createChannel(channelId: string, allowedPlugins: string[]): EventBus {
    const channelBus = new EventBus();
    this.channels.set(channelId, channelBus);

    // Setup forwarding for allowed plugins
    allowedPlugins.forEach((pluginId) => {
      const sandbox = this.forwarder.getSandboxInstance(pluginId);
      if (sandbox) {
        this.setupChannelForwarding(channelId, pluginId, channelBus, sandbox);
      }
    });

    return channelBus;
  }

  /**
   * Sets up event forwarding between a channel and a plugin.
   * @param channelId - The channel identifier
   * @param pluginId - The plugin identifier
   * @param channelBus - The channel event bus
   * @param sandbox - The plugin's event sandbox
   *
   * @example
   * ```typescript
   * this.setupChannelForwarding(channelId, pluginId, channelBus, sandbox);
   * ```
   */
  private setupChannelForwarding(
    channelId: string,
    pluginId: string,
    channelBus: EventBus,
    sandbox: EventSandbox
  ): void {
    const baseBus = this.forwarder.getBaseBus();

    // Forward from plugin to channel (listening on base bus)
    // Only forward events that match the channel pattern
    const unsubBase = baseBus.on('*', (event) => {
      if (
        event.metadata?.pluginId === pluginId &&
        event.type.startsWith(`channel:${channelId}:`)
      ) {
        channelBus.emit(event.type, event.payload, {
          priority: EventPriority.IMMEDIATE,
          source: event.source,
          metadata: {
            ...event.metadata,
            targetPlugin: pluginId,
          },
        });
      }
    });

    // Forward from channel to plugin
    const unsubChannel = channelBus.on('*', (event) => {
      // Don't forward events that already came from plugins (prevent cycle)
      if (event.source && event.source.startsWith('plugin:')) {
        return;
      }
      
      // Forward to specific plugin if target is set
      if (event.metadata?.targetPlugin === pluginId) {
        const localBus = sandbox.getBus();
        localBus.emit(event.type, event.payload, {
          priority: EventPriority.IMMEDIATE,
        });
      }
    });

    // Store unsubscribe functions to prevent memory leaks
    this.channelSubscriptions.set(`${channelId}:${pluginId}`, [
      unsubBase,
      unsubChannel,
    ]);
  }
}
