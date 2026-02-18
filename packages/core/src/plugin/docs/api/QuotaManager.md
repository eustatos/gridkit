# QuotaManager

## Overview

`QuotaManager` enforces resource limits for plugins to prevent abuse. It tracks resource usage for each plugin and enforces limits to prevent any single plugin from consuming excessive resources.

## Features

- **Event Rate Limiting**: Limit events per second
- **CPU Time Quotas**: Limit handler execution time
- **Memory Usage Tracking**: Monitor memory usage
- **Automatic Reset**: Usage counters reset every second
- **Plugin Suspension**: Automatically suspend plugins that exceed quotas

## Installation

```typescript
import { QuotaManager } from '@gridkit/plugin/isolation/QuotaManager';
```

## Usage

### Creating a Quota Manager

```typescript
import { QuotaManager } from '@gridkit/plugin/isolation/QuotaManager';

const quotaManager = new QuotaManager();

// Set quotas for a plugin
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50, // milliseconds
  maxMemoryUsage: 1024 * 1024, // bytes (1MB)
});

// Check if plugin can emit an event
if (quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
  // Safe to emit event
  bus.emit('event', data);
}

// Check handler execution time
if (quotaManager.checkQuota('plugin-1', 'maxHandlerTimePerSecond', 10)) {
  // Safe to execute handler
  handler();
}
```

### Setting Quotas

```typescript
// Set quotas for a plugin
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,           // Maximum 100 events per second
  maxHandlerTimePerSecond: 50,       // Maximum 50ms of handler time per second
  maxMemoryUsage: 1024 * 1024,       // Maximum 1MB memory
});

// Get current usage
const usage = quotaManager.getUsage('plugin-1');
console.log(`Events emitted: ${usage.eventsEmitted}`);

// Reset usage counters
quotaManager.resetUsage('plugin-1');
```

### Suspending Plugins

```typescript
// Manually suspend a plugin
quotaManager.suspendPlugin('plugin-1');

// Plugins that are suspended will fail quota checks
quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1); // false
```

## API

### Constructor

```typescript
new QuotaManager()
```

Creates a new quota manager instance.

### Interfaces

#### ResourceUsage

```typescript
interface ResourceUsage {
  eventsEmitted: number;          // Number of events emitted
  handlerExecutionTime: number;   // Total handler execution time (ms)
  memoryUsage: number;            // Current memory usage (bytes)
}
```

#### PluginQuota

```typescript
interface PluginQuota {
  maxEventsPerSecond?: number;        // Maximum events per second
  maxHandlerTimePerSecond?: number;   // Maximum handler execution time per second (ms)
  maxMemoryUsage?: number;            // Maximum memory usage (bytes)
}
```

### Methods

#### setQuota()

```typescript
setQuota(pluginId: string, quota: PluginQuota): void
```

Sets quotas for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `quota` (PluginQuota): The quotas to set

**Example**:

```typescript
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});
```

#### checkQuota()

```typescript
checkQuota(pluginId: string, resource: string, amount: number): boolean
```

Checks if a plugin is within its quota for a resource.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `resource` (string): The resource to check (`maxEventsPerSecond`, `maxHandlerTimePerSecond`, `maxMemoryUsage`)
- `amount` (number): The amount of resource being requested

**Returns**: `boolean` - `true` if the plugin is within quota, `false` otherwise

**Example**:

```typescript
// Check if event emission is allowed
if (quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
  bus.emit('event', data);
} else {
  console.warn('Plugin exceeded event rate limit');
}

// Check if handler execution time is available
if (quotaManager.checkQuota('plugin-1', 'maxHandlerTimePerSecond', 5)) {
  handler(); // Execute handler
}
```

#### resetUsage()

```typescript
resetUsage(pluginId: string): void
```

Resets usage counters for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier

**Example**:

```typescript
quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 50);

// Reset usage at the start of a new time period
quotaManager.resetUsage('plugin-1');
```

#### getUsage()

```typescript
getUsage(pluginId: string): ResourceUsage
```

Gets current usage for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier

**Returns**: `ResourceUsage` - Current resource usage

**Example**:

```typescript
const usage = quotaManager.getUsage('plugin-1');
console.log(`Events: ${usage.eventsEmitted}`);
console.log(`Handler time: ${usage.handlerExecutionTime}ms`);
console.log(`Memory: ${usage.memoryUsage} bytes`);
```

#### suspendPlugin()

```typescript
suspendPlugin(pluginId: string): void
```

Suspends a plugin for exceeding quotas.

**Parameters**:

- `pluginId` (string): The plugin identifier

**Example**:

```typescript
// Manually suspend a plugin
quotaManager.suspendPlugin('plugin-1');

// Check if plugin is suspended
if (!quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
  console.log('Plugin is suspended');
}
```

## Resource Types

### maxEventsPerSecond

Limits the number of events a plugin can emit per second.

```typescript
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,
});

// Check before each emission
if (quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
  bus.emit('event', data);
}
```

### maxHandlerTimePerSecond

Limits the total execution time of handlers per second.

```typescript
quotaManager.setQuota('plugin-1', {
  maxHandlerTimePerSecond: 50, // 50ms per second
});

// Check before executing a handler
if (quotaManager.checkQuota('plugin-1', 'maxHandlerTimePerSecond', 10)) {
  handler();
}
```

### maxMemoryUsage

Limits the memory usage for a plugin.

```typescript
quotaManager.setQuota('plugin-1', {
  maxMemoryUsage: 1024 * 1024, // 1MB
});

// Check before allocating memory
if (quotaManager.checkQuota('plugin-1', 'maxMemoryUsage', 100000)) {
  allocateMemory();
}
```

## Best Practices

### 1. Set Appropriate Quotas

```typescript
// Good - consider typical usage patterns
quotaManager.setQuota('data-plugin', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});

// Bad - too restrictive
quotaManager.setQuota('data-plugin', {
  maxEventsPerSecond: 1, // Too restrictive
  maxHandlerTimePerSecond: 1,
});
```

### 2. Monitor Usage

```typescript
// Monitor plugin usage
const usage = quotaManager.getUsage('plugin-1');
if (usage.eventsEmitted > 50) {
  console.warn('Plugin approaching event limit');
}
```

### 3. Reset Usage Periodically

```typescript
// Reset at the start of each minute
setInterval(() => {
  quotaManager.resetUsage('plugin-1');
}, 60000);
```

### 4. Handle Quota Exceeded Gracefully

```typescript
if (quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
  bus.emit('event', data);
} else {
  // Queue event for later or drop it
  console.warn('Dropping event due to quota limit');
}
```

## Examples

### Basic Quota Management

```typescript
import { QuotaManager } from '@gridkit/plugin/isolation/QuotaManager';

class QuotaAwareBus {
  private quotaManager = new QuotaManager();
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
  }

  public emit(pluginId: string, type: string, payload: unknown): boolean {
    // Check quota
    if (!this.quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)) {
      console.warn(`Plugin ${pluginId} exceeded event quota`);
      return false;
    }

    this.bus.emit(type, payload);
    return true;
  }

  public setPluginQuota(pluginId: string, quota: PluginQuota): void {
    this.quotaManager.setQuota(pluginId, quota);
  }

  public getPluginUsage(pluginId: string): ResourceUsage {
    return this.quotaManager.getUsage(pluginId);
  }
}
```

### Rate Limiting Events

```typescript
import { QuotaManager } from '@gridkit/plugin/isolation/QuotaManager';

class RateLimiter {
  private quotaManager = new QuotaManager();
  private pendingEvents: Map<string, Array<{type: string, payload: unknown}>> = new Map();

  constructor() {
    this.quotaManager.setQuota('default', {
      maxEventsPerSecond: 60, // 60 events per second
    });
  }

  public async emit(pluginId: string, type: string, payload: unknown): Promise<void> {
    if (this.quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)) {
      // Emit immediately
      bus.emit(type, payload);
    } else {
      // Queue for later
      if (!this.pendingEvents.has(pluginId)) {
        this.pendingEvents.set(pluginId, []);
      }
      this.pendingEvents.get(pluginId)!.push({ type, payload });
      
      // Retry after 1 second
      setTimeout(() => this.retryEmit(pluginId), 1000);
    }
  }

  private retryEmit(pluginId: string): void {
    const events = this.pendingEvents.get(pluginId) || [];
    
    for (const event of events) {
      if (this.quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)) {
        bus.emit(event.type, event.payload);
      }
    }
    
    this.pendingEvents.delete(pluginId);
  }
}
```

### CPU Time Quota

```typescript
import { QuotaManager } from '@gridkit/plugin/isolation/QuotaManager';

class CPUAwareExecutor {
  private quotaManager = new QuotaManager();

  constructor() {
    this.quotaManager.setQuota('default', {
      maxHandlerTimePerSecond: 500, // 500ms per second
    });
  }

  public async execute(pluginId: string, handler: () => Promise<void>): Promise<void> {
    const startTime = performance.now();
    
    try {
      await handler();
    } finally {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Check if we can record this execution time
      if (this.quotaManager.checkQuota(pluginId, 'maxHandlerTimePerSecond', executionTime)) {
        // Execution time recorded
      } else {
        console.warn('Plugin exceeded CPU quota');
        // Consider suspending the plugin
      }
    }
  }
}
```

## Related Documentation

- [ResourceMonitor](./ResourceMonitor.md) - Monitor resource usage in real-time
- [EventSandbox](./EventSandbox.md) - Use quotas with event sandboxes
- [PluginSecurityGuide](../guides/PluginSecurityGuide.md) - Security best practices

## See Also

- [Resource Quota Guide](../guides/ResourceQuotaGuide.md)
