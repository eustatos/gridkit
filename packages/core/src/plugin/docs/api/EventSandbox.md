# EventSandbox

## Overview

`EventSandbox` provides isolated event handling for plugins. Each plugin gets its own sandboxed event bus with permission-based filtering. The sandbox ensures that plugins can only emit and receive events they have permission for, preventing interference between plugins and protecting the core system.

## Features

- **Event Isolation**: Each plugin has its own event bus that is isolated from other plugins
- **Permission-Based Filtering**: Events are filtered based on plugin permissions
- **Security Sanitization**: Event payloads are sanitized to prevent code injection
- **Metadata Protection**: Plugin source metadata cannot be forged
- **Automatic Cleanup**: Proper resource cleanup when destroyed

## Installation

```typescript
import { EventSandbox } from '@gridkit/plugin/isolation/EventSandbox';
```

## Usage

### Creating a Sandbox

```typescript
import { createEventBus, EventPriority } from '@gridkit/events';
import { EventSandbox } from '@gridkit/plugin/isolation/EventSandbox';

// Create base event bus
const baseBus = createEventBus();

// Create a sandbox with wildcard permissions
const sandbox = new EventSandbox('my-plugin', baseBus, ['*']);

// Get the local event bus for the plugin
const localBus = sandbox.getBus();

// Use the local bus like any other EventBus
localBus.on('my-event', (event) => {
  console.log('Received event:', event);
});

// Emit events (they will be forwarded to base bus if permitted)
localBus.emit('test-event', { data: 'test' }, { priority: EventPriority.NORMAL });
```

### Creating a Sandbox with Specific Permissions

```typescript
// Create a sandbox with specific permissions
const sandbox = new EventSandbox('data-plugin', baseBus, [
  'emit:data:*',      // Can emit events with types starting with 'data:'
  'receive:config:*', // Can receive events with types starting with 'config:'
]);

const localBus = sandbox.getBus();

// This will be forwarded (has 'emit:data:*' permission)
localBus.emit('data:read', { query: 'SELECT * FROM users' });

// This will NOT be forwarded (no 'emit:config:*' permission)
localBus.emit('config:update', { setting: 'theme' });

// Listen for config events (has 'receive:config:*' permission)
localBus.on('config:update', (event) => {
  console.log('Config updated:', event.payload);
});
```

### Cleaning Up

```typescript
// Always destroy the sandbox when done to clean up event listeners
sandbox.destroy();

// After destruction, the local bus will not forward events
localBus.emit('test', {}); // Will not be forwarded
```

## API

### Constructor

```typescript
new EventSandbox(
  pluginId: string,
  baseBus: EventBus,
  permissions: string[]
)
```

Creates a new event sandbox for a plugin.

#### Parameters

- `pluginId` (string): The unique identifier for the plugin. This is used to tag events with the source plugin.
- `baseBus` (EventBus): The base event bus to forward approved events to. This is typically the global event bus.
- `permissions` (string[]): The permissions granted to this plugin. Supports exact matches and wildcard patterns.

#### Permissions Format

Permissions follow the format `action:category:*` or `action:category:resource`:

- `*` - Wildcard (grants all permissions)
- `emit:*` - Can emit any event
- `receive:*` - Can receive any event
- `emit:data:*` - Can emit events in the data category
- `receive:config:*` - Can receive events in the config category
- `emit:data:read` - Can emit only data:read events

### Methods

#### getBus()

```typescript
getBus(): EventBus
```

Returns the local event bus for this plugin.

**Returns**: `EventBus` - The local event bus that the plugin can use

**Example**:

```typescript
const sandbox = new EventSandbox('plugin-1', baseBus, ['*']);
const pluginBus = sandbox.getBus();

pluginBus.on('test', handler);
pluginBus.emit('test', { data: 'test' });
```

#### destroy()

```typescript
destroy(): void
```

Cleans up the event sandbox, removing all event listeners from both the local bus and the base bus.

**Example**:

```typescript
const sandbox = new EventSandbox('plugin-1', baseBus, ['*']);

// ... use the sandbox ...

// Clean up when done
sandbox.destroy();
```

## Security Features

### Payload Sanitization

Event payloads are automatically sanitized to remove potentially dangerous content:

- Functions and async functions are removed
- Symbols are removed
- Circular references are detected and replaced with `'<Circular Reference>'`
- Promises are converted to strings to prevent execution
- Prototype pollution properties (`__proto__`, `constructor`, `prototype`) are removed

### Source Metadata Protection

Plugins cannot forge their source metadata. All events from the sandbox are tagged with:

- `source`: Set to `plugin:{pluginId}` format
- `metadata.sandboxed`: Set to `true`
- `metadata.pluginId`: Set to the plugin's ID

### Infinite Loop Prevention

The sandbox prevents infinite loops by:
- Not forwarding events that already came from the base bus
- Not forwarding sandboxed events back to plugins
- Not forwarding events from one plugin to another plugin's sandbox

## Best Practices

### 1. Always Destroy Sandboxes

```typescript
// Good
const sandbox = new EventSandbox('plugin-1', baseBus, ['*']);
try {
  // ... use sandbox ...
} finally {
  sandbox.destroy();
}
```

### 2. Use Specific Permissions

```typescript
// Good - narrow permissions
const sandbox = new EventSandbox('plugin-1', baseBus, [
  'emit:data:*',
  'receive:config:*',
]);

// Bad - overly broad permissions
const sandbox = new EventSandbox('plugin-1', baseBus, ['*']);
```

### 3. Handle Permission Errors Gracefully

```typescript
// Check permissions before emitting
if (sandbox.hasPermission('emit:data:*')) {
  localBus.emit('data:read', query);
}
```

### 4. Use Wildcards Sparingly

```typescript
// Avoid in production
const sandbox = new EventSandbox('plugin-1', baseBus, ['*']);

// Prefer explicit permissions
const sandbox = new EventSandbox('plugin-1', baseBus, [
  'emit:data:read',
  'emit:data:write',
  'receive:ui:*',
]);
```

## Examples

### Basic Plugin with Event Isolation

```typescript
import { createEventBus, EventPriority } from '@gridkit/events';
import { EventSandbox } from '@gridkit/plugin/isolation/EventSandbox';

class DataPlugin {
  private sandbox: EventSandbox;
  private localBus: EventBus;

  constructor(baseBus: EventBus) {
    this.sandbox = new EventSandbox('data-plugin', baseBus, [
      'emit:data:*',
      'receive:ui:*',
    ]);
    this.localBus = this.sandbox.getBus();
    
    this.setupListeners();
  }

  private setupListeners(): void {
    // Listen for UI events
    this.localBus.on('ui:refresh', () => {
      this.refreshData();
    });
  }

  public refreshData(): void {
    // Emit data events
    this.localBus.emit('data:refresh', {}, { priority: EventPriority.NORMAL });
  }

  public destroy(): void {
    this.sandbox.destroy();
  }
}
```

### Cross-Plugin Communication

```typescript
import { PluginEventForwarder } from '@gridkit/plugin/events/PluginEventForwarder';
import { CrossPluginBridge } from '@gridkit/plugin/events/CrossPluginBridge';

const baseBus = createEventBus();
const forwarder = new PluginEventForwarder(baseBus);

// Create sandboxes
const pluginASandbox = forwarder.createSandbox('plugin-a', ['emit:*']);
const pluginBSandbox = forwarder.createSandbox('plugin-b', ['emit:*']);

// Create communication bridge
const bridge = new CrossPluginBridge(forwarder);
const channelBus = bridge.createChannel('shared-channel', ['plugin-a', 'plugin-b']);

// Plugin A can send to channel
pluginASandbox.getBus().emit('channel:shared-channel:message', { 
  from: 'plugin-a' 
});

// Plugin B can send to channel
pluginBSandbox.getBus().emit('channel:shared-channel:message', { 
  from: 'plugin-b' 
});
```

## Related Documentation

- [PermissionManager](./PermissionManager.md) - Manage plugin permissions
- [QuotaManager](./QuotaManager.md) - Enforce resource quotas
- [EventValidator](./EventValidator.md) - Validate and sanitize events
- [ErrorBoundary](./ErrorBoundary.md) - Catch and handle plugin errors
- [ResourceMonitor](./ResourceMonitor.md) - Monitor resource usage
- [PluginEventForwarder](./PluginEventForwarder.md) - Manage event sandboxes
- [CrossPluginBridge](./CrossPluginBridge.md) - Enable cross-plugin communication
- [EventIsolationSecurityGuide](../guides/PluginSecurityGuide.md) - Security best practices

## See Also

- [EventBus API](../../events/EventBus.md)
- [Plugin Security Guide](../guides/PluginSecurityGuide.md)
- [Permission Management Guide](../guides/PermissionManagementGuide.md)
