# SandboxedPluginManager

## Overview

`SandboxedPluginManager` manages plugin sandboxes with proper isolation and security. It provides a high-level interface for managing plugin lifecycle and event isolation.

## Features

- **Sandbox Management**: Create and manage plugin sandboxes
- **Permission Management**: Grant and revoke permissions
- **Resource Monitoring**: Track resource usage
- **Error Handling**: Catch and handle plugin errors
- **Automatic Cleanup**: Clean up resources when plugins are unloaded

## Installation

```typescript
import { SandboxedPluginManager } from '@gridkit/plugin/isolation/SandboxedPluginManager';
```

## Usage

### Creating a Sandboxed Manager

```typescript
import { createEventBus } from '@gridkit/events';
import { SandboxedPluginManager } from '@gridkit/plugin/isolation/SandboxedPluginManager';

const baseBus = createEventBus();
const manager = new SandboxedPluginManager(baseBus);

// Register a plugin with permissions
manager.registerPlugin('plugin-1', {
  permissions: ['emit:*', 'receive:*'],
  quotas: {
    maxEventsPerSecond: 100,
    maxHandlerTimePerSecond: 50,
  },
});

// Get plugin's local bus
const pluginBus = manager.getPluginBus('plugin-1');
pluginBus.on('event', handler);

// Unregister plugin
manager.unregisterPlugin('plugin-1');
```

## API

### Constructor

```typescript
new SandboxedPluginManager(baseBus: EventBus)
```

Creates a new sandboxed plugin manager.

#### Parameters

- `baseBus` (EventBus): The base event bus to forward approved events to

### Methods

#### registerPlugin()

```typescript
registerPlugin(pluginId: string, options: PluginOptions): void
```

Registers a new plugin with the manager.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin
- `options` (PluginOptions): Plugin options including permissions and quotas

**Example**:

```typescript
manager.registerPlugin('plugin-1', {
  permissions: ['emit:data:*', 'receive:config:*'],
  quotas: {
    maxEventsPerSecond: 100,
    maxHandlerTimePerSecond: 50,
  },
});
```

#### unregisterPlugin()

```typescript
unregisterPlugin(pluginId: string): void
```

Unregisters a plugin and cleans up resources.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin

**Example**:

```typescript
manager.unregisterPlugin('plugin-1');
```

#### getPluginBus()

```typescript
getPluginBus(pluginId: string): EventBus | undefined
```

Gets the local event bus for a plugin.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin

**Returns**: `EventBus | undefined` - The local event bus for the plugin

**Example**:

```typescript
const pluginBus = manager.getPluginBus('plugin-1');
if (pluginBus) {
  pluginBus.emit('event', data);
}
```

#### setPluginPermissions()

```typescript
setPluginPermissions(pluginId: string, permissions: string[]): void
```

Sets permissions for a plugin.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin
- `permissions` (string[]): The permissions to set

**Example**:

```typescript
manager.setPluginPermissions('plugin-1', ['emit:*']);
```

#### addPluginPermission()

```typescript
addPluginPermission(pluginId: string, permission: string): void
```

Adds a permission to a plugin.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin
- `permission` (string): The permission to add

**Example**:

```typescript
manager.addPluginPermission('plugin-1', 'emit:data:*');
```

#### removePluginPermission()

```typescript
removePluginPermission(pluginId: string, permission: string): void
```

Removes a permission from a plugin.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin
- `permission` (string): The permission to remove

**Example**:

```typescript
manager.removePluginPermission('plugin-1', 'emit:data:*');
```

#### getPluginPermissions()

```typescript
getPluginPermissions(pluginId: string): string[]
```

Gets permissions for a plugin.

**Parameters**:

- `pluginId` (string): The unique identifier for the plugin

**Returns**: `string[]` - Array of permissions

**Example**:

```typescript
const permissions = manager.getPluginPermissions('plugin-1');
console.log(permissions);
```

## Options

### PluginOptions

```typescript
interface PluginOptions {
  permissions?: string[];              // Plugin permissions
  quotas?: PluginQuota;                // Resource quotas
}
```

## Best Practices

### 1. Register Plugins at Load Time

```typescript
// Good
await plugin.load();
manager.registerPlugin(pluginId, {
  permissions: plugin.permissions,
  quotas: plugin.quotas,
});

// Bad
manager.registerPlugin(pluginId, { permissions: ['*'] });
await plugin.load();
```

### 2. Clean Up on Unload

```typescript
// Good
await plugin.unload();
manager.unregisterPlugin(pluginId);

// Bad
await plugin.unload();
// No cleanup!
```

### 3. Validate Permissions

```typescript
// Good
if (manager.getPluginPermissions(pluginId).includes('emit:data:*')) {
  pluginBus.emit('data:read', query);
}

// Bad
pluginBus.emit('data:read', query); // No permission check
```

## Examples

### Basic Plugin Management

```typescript
import { createEventBus } from '@gridkit/events';
import { SandboxedPluginManager } from '@gridkit/plugin/isolation/SandboxedPluginManager';

class PluginLoader {
  private manager: SandboxedPluginManager;

  constructor() {
    const baseBus = createEventBus();
    this.manager = new SandboxedPluginManager(baseBus);
  }

  public async loadPlugin(
    pluginId: string,
    plugin: {
      permissions: string[];
      quotas: any;
      load: () => Promise<void>;
      unload: () => Promise<void>;
    }
  ): Promise<void> {
    // Register plugin
    this.manager.registerPlugin(pluginId, {
      permissions: plugin.permissions,
      quotas: plugin.quotas,
    });

    // Load plugin
    await plugin.load();

    // Get plugin bus for communication
    const pluginBus = this.manager.getPluginBus(pluginId);
    pluginBus?.on('plugin:ready', () => {
      console.log(`Plugin ${pluginId} is ready`);
    });
  }

  public async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      await plugin.unload();
      this.manager.unregisterPlugin(pluginId);
    }
  }
}
```

## Related Documentation

- [EventSandbox](./EventSandbox.md) - Event sandbox implementation
- [PermissionManager](./PermissionManager.md) - Permission management
- [QuotaManager](./QuotaManager.md) - Resource quota management
- [ErrorBoundary](./ErrorBoundary.md) - Error handling
- [PluginEventForwarder](./PluginEventForwarder.md) - Event forwarding

## See Also

- [Plugin System Architecture](../../../docs/PLUGINS.md)
- [Plugin Lifecycle Management](../../../docs/LIFECYCLE.md)
