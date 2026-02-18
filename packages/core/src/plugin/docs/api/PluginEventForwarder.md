# PluginEventForwarder

## Overview

`PluginEventForwarder` manages event sandboxes for plugins. It creates isolated event buses with automatic cleanup and permission checks. This class acts as a central manager for all plugin event isolation.

## Features

- **Sandbox Management**: Create and manage event sandboxes
- **Automatic Cleanup**: Clean up resources when sandboxes are destroyed
- **Permission Enforcement**: Enforce permissions through sandboxes
- **Sandbox Lookup**: Get sandboxes by plugin ID
- **Base Bus Access**: Access to the underlying base event bus

## Installation

```typescript
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
```

## Usage

### Creating a Forwarder

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';

const baseBus = createEventBus();
const forwarder = new PluginEventForwarder(baseBus);

// Create a sandbox for a plugin
const pluginBus = forwarder.createSandbox('plugin-1', ['emit:*', 'receive:*']);

// Plugin uses its local bus
pluginBus.on('event', (e) => {
  console.log('Received:', e);
});

// Destroy sandbox when plugin is unloaded
forwarder.destroySandbox('plugin-1');
```

### Creating Multiple Plugins

```typescript
// Create sandboxes for multiple plugins
const pluginABus = forwarder.createSandbox('plugin-a', ['emit:data:*']);
const pluginBBus = forwarder.createSandbox('plugin-b', ['emit:config:*']);

// Each plugin is isolated
pluginABus.emit('data:read', {}); // Forwarded
pluginABus.emit('config:write', {}); // NOT forwarded (no permission)

pluginBBus.emit('config:read', {}); // Forwarded
pluginBBus.emit('data:write', {}); // NOT forwarded (no permission)
```

### Accessing Sandbox Instances

```typescript
// Get the local bus for a plugin
const pluginBus = forwarder.getSandbox('plugin-1');

// Get the full sandbox instance
const sandbox = forwarder.getSandboxInstance('plugin-1');
if (sandbox) {
  // Access sandbox-specific methods
  const localBus = sandbox.getBus();
}

// Get the base bus
const baseBus = forwarder.getBaseBus();
```

## API

### Constructor

```typescript
new PluginEventForwarder(baseBus: EventBus)
```

Creates a new plugin event forwarder.

#### Parameters

- `baseBus` (EventBus): The base event bus to forward approved events to

### Methods

#### createSandbox()

```typescript
createSandbox(pluginId: string, permissions: string[]): EventBus
```

Creates a new event sandbox for a plugin.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin
- `permissions` (string[]): The permissions granted to this plugin

**Returns**: `EventBus` - The local event bus for the plugin

**Example**:

```typescript
const pluginBus = forwarder.createSandbox('plugin-1', ['emit:*']);
pluginBus.on('event', handler);
```

#### destroySandbox()

```typescript
destroySandbox(pluginId: string): void
```

Destroys a plugin's event sandbox and cleans up resources.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin

**Example**:

```typescript
forwarder.destroySandbox('plugin-1');
```

#### getSandbox()

```typescript
getSandbox(pluginId: string): EventBus | undefined
```

Gets the event bus for a plugin's sandbox.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin

**Returns**: `EventBus | undefined` - The local event bus for the plugin, or undefined if not found

**Example**:

```typescript
const pluginBus = forwarder.getSandbox('plugin-1');
if (pluginBus) {
  pluginBus.emit('event', data);
}
```

#### getSandboxInstance()

```typescript
getSandboxInstance(pluginId: string): EventSandbox | undefined
```

Gets the event sandbox for a plugin.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin

**Returns**: `EventSandbox | undefined` - The event sandbox for the plugin, or undefined if not found

**Example**:

```typescript
const sandbox = forwarder.getSandboxInstance('plugin-1');
if (sandbox) {
  // Access sandbox methods
}
```

#### getBaseBus()

```typescript
getBaseBus(): EventBus
```

Gets the base event bus used by this forwarder.

**Returns**: `EventBus` - The base event bus

**Example**:

```typescript
const baseBus = forwarder.getBaseBus();
baseBus.on('*', (event) => {
  console.log('Base bus event:', event);
});
```

## Usage with CrossPluginBridge

```typescript
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

const baseBus = createEventBus();
const forwarder = new PluginEventForwarder(baseBus);
const bridge = new CrossPluginBridge(forwarder);

// Create sandboxes
forwarder.createSandbox('plugin-a', ['emit:*']);
forwarder.createSandbox('plugin-b', ['emit:*']);

// Create communication channel
const channelBus = bridge.createChannel('shared', ['plugin-a', 'plugin-b']);
```

## Best Practices

### 1. Create Forwarder Once

```typescript
// Good - single forwarder for all plugins
const forwarder = new PluginEventForwarder(baseBus);

// Bad - multiple forwarders
const forwarderA = new PluginEventForwarder(baseBus);
const forwarderB = new PluginEventForwarder(baseBus);
```

### 2. Clean Up on Plugin Unload

```typescript
// Good
function unloadPlugin(pluginId: string): void {
  forwarder.destroySandbox(pluginId);
}

// Bad
function unloadPlugin(pluginId: string): void {
  // No cleanup!
}
```

### 3. Check Sandbox Existence

```typescript
// Good
const pluginBus = forwarder.getSandbox('plugin-1');
if (pluginBus) {
  pluginBus.emit('event', data);
}

// Bad
const pluginBus = forwarder.getSandbox('plugin-1')!;
pluginBus.emit('event', data); // May throw if sandbox doesn't exist
```

### 4. Use Permissions for Security

```typescript
// Good - narrow permissions
const pluginBus = forwarder.createSandbox('plugin-1', [
  'emit:data:*',
  'receive:ui:*',
]);

// Bad - overly broad permissions
const pluginBus = forwarder.createSandbox('plugin-1', ['*']);
```

## Examples

### Plugin Lifecycle Management

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';

class PluginManager {
  private forwarder: PluginEventForwarder;

  constructor() {
    const baseBus = createEventBus();
    this.forwarder = new PluginEventForwarder(baseBus);
  }

  public loadPlugin(pluginId: string, permissions: string[]): EventBus {
    return this.forwarder.createSandbox(pluginId, permissions);
  }

  public unloadPlugin(pluginId: string): void {
    this.forwarder.destroySandbox(pluginId);
  }

  public emitToPlugin(pluginId: string, type: string, payload: unknown): void {
    const pluginBus = this.forwarder.getSandbox(pluginId);
    if (pluginBus) {
      pluginBus.emit(type, payload);
    }
  }
}
```

### Integration with Plugin System

```typescript
import { createEventBus } from '@gridkit/events';
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

class PluginSystem {
  private forwarder: PluginEventForwarder;
  private bridge: CrossPluginBridge;
  private plugins = new Map<string, EventBus>();

  constructor() {
    const baseBus = createEventBus();
    this.forwarder = new PluginEventForwarder(baseBus);
    this.bridge = new CrossPluginBridge(this.forwarder);
  }

  public async registerPlugin(
    pluginId: string,
    permissions: string[]
  ): Promise<void> {
    const pluginBus = this.forwarder.createSandbox(pluginId, permissions);
    this.plugins.set(pluginId, pluginBus);

    // Create cross-plugin channels
    const channel = this.bridge.createChannel(`${pluginId}-events`, [
      pluginId,
    ]);

    // Register plugin handlers
    this.setupPluginHandlers(pluginId, pluginBus);
  }

  public async unregisterPlugin(pluginId: string): Promise<void> {
    this.forwarder.destroySandbox(pluginId);
    this.plugins.delete(pluginId);
  }

  private setupPluginHandlers(
    pluginId: string,
    pluginBus: EventBus
  ): void {
    pluginBus.on('plugin:ready', () => {
      console.log(`Plugin ${pluginId} is ready`);
    });

    pluginBus.on('plugin:error', (event) => {
      console.error(`Plugin ${pluginId} error:`, event.payload);
    });
  }

  public getPluginBus(pluginId: string): EventBus | undefined {
    return this.plugins.get(pluginId);
  }
}
```

### Manual Sandbox Management

```typescript
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';

class ManualSandboxManager {
  private forwarder: PluginEventForwarder;
  private activeSandboxes = new Map<string, boolean>();

  constructor(baseBus: EventBus) {
    this.forwarder = new PluginEventForwarder(baseBus);
  }

  public activateSandbox(pluginId: string, permissions: string[]): void {
    if (this.activeSandboxes.has(pluginId)) {
      return; // Already active
    }

    this.forwarder.createSandbox(pluginId, permissions);
    this.activeSandboxes.set(pluginId, true);
  }

  public deactivateSandbox(pluginId: string): void {
    if (!this.activeSandboxes.has(pluginId)) {
      return;
    }

    this.forwarder.destroySandbox(pluginId);
    this.activeSandboxes.delete(pluginId);
  }

  public isSandboxActive(pluginId: string): boolean {
    return this.activeSandboxes.has(pluginId);
  }

  public getAllActiveSandboxes(): string[] {
    return Array.from(this.activeSandboxes.keys());
  }
}
```

## Related Documentation

- [EventSandbox](./EventSandbox.md) - Event sandbox implementation
- [CrossPluginBridge](./CrossPluginBridge.md) - Cross-plugin communication
- [EventIsolationSecurityGuide](../guides/PluginSecurityGuide.md) - Security best practices

## See Also

- [Plugin System Architecture](../../../docs/PLUGINS.md)
- [Cross-Plugin Communication Guide](../guides/PluginSecurityGuide.md)
