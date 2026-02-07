"# CORE006C-1: Plugin Event Sandbox System

## Task Card

```
task_id: CORE006C-1
priority: P0
complexity: Medium
estimated_tokens: ~4,000
ai_ready: yes
dependencies: [CORE-006A, CORE-006B]
requires_validation: true (event isolation)
```

## 🎯 **Objective**

Implement plugin-scoped event buses with automatic cleanup, event forwarding with permission checks, and isolated event namespaces. Create secure event isolation between plugins.

## 📋 **Implementation Scope**

### **1. Event Sandbox Implementation**

```typescript
// packages/core/src/plugin/isolation/EventSandbox.ts
export class EventSandbox {
  private pluginId: string;
  private baseBus: EventBus;
  private localBus = new EventBus();
  private permissions: Set<string>;

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

  private hasPermission(permission: string): boolean {
    return this.permissions.has(permission) || this.permissions.has('*');
  }

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

  // Public API
  getBus(): EventBus {
    return this.localBus;
  }

  destroy(): void {
    this.localBus.clear();
    // Clean up any references
  }
}
```

### **2. Event Forwarder Implementation**

```typescript
// packages/core/src/plugin/events/PluginEventForwarder.ts
export class PluginEventForwarder {
  private sandboxes = new Map<string, EventSandbox>();
  private baseBus: EventBus;

  constructor(baseBus: EventBus) {
    this.baseBus = baseBus;
  }

  createSandbox(pluginId: string, permissions: string[]): EventBus {
    const sandbox = new EventSandbox(pluginId, this.baseBus, permissions);
    this.sandboxes.set(pluginId, sandbox);
    return sandbox.getBus();
  }

  destroySandbox(pluginId: string): void {
    const sandbox = this.sandboxes.get(pluginId);
    if (sandbox) {
      sandbox.destroy();
      this.sandboxes.delete(pluginId);
    }
  }

  getSandbox(pluginId: string): EventBus | undefined {
    return this.sandboxes.get(pluginId)?.getBus();
  }
}
```

### **3. Cross-Plugin Bridge**

```typescript
// packages/core/src/plugin/events/CrossPluginBridge.ts
export class CrossPluginBridge {
  private channels = new Map<string, EventBus>();
  private forwarder: PluginEventForwarder;

  constructor(forwarder: PluginEventForwarder) {
    this.forwarder = forwarder;
  }

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
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No permission system implementation (CORE006C-2)
- ❌ No resource quotas (CORE006C-3)
- ❌ No complex ACL systems
- ❌ No user authentication

## 📁 **File Structure**

```
packages/core/src/plugin/isolation/
├── EventSandbox.ts           # Plugin-scoped event bus
└── index.ts

packages/core/src/plugin/events/
├── PluginEventForwarder.ts   # Event forwarding
├── CrossPluginBridge.ts      # Cross-plugin communication
└── index.ts
```

## 🧪 **Test Requirements**

```typescript
describe('Event Sandbox System', () => {
  test('creates isolated event bus for plugin', () => {
    const baseBus = createEventBus();
    const forwarder = new PluginEventForwarder(baseBus);
    const pluginBus = forwarder.createSandbox('plugin-1', ['emit:test']);

    expect(pluginBus).toBeDefined();
    expect(pluginBus).not.toBe(baseBus);
  });

  test('isolates events between plugins', () => {
    const baseBus = createEventBus();
    const forwarder = new PluginEventForwarder(baseBus);
    
    const plugin1Bus = forwarder.createSandbox('plugin-1', ['emit:test']);
    const plugin2Bus = forwarder.createSandbox('plugin-2', ['emit:test']);

    const plugin1Handler = jest.fn();
    const plugin2Handler = jest.fn();

    plugin1Bus.on('test', plugin1Handler);
    plugin2Bus.on('test', plugin2Handler);

    // Plugin 1 emits event
    plugin1Bus.emit('test', { data: 'from-plugin-1' });

    // Only plugin 1 should receive its own event
    expect(plugin1Handler).toHaveBeenCalled();
    expect(plugin2Handler).not.toHaveBeenCalled();
  });

  test('forwards events with permission', () => {
    const baseBus = createEventBus();
    const forwarder = new PluginEventForwarder(baseBus);
    const pluginBus = forwarder.createSandbox('plugin-1', ['emit:allowed']);

    const baseHandler = jest.fn();
    baseBus.on('allowed', baseHandler);
    baseBus.on('denied', baseHandler);

    pluginBus.emit('allowed', { data: 'allowed' });
    pluginBus.emit('denied', { data: 'denied' });

    expect(baseHandler).toHaveBeenCalledTimes(1);
    expect(baseHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'allowed',
        payload: { data: 'allowed' },
        source: 'plugin:plugin-1'
      })
    );
  });

  test('cleans up on destroy', () => {
    const baseBus = createEventBus();
    const forwarder = new PluginEventForwarder(baseBus);
    const pluginBus = forwarder.createSandbox('plugin-1', ['emit:test']);

    const handler = jest.fn();
    pluginBus.on('test', handler);

    forwarder.destroySandbox('plugin-1');
    
    // Should not be able to emit after destroy
    expect(() => pluginBus.emit('test', {})).toThrow();
  });
});
```

## 📊 **Success Metrics**

- ✅ Event isolation: Plugin A cannot intercept Plugin B's events
- ✅ Permission checks: Plugins only emit events they have permission for
- ✅ Cross-plugin communication: Works only through approved channels
- ✅ Resource cleanup: No memory leaks after plugin destruction
- ✅ Performance: < 0.1ms overhead for event forwarding

## 🎯 **AI Implementation Strategy**

1. **Start with EventSandbox** - basic isolation
2. **Implement PluginEventForwarder** - management layer
3. **Add CrossPluginBridge** - controlled communication
4. **Test isolation thoroughly** - ensure no leaks

**Critical:** The sandbox must prevent any direct event access between plugins without going through permission checks.

---

**Status:** Ready for implementation. Focus on event isolation and permission-based forwarding."