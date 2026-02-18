# Cross-Plugin Communication Example

This example demonstrates how to set up secure communication between plugins using CrossPluginBridge.

## Plugin Setup

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  PluginEventForwarder,
  CrossPluginBridge,
} from '@gridkit/plugin';

class PluginA {
  private bus: EventBus;
  private pluginId: string = 'plugin-a';

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  public onMessage(handler: (data: unknown) => void): void {
    this.bus.on('channel:shared:message', (event) => {
      handler(event.payload);
    });
  }

  public sendMessage(message: unknown): void {
    this.bus.emit('channel:shared:message', {
      from: this.pluginId,
      message,
    }, { priority: EventPriority.NORMAL });
  }
}

class PluginB {
  private bus: EventBus;
  private pluginId: string = 'plugin-b';

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  public onMessage(handler: (data: unknown) => void): void {
    this.bus.on('channel:shared:message', (event) => {
      handler(event.payload);
    });
  }

  public sendMessage(message: unknown): void {
    this.bus.emit('channel:shared:message', {
      from: this.pluginId,
      message,
    }, { priority: EventPriority.NORMAL });
  }
}

// Setup plugins
const baseBus = createEventBus();
const pluginA = new PluginA(baseBus);
const pluginB = new PluginB(baseBus);

// Setup handlers
pluginA.onMessage((data) => {
  console.log('Plugin A received:', data);
});

pluginB.onMessage((data) => {
  console.log('Plugin B received:', data);
});

// Plugin A sends message to shared channel
pluginA.sendMessage('Hello from Plugin A');

// Plugin B sends message to shared channel
pluginB.sendMessage('Hello from Plugin B');
```

## Cross-Plugin Bridge Setup

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  PluginEventForwarder,
  CrossPluginBridge,
  EventSandbox,
} from '@gridkit/plugin';

// Setup event system
const baseBus = createEventBus();
const forwarder = new PluginEventForwarder(baseBus);
const bridge = new CrossPluginBridge(forwarder);

// Create sandboxes for plugins
forwarder.createSandbox('plugin-a', ['emit:*', 'receive:*']);
forwarder.createSandbox('plugin-b', ['emit:*', 'receive:*']);

// Create communication channel
const channelBus = bridge.createChannel('shared', ['plugin-a', 'plugin-b']);

// Plugin A listens on channel
channelBus.on('channel:shared:message', (event) => {
  console.log('Plugin A received:', event.payload);
});

// Plugin B listens on channel
channelBus.on('channel:shared:message', (event) => {
  console.log('Plugin B received:', event.payload);
});

// Plugin A sends to channel
forwarder.getSandbox('plugin-a')?.emit(
  'channel:shared:message',
  { from: 'plugin-a', message: 'Hello from A' },
  { priority: EventPriority.NORMAL }
);

// Plugin B sends to channel
forwarder.getSandbox('plugin-b')?.emit(
  'channel:shared:message',
  { from: 'plugin-b', message: 'Hello from B' },
  { priority: EventPriority.NORMAL }
);
```

## Multi-Plugin Chat System

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  PluginEventForwarder,
  CrossPluginBridge,
} from '@gridkit/plugin';

class ChatSystem {
  private forwarder: PluginEventForwarder;
  private bridge: CrossPluginBridge;
  private plugins = new Map<string, EventBus>();
  private channelBus: EventBus;

  constructor() {
    const baseBus = createEventBus();
    this.forwarder = new PluginEventForwarder(baseBus);
    this.bridge = new CrossPluginBridge(this.forwarder);
  }

  public async registerPlugin(pluginId: string): Promise<void> {
    // Create sandbox for plugin
    this.forwarder.createSandbox(pluginId, ['emit:*', 'receive:*']);
    this.plugins.set(pluginId, this.forwarder.getSandbox(pluginId)!);

    // Get all current plugins
    const allPlugins = Array.from(this.plugins.keys());

    // Create or update chat channel
    this.channelBus = this.bridge.createChannel('chat', allPlugins);

    // Setup plugin to receive chat messages
    this.channelBus.on('channel:chat:message', (event) => {
      if (event.source?.includes(pluginId)) {
        return; // Skip our own messages
      }
      console.log(`[${event.source}] ${event.payload}`);
    });
  }

  public async unregisterPlugin(pluginId: string): Promise<void> {
    this.forwarder.destroySandbox(pluginId);
    this.plugins.delete(pluginId);
  }

  public sendMessage(pluginId: string, message: unknown): void {
    const allPlugins = Array.from(this.plugins.keys());
    this.channelBus = this.bridge.createChannel('chat', allPlugins);

    this.channelBus.emit('channel:chat:message', {
      from: pluginId,
      message,
    }, { priority: EventPriority.NORMAL });
  }

  public getOnlinePlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// Usage
const chat = new ChatSystem();

chat.registerPlugin('alice').then(() => {
  chat.registerPlugin('bob').then(() => {
    // Send messages
    chat.sendMessage('alice', 'Hello Bob!');
    chat.sendMessage('bob', 'Hello Alice!');
  });
});
```

## Private Channels

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  PluginEventForwarder,
  CrossPluginBridge,
} from '@gridkit/plugin';

class PrivateChannelSystem {
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
  ): EventBus {
    // Create sandbox for plugin
    this.forwarder.createSandbox(pluginId, ['emit:*', 'receive:*']);

    // Create private channel
    return this.bridge.createChannel(
      `private-${pluginId}`,
      allowedPlugins
    );
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

    channelBus.emit('channel:private-message', {
      from: fromPlugin,
      message,
    }, { priority: EventPriority.NORMAL });
  }
}

// Usage
const system = new PrivateChannelSystem();

// Plugin A creates private channel with Plugin B
const channelBus = system.createPrivateChannel('plugin-a', ['plugin-b']);

// Plugin A sends private message to Plugin B
system.sendMessage('plugin-a', 'plugin-b', 'Secret message');
```

## Event Routing

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  PluginEventForwarder,
  CrossPluginBridge,
} from '@gridkit/plugin';

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
    const channelBus = this.bridge.createChannel(
      `routing-${fromPlugin}-to-${toPlugin}`,
      [fromPlugin, toPlugin]
    );

    // Create unique event type for routing
    const eventTypeId = `route:${fromPlugin}:${toPlugin}:${eventType}`;

    channelBus.emit(eventTypeId, {
      from: fromPlugin,
      to: toPlugin,
      originalType: eventType,
      payload,
    }, { priority: EventPriority.NORMAL });
  }

  public setupRoutingListener(
    pluginId: string,
    eventType: string,
    handler: (event: any) => void
  ): void {
    const allPlugins = Array.from(this.forwarder.getSandboxes().keys());
    const channelBus = this.bridge.createChannel(
      `routing-to-${pluginId}`,
      allPlugins
    );

    // Listen for events routed to this plugin
    channelBus.on(`route:*:${pluginId}:${eventType}`, (event) => {
      handler(event.payload);
    });
  }
}

// Usage
const router = new EventRouter();

// Setup listener
router.setupRoutingListener('plugin-b', 'data', (data) => {
  console.log('Plugin B received data:', data);
});

// Plugin A sends data to Plugin B
router.routeEvent('plugin-a', 'plugin-b', 'data', { key: 'value' });
```

## Features Demonstrated

1. **Event Isolation**: Each plugin has isolated event handling
2. **Permission Enforcement**: Plugins can only emit/receive permitted events
3. **Channel Creation**: Create channels for specific plugin groups
4. **Event Forwarding**: Events are forwarded between channels and plugins
5. **Memory Leak Prevention**: Proper cleanup of event subscriptions
6. **Cycle Prevention**: Prevent infinite event loops

## Benefits

- **Security**: Events are properly isolated and validated
- **Control**: Only allowed plugins can communicate
- **Flexibility**: Multiple channels for different communication patterns
- **Efficiency**: Direct communication between plugins
- **Reliability**: Proper error handling and cleanup
