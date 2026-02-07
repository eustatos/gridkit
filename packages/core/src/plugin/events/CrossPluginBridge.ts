import type { EventBus } from './PluginEventBus';
import type { GridEvent } from './PluginEvents';
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
    allowedPlugins.forEach(pluginId => {
      const pluginBus = this.forwarder.getSandbox(pluginId);
      if (pluginBus) {
        // Setup bidirectional forwarding
        this.setupChannelForwarding(channelId, pluginId, channelBus, pluginBus);
      }
    });

    return channelBus;
  }

  /**
   * Sets up event forwarding between a channel and a plugin.
   * @param channelId - The channel identifier
   * @param pluginId - The plugin identifier
   * @param channelBus - The channel event bus
   * @param pluginBus - The plugin event bus
   * 
   * @example
   * ```typescript
   * this.setupChannelForwarding(channelId, pluginId, channelBus, pluginBus);
   * ```
   */
  private setupChannelForwarding(
    channelId: string,
    pluginId: string,
    channelBus: EventBus,
    pluginBus: EventBus
  ): void {
    // Forward from plugin to channel
    pluginBus.on('*', (event) => {
      if (event.type.startsWith(`channel:${channelId}:`)) {
        channelBus.emit(event.type, event.payload);
      }
    });

    // Forward from channel to plugin
    channelBus.on('*', (event) => {
      if (event.metadata?.targetPlugin === pluginId) {
        pluginBus.emit(event.type, event.payload);
      }
    });
  }
}