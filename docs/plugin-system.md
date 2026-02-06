# Plugin System

The GridKit Plugin System provides a foundation for extending grid functionality through modular, type-safe plugins.

## Overview

The plugin system includes:

- **PluginManager**: Centralized plugin management
- **Type-safe Registry**: Compile-time plugin discovery
- **Event Integration**: Plugin-scoped event buses
- **Lifecycle Management**: Initialize/destroy with dependency resolution

## Core Concepts

### Plugin Interface

All plugins must implement the `Plugin` interface:

```typescript
interface Plugin<TConfig = Record<string, unknown>> {
  readonly metadata: PluginMetadata;
  
  initialize(config: TConfig, context: PluginContext): Promise<void> | void;
  destroy(): Promise<void> | void;
  update?(config: Partial<TConfig>): void;
}
```

### Plugin Metadata

Each plugin must provide metadata:

```typescript
interface PluginMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly dependencies?: string[];
  readonly capabilities?: string[];
}
```

### Plugin Context

Plugins receive a context with core services:

```typescript
interface PluginContext {
  readonly eventBus: EventBus;
  readonly config: Record<string, unknown>;
  readonly metadata: PluginMetadata;
}
```

## Plugin Manager

The `PluginManager` is the central component for plugin management:

```typescript
import { PluginManager } from '@gridkit/core';

const pluginManager = new PluginManager();
```

### Registration

Register plugins with the manager:

```typescript
pluginManager.register(myPlugin);
```

The manager validates dependencies and prevents duplicate registrations.

### Lifecycle Management

Initialize plugins:

```typescript
await pluginManager.initializePlugin('my-plugin', config);
```

Update plugin configuration:

```typescript
pluginManager.updatePlugin('my-plugin', newConfig);
```

Destroy plugins:

```typescript
await pluginManager.destroyPlugin('my-plugin');
```

### Event Integration

Plugins receive isolated event buses for communication:

```typescript
// In plugin initialization
async initialize(config: TConfig, context: PluginContext) {
  // Subscribe to events
  context.eventBus.on('grid.created', (event) => {
    // Handle event
  });
  
  // Emit events
  context.eventBus.emit('my-plugin.ready', { pluginId: context.metadata.id });
}
```

## Type Safety

The plugin registry provides compile-time type safety:

```typescript
// Extend the registry for type safety
declare module '@gridkit/core/plugin' {
  interface PluginRegistry {
    'my-plugin': MyPluginType;
  }
}

// Type-safe plugin access
type MyPlugin = GetPlugin<'my-plugin'>;
```

## Best Practices

### Error Handling

Plugins should handle errors gracefully:

```typescript
class MyPlugin implements Plugin {
  async initialize(config: TConfig, context: PluginContext) {
    try {
      // Plugin initialization
    } catch (error) {
      // Log error and clean up
      console.error('Plugin initialization failed:', error);
      throw error; // Re-throw to prevent registration
    }
  }
}
```

### Resource Management

Always clean up resources in the destroy method:

```typescript
class MyPlugin implements Plugin {
  private subscriptions: Array<() => void> = [];
  
  async destroy() {
    // Unsubscribe from events
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
    
    // Clean up other resources
  }
}
```

### Configuration

Define configuration schemas for type safety:

```typescript
interface MyPluginConfig {
  enabled: boolean;
  apiUrl?: string;
  timeout?: number;
}

class MyPlugin implements Plugin<MyPluginConfig> {
  // Implementation
}
```

## Examples

See [plugin system examples](../src/plugin/examples/plugin-system-usage.ts) for complete usage examples.