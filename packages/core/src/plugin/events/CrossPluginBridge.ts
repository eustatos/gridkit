import type { EventBus } from './PluginEventBus';
import type { GridEvent } from './PluginEvents';

/**
 * CrossPluginBridge enables controlled communication between plugins
 * through approved channels.
 * 
 * The cross-plugin bridge provides a secure mechanism for plugins to
 * communicate with each other through approved channels. It enforces
 * event type restrictions and adds cross-plugin metadata to events.
 * 
 * @example
 * ```typescript
 * const bridge = new CrossPluginBridge();
 * bridge.registerPlugin('plugin-a', pluginABus);
 * bridge.registerPlugin('plugin-b', pluginBBus);
 * 
 * bridge.approveChannel('plugin-a', 'plugin-b', ['data-request', 'data-response']);
 * ```
 */
export class CrossPluginBridge {
  private eventBuses = new Map<string, EventBus>();
  private approvedChannels = new Map<string, Set<string>>();

  /**
   * Registers a plugin's event bus with the bridge.
   * 
   * This method registers a plugin's event bus with the bridge,
   * allowing it to participate in cross-plugin communication.
   * 
   * @param pluginId - The plugin identifier
   * @param eventBus - The plugin's event bus
   * 
   * @example
   * ```typescript
   * bridge.registerPlugin('plugin-a', pluginABus);
   * ```
   */
  public registerPlugin(pluginId: string, eventBus: EventBus): void {
    this.eventBuses.set(pluginId, eventBus);
  }

  /**
   * Unregisters a plugin from the bridge.
   * 
   * This method unregisters a plugin from the bridge,
   * removing its ability to participate in cross-plugin communication.
   * 
   * @param pluginId - The plugin identifier
   * 
   * @example
   * ```typescript
   * bridge.unregisterPlugin('plugin-a');
   * ```
   */
  public unregisterPlugin(pluginId: string): void {
    this.eventBuses.delete(pluginId);
    this.approvedChannels.delete(pluginId);
  }

  /**
   * Approves a communication channel between two plugins.
   * 
   * This method approves a communication channel between two plugins,
   * specifying which event types can be sent between them.
   * 
   * @param sourcePluginId - The source plugin identifier
   * @param targetPluginId - The target plugin identifier
   * @param eventTypes - The event types allowed on this channel
   * 
   * @example
   * ```typescript
   * bridge.approveChannel('plugin-a', 'plugin-b', ['data-request', 'data-response']);
   * ```
   */
  public approveChannel(
    sourcePluginId: string,
    targetPluginId: string,
    eventTypes: string[]
  ): void {
    const channelKey = `${sourcePluginId}->${targetPluginId}`;
    
    if (!this.approvedChannels.has(channelKey)) {
      this.approvedChannels.set(channelKey, new Set());
    }
    
    const channel = this.approvedChannels.get(channelKey)!;
    for (const eventType of eventTypes) {
      channel.add(eventType);
    }
    
    // Set up event forwarding
    const sourceBus = this.eventBuses.get(sourcePluginId);
    const targetBus = this.eventBuses.get(targetPluginId);
    
    if (sourceBus && targetBus) {
      this.setupChannelForwarding(sourceBus, targetBus, channelKey, channel);
    }
  }

  /**
   * Revokes a communication channel between two plugins.
   * 
   * This method revokes a previously approved communication channel
   * between two plugins.
   * 
   * @param sourcePluginId - The source plugin identifier
   * @param targetPluginId - The target plugin identifier
   * 
   * @example
   * ```typescript
   * bridge.revokeChannel('plugin-a', 'plugin-b');
   * ```
   */
  public revokeChannel(
    sourcePluginId: string,
    targetPluginId: string
  ): void {
    const channelKey = `${sourcePluginId}->${targetPluginId}`;
    this.approvedChannels.delete(channelKey);
  }

  /**
   * Checks if a communication channel is approved.
   * 
   * This method checks if a communication channel between two plugins
   * is approved for a specific event type.
   * 
   * @param sourcePluginId - The source plugin identifier
   * @param targetPluginId - The target plugin identifier
   * @param eventType - The event type to check
   * @returns true if the channel is approved, false otherwise
   * 
   * @example
   * ```typescript
   * if (bridge.isChannelApproved('plugin-a', 'plugin-b', 'data-request')) {
   *   // Channel is approved
   * }
   * ```
   */
  public isChannelApproved(
    sourcePluginId: string,
    targetPluginId: string,
    eventType: string
  ): boolean {
    const channelKey = `${sourcePluginId}->${targetPluginId}`;
    
    if (!this.approvedChannels.has(channelKey)) {
      return false;
    }
    
    const channel = this.approvedChannels.get(channelKey)!;
    return channel.has(eventType) || channel.has('*');
  }

  /**
   * Sets up event forwarding for an approved channel.
   * 
   * This method sets up event forwarding between two plugins for
   * an approved communication channel, adding cross-plugin metadata
   * to forwarded events.
   * 
   * @param sourceBus - The source event bus
   * @param targetBus - The target event bus
   * @param channelKey - The channel key
   * @param allowedEvents - The allowed events for this channel
   * 
   * @example
   * ```typescript
   * this.setupChannelForwarding(sourceBus, targetBus, channelKey, allowedEvents);
   * ```
   */
  private setupChannelForwarding(
    sourceBus: EventBus,
    targetBus: EventBus,
    channelKey: string,
    allowedEvents: Set<string>
  ): void {
    // Forward events from source to target
    sourceBus.on('*', (event) => {
      // Extract source plugin ID from event source
      const eventSourcePluginId = this.extractPluginIdFromSource(event.source);
      
      // Extract target plugin ID from channel key
      const [, targetPluginId] = channelKey.split('->');
      
      // Check if this event is allowed on the channel
      if (eventSourcePluginId && allowedEvents.has(event.type)) {
        // Add cross-plugin metadata
        const crossPluginEvent: GridEvent = {
          ...event,
          source: event.source || `plugin:${eventSourcePluginId}`,
          metadata: {
            ...event.metadata,
            crossPlugin: true,
            sourcePlugin: eventSourcePluginId,
            targetPlugin: targetPluginId,
          },
        };
        
        targetBus.emit(crossPluginEvent.type, crossPluginEvent.payload);
      }
    });
  }

  /**
   * Extracts plugin ID from event source.
   * 
   * This method extracts the plugin ID from an event source string
   * in the format "plugin:{id}".
   * 
   * @param source - The event source
   * @returns The plugin ID or null if not found
   * 
   * @example
   * ```typescript
   * const pluginId = this.extractPluginIdFromSource('plugin:plugin-a');
   * ```
   */
  private extractPluginIdFromSource(source: string | undefined): string | null {
    if (!source) return null;
    
    // Handle plugin source format: plugin:{id}
    if (source.startsWith('plugin:')) {
      return source.substring(7); // Remove 'plugin:' prefix
    }
    
    return null;
  }
}