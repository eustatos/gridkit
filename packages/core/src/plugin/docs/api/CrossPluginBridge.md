# CrossPluginBridge

## Overview

`CrossPluginBridge` enables controlled communication between plugins through approved channels with proper event forwarding. It provides a secure mechanism for plugins to communicate with each other through approved channels.

## Features

- **Channel Creation**: Create communication channels between plugins
- **Event Forwarding**: Forward events between channels and plugins
- **Permission Checking**: Respect plugin permissions for channel communication
- **Memory Leak Prevention**: Proper cleanup of event subscriptions
- **Cycle Prevention**: Prevent infinite event loops

## Installation

```typescript
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';
```

## Usage

### Creating a Bridge

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

const baseBus = createEventBus();
const forwarder = new PluginEventForwarder(baseBus);
const bridge = new CrossPluginBridge(forwarder);

// Create sandboxes for plugins
forwarder.createSandbox('plugin-a', ['emit:*']);
forwarder.createSandbox('plugin-b', ['emit:*']);

// Create a channel for cross-plugin communication
const channelBus = bridge.createChannel('data-channel', ['plugin-a', 'plugin-b']);

// Plugin A can send to the channel
forwarder.getSandbox('plugin-a')?.emit('channel:data-channel:message', {
  from: 'plugin-a',
  data: 'hello',
});

// Plugin B can send to the channel
forwarder.getSandbox('plugin-b')?.emit('channel:data-channel:message', {
  from: 'plugin-b',
  data: 'world',
});
```

### Using Custom Event Types

```typescript
// Create channel with specific event types
const channelBus = bridge.createChannel('logging', ['plugin-a', 'plugin-b']);

// Plugins can emit custom event types
forwarder.getSandbox('plugin-a')?.emit('channel:logging:info', {
  message: 'Plugin A info',
});

forwarder.getSandbox('plugin-b')?.emit('channel:logging:error', {
  message: 'Plugin B error',
  stack: '...',
});
```

## API

### Constructor

```typescript
new CrossPluginBridge(forwarder: PluginEventForwarder)
```

Creates a new cross-plugin bridge.

#### Parameters

- `forwarder` (PluginEventForwarder): The plugin event forwarder to use for creating sandboxes

### Methods

#### createChannel()

```typescript
createChannel(channelId: string, allowedPlugins: string[]): EventBus
```

Creates a new communication channel for cross-plugin communication.

**Parameters**:

- `channelId` (string): The unique identifier for the channel
- `allowedPlugins` (string[]): The plugins allowed to participate in this channel

**Returns**: `EventBus` - The event bus for the channel

**Example**:

```typescript
const channelBus = bridge.createChannel('shared-channel', [
  'plugin-a',
  'plugin-b',
  'plugin-c',
]);

// Only plugin-a, plugin-b, and plugin-c can communicate on this channel
channelBus.on('channel:shared-channel:message', (event) => {
  console.log('Received:', event);
});
```

## Channel Event Format

Channel events follow the format: `channel:{channelId}:{eventType}`

Example:
```typescript
// Channel ID: 'data'
// Event type: 'message'
// Full event type: 'channel:data:message'
```

## Best Practices

### 1. Use Specific Plugin Lists

```typescript
// Good - explicit plugin list
const channelBus = bridge.createChannel('channel-1', ['plugin-a', 'plugin-b']);

// Bad - using wildcard permissions for all plugins
const allPlugins = ['plugin-a', 'plugin-b', 'plugin-c', 'plugin-d'];
const channelBus = bridge.createChannel('channel-1', allPlugins);
```

### 2. Clean Up Channels

```typescript
// Good
const channelBus = bridge.createChannel('temp-channel', ['plugin-a', 'plugin-b']);

// ... use channel ...

// Clean up when done
// Note: CrossPluginBridge doesn't have a destroyChannel method
// You need to manage channel lifecycle manually
```

### 3. Use Unique Channel IDs

```typescript
// Good - unique channel IDs
const channel1 = bridge.createChannel('plugin-a-to-b', ['plugin-a', 'plugin-b']);
const channel2 = bridge.createChannel('plugin-b-to-a', ['plugin-b', 'plugin-a']);

// Bad - reused channel IDs
const channel1 = bridge.createChannel('shared', ['plugin-a', 'plugin-b']);
const channel2 = bridge.createChannel('shared', ['plugin-c', 'plugin-d']);
```

### 4. Handle Channel Events

```typescript
const channelBus = bridge.createChannel('notifications', ['plugin-a', 'plugin-b']);

// Listen for channel messages
channelBus.on('channel:notifications:message', (event) => {
  // Process message from other plugin
  console.log('Notification:', event.payload);
});

// Listen for all channel events
channelBus.on('channel:notifications:*', (event) => {
  // Process all notification events
  console.log('Notification event:', event.type);
});
```

## Examples

### Basic Cross-Plugin Communication

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

class CrossPluginPlugin {
  private forwarder: PluginEventForwarder;
  private bridge: CrossPluginBridge;
  private channelBus: EventBus | null = null;

  constructor(private pluginId: string, otherPluginId: string) {
    const baseBus = createEventBus();
    this.forwarder = new PluginEventForwarder(baseBus);
    this.bridge = new CrossPluginBridge(this.forwarder);

    // Create sandbox for this plugin
    this.forwarder.createSandbox(this.pluginId, ['emit:*', 'receive:*']);

    // Create channel with other plugin
    const allowedPlugins = [this.pluginId, otherPluginId];
    this.channelBus = this.bridge.createChannel('communication', allowedPlugins);

    this.setupListeners();
  }

  private setupListeners(): void {
    // Listen for messages from other plugin
    this.channelBus?.on(`channel:communication:message`, (event) => {
      console.log(`Message from ${event.source}:`, event.payload);
      this.handleMessage(event.payload);
    });
  }

  public sendMessage(target: string, message: unknown): void {
    if (!this.channelBus) {
      console.error('Channel not initialized');
      return;
    }

    // Emit to channel
    this.channelBus.emit('channel:communication:message', {
      from: this.pluginId,
      to: target,
      message,
    });
  }

  private handleMessage(payload: unknown): void {
    // Process received message
  }
}
```

### Multi-Plugin Communication

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

class MultiPluginChat {
  private forwarder: PluginEventForwarder;
  private bridge: CrossPluginBridge;
  private plugins = new Map<string, EventBus>();

  constructor() {
    const baseBus = createEventBus();
    this.forwarder = new PluginEventForwarder(baseBus);
    this.bridge = new CrossPluginBridge(this.forwarder);
  }

  public async addPlugin(pluginId: string): Promise<void> {
    // Create sandbox for plugin
    this.forwarder.createSandbox(pluginId, ['emit:*', 'receive:*']);
    this.plugins.set(pluginId, this.forwarder.getSandbox(pluginId)!);

    // Create or update chat channel
    const allPlugins = Array.from(this.plugins.keys());
    const channelBus = this.bridge.createChannel('chat', allPlugins);

    // Setup plugin to listen on channel
    channelBus.on('channel:chat:message', (event) => {
      if (event.source?.includes(pluginId)) {
        return; // Skip our own messages
      }
      console.log(`[${event.source}] ${event.payload}`);
    });
  }

  public async removePlugin(pluginId: string): Promise<void> {
    this.forwarder.destroySandbox(pluginId);
    this.plugins.delete(pluginId);
  }

  public sendMessage(pluginId: string, message: unknown): void {
    const pluginBus = this.plugins.get(pluginId);
    const allPlugins = Array.from(this.plugins.keys());
    const channelBus = this.bridge.createChannel('chat', allPlugins);

    if (pluginBus && channelBus) {
      channelBus.emit('channel:chat:message', {
        from: pluginId,
        message,
      });
    }
  }

  public getOnlinePlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
```

### Private Communication Channels

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

class PrivateChannels {
  private forwarder: PluginEventForwarder;
  private bridge: CrossPluginBridge;

  constructor() {
    const baseBus = createEventBus();
    this.forwarder = new PluginEventForwarder(baseBus);
    this.bridge = new CrossPluginBridge(this.forwarder);
  }

  public createPrivateChannel(
    pluginId: string,
    allowedPlugins: string[]
  ): void {
    // Create sandbox for plugin
    this.forwarder.createSandbox(pluginId, ['emit:*', 'receive:*']);

    // Create private channel
    const channelBus = this.bridge.createChannel(
      `private-${pluginId}`,
      allowedPlugins
    );

    // Setup plugin to receive private messages
    channelBus.on(`channel:private-${pluginId}:*`, (event) => {
      console.log(`Private message to ${pluginId}:`, event.payload);
    });
  }

  public sendMessage(
    fromPlugin: string,
    toPlugin: string,
    message: unknown
  ): void {
    const channelBus = this.bridge.createChannel(
      `private-${toPlugin}`,
      [fromPlugin, toPlugin]
    );

    channelBus.emit(`channel:private-${toPlugin}:message`, {
      from: fromPlugin,
      message,
    });
  }
}
```

### Event Routing

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

class EventRouter {
  private forwarder: PluginEventForwarder;
  private bridge: CrossPluginBridge;

  constructor() {
    const baseBus = createEventBus();
    this.forwarder = new PluginEventForwarder(baseBus);
    this.bridge = new CrossPluginBridge(this.forwarder);
  }

  public routeEvent(
    fromPlugin: string,
    toPlugin: string,
    eventType: string,
    payload: unknown
  ): void {
    // Create channel for routing
    const channelBus = this.bridge.createChannel(
      `routing-${fromPlugin}-to-${toPlugin}`,
      [fromPlugin, toPlugin]
    );

    // Create unique event type
    const eventTypeId = `route:${fromPlugin}:${toPlugin}:${eventType}`;

    // Emit event with routing info
    channelBus.emit(eventTypeId, {
      from: fromPlugin,
      to: toPlugin,
      originalType: eventType,
      payload,
    });
  }

  public setupRoutingListener(
    pluginId: string,
    eventType: string,
    handler: (event: any) => void
  ): void {
    const channelBus = this.bridge.createChannel(
      `routing-to-${pluginId}`,
      ['*']
    );

    // Listen for events routed to this plugin
    channelBus.on(`route:*:${pluginId}:${eventType}`, (event) => {
      handler(event.payload);
    });
  }
}
```

## Related Documentation

- [PluginEventForwarder](./PluginEventForwarder.md) - Create and manage sandboxes
- [EventSandbox](./EventSandbox.md) - Sandbox implementation
- [Cross-Plugin Communication Guide](../guides/PluginSecurityGuide.md)

## See Also

- [Plugin Communication Patterns](../../../docs/PATTERNS.md)
- [Security Best Practices](../guides/PluginSecurityGuide.md)
