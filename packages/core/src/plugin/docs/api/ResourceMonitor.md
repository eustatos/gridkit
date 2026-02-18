# ResourceMonitor

## Overview

`ResourceMonitor` tracks runtime resource usage to prevent plugin abuse and detect potential security issues. It monitors various resource usage metrics including event emission rates, handler execution times, and memory usage.

## Features

- **Event Emission Tracking**: Track events emitted per plugin
- **Handler Execution Monitoring**: Monitor handler execution time
- **Memory Usage Tracking**: Estimate memory usage
- **Real-time Monitoring**: Periodic monitoring with configurable intervals
- **Limit Violation Detection**: Automatically detect and warn about excessive resource usage

## Installation

```typescript
import { ResourceMonitor } from '@gridkit/plugin/security/ResourceMonitor';
```

## Usage

### Creating a Resource Monitor

```typescript
import { ResourceMonitor } from '@gridkit/plugin/security/ResourceMonitor';

const monitor = new ResourceMonitor();

// Start monitoring (checks every 1 second)
monitor.startMonitoring(1000);

// Record event emissions
monitor.recordEventEmission('plugin-1', 100); // 100 bytes

// Record handler execution time
monitor.recordHandlerExecution('plugin-1', 50); // 50ms

// Check if plugin is exceeding limits
if (monitor.isExceedingLimits('plugin-1')) {
  console.warn('Plugin is using too many resources');
}

// Stop monitoring when done
monitor.stopMonitoring();
```

### Getting Usage Data

```typescript
// Get current usage for a plugin
const usage = monitor.getUsage('plugin-1');
console.log(`Events: ${usage.eventsEmitted}`);
console.log(`Bytes: ${usage.eventBytesEmitted}`);
console.log(`Handler time: ${usage.handlerExecutionTime}ms`);

// Stop monitoring
monitor.stopMonitoring();
```

## API

### Constructor

```typescript
new ResourceMonitor()
```

Creates a new resource monitor instance.

### Interfaces

#### PluginResourceUsage

```typescript
interface PluginResourceUsage {
  eventsEmitted: number;          // Number of events emitted
  eventBytesEmitted: number;      // Total bytes of events emitted
  handlerExecutionTime: number;   // Total handler execution time (ms)
  handlerExecutions: number;      // Number of handler executions
  startTime: number;              // Start time of monitoring interval
}
```

### Methods

#### startMonitoring()

```typescript
startMonitoring(interval: number = 1000): void
```

Starts periodic monitoring of resource usage.

**Parameters**:

- `interval` (number): Monitoring interval in milliseconds (default: 1000)

**Example**:

```typescript
monitor.startMonitoring(1000); // Check every second
```

#### stopMonitoring()

```typescript
stopMonitoring(): void
```

Stops periodic monitoring of resource usage.

**Example**:

```typescript
monitor.startMonitoring(1000);

// ... monitoring ...

monitor.stopMonitoring();
```

#### recordEventEmission()

```typescript
recordEventEmission(pluginId: string, eventSize: number): void
```

Records event emission for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `eventSize` (number): The size of the event payload in bytes

**Example**:

```typescript
monitor.recordEventEmission('plugin-1', eventSize);
```

#### recordHandlerExecution()

```typescript
recordHandlerExecution(pluginId: string, executionTime: number): void
```

Records handler execution time for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `executionTime` (number): The execution time in milliseconds

**Example**:

```typescript
const start = performance.now();
handler();
const executionTime = performance.now() - start;

monitor.recordHandlerExecution('plugin-1', executionTime);
```

#### getUsage()

```typescript
getUsage(pluginId: string): PluginResourceUsage
```

Gets current resource usage for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier

**Returns**: `PluginResourceUsage` - Current resource usage

**Example**:

```typescript
const usage = monitor.getUsage('plugin-1');
console.log(`Events: ${usage.eventsEmitted}`);
console.log(`Handler time: ${usage.handlerExecutionTime}ms`);
```

#### isExceedingLimits()

```typescript
isExceedingLimits(pluginId: string): boolean
```

Checks if a plugin is exceeding resource limits.

**Parameters**:

- `pluginId` (string): The plugin identifier

**Returns**: `boolean` - `true` if the plugin is exceeding limits, `false` otherwise

**Example**:

```typescript
if (monitor.isExceedingLimits('plugin-1')) {
  console.warn('Plugin is exceeding resource limits');
  // Take action (e.g., suspend plugin)
}
```

## Resource Limits

The monitor uses the following default limits:

- **Event Emission Rate**: 1000 events per second
- **Handler Execution Time**: 500ms per second

## Best Practices

### 1. Start Monitoring When Plugin Loads

```typescript
class Plugin {
  private monitor = new ResourceMonitor();

  public async load(): Promise<void> {
    this.monitor.startMonitoring(1000);
    // ... rest of loading
  }

  public async unload(): Promise<void> {
    this.monitor.stopMonitoring();
  }
}
```

### 2. Monitor All Event Emissions

```typescript
class MonitoredBus {
  private monitor: ResourceMonitor;
  private bus: EventBus;

  constructor(monitor: ResourceMonitor, bus: EventBus) {
    this.monitor = monitor;
    this.bus = bus;
  }

  public emit(pluginId: string, type: string, payload: unknown): void {
    const size = JSON.stringify(payload).length;
    this.monitor.recordEventEmission(pluginId, size);
    this.bus.emit(type, payload);
  }
}
```

### 3. Monitor Handler Execution

```typescript
function monitorHandler(
  monitor: ResourceMonitor,
  pluginId: string,
  handler: () => void
): () => void {
  return () => {
    const start = performance.now();
    try {
      handler();
    } finally {
      const duration = performance.now() - start;
      monitor.recordHandlerExecution(pluginId, duration);
    }
  };
}

bus.on('event', monitorHandler(monitor, 'plugin-1', handler));
```

### 4. Combine with QuotaManager

```typescript
const monitor = new ResourceMonitor();
const quotaManager = new QuotaManager();

monitor.startMonitoring(1000);

// Set quotas
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});

// Check limits
if (monitor.isExceedingLimits('plugin-1')) {
  console.warn('Plugin exceeding limits');
  // Suspend plugin
}
```

## Examples

### Basic Resource Monitoring

```typescript
import { ResourceMonitor } from '@gridkit/plugin/security/ResourceMonitor';

class ResourcePlugin {
  private monitor = new ResourceMonitor();

  constructor(private pluginId: string) {
    this.monitor.startMonitoring(1000);
  }

  public async processData(items: unknown[]): Promise<void> {
    for (const item of items) {
      const size = JSON.stringify(item).length;
      this.monitor.recordEventEmission(this.pluginId, size);
      
      const start = performance.now();
      try {
        await this.processItem(item);
      } finally {
        const duration = performance.now() - start;
        this.monitor.recordHandlerExecution(this.pluginId, duration);
      }
    }
  }

  public async processItem(item: unknown): Promise<void> {
    // Process item
  }

  public checkResources(): void {
    if (this.monitor.isExceedingLimits(this.pluginId)) {
      console.warn('Plugin is using too many resources');
    }
  }
}
```

### Comprehensive Monitoring

```typescript
import { ResourceMonitor } from '@gridkit/plugin/security/ResourceMonitor';

class ComprehensiveMonitor {
  private monitor = new ResourceMonitor();
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
    this.monitor.startMonitoring(1000);
    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    // Wrap emit
    const originalEmit = this.bus.emit.bind(this.bus);
    this.bus.emit = (type, payload, options) => {
      const size = JSON.stringify(payload).length;
      this.monitor.recordEventEmission('system', size);
      return originalEmit(type, payload, options);
    };

    // Wrap on
    const originalOn = this.bus.on.bind(this.bus);
    this.bus.on = (type, handler, options) => {
      const wrappedHandler = (event) => {
        const start = performance.now();
        try {
          return handler(event);
        } finally {
          const duration = performance.now() - start;
          this.monitor.recordHandlerExecution('system', duration);
        }
      };
      return originalOn(type, wrappedHandler, options);
    };
  }

  public getUsage(): PluginResourceUsage {
    return this.monitor.getUsage('system');
  }

  public stop(): void {
    this.monitor.stopMonitoring();
  }
}
```

### Dynamic Limit Adjustment

```typescript
import { ResourceMonitor } from '@gridkit/plugin/security/ResourceMonitor';

class AdaptiveMonitor {
  private monitor = new ResourceMonitor();
  private baseInterval = 1000;
  private interval = 1000;

  constructor() {
    this.monitor.startMonitoring(this.baseInterval);
  }

  public adaptToLoad(pluginId: string): void {
    const usage = this.monitor.getUsage(pluginId);
    
    // Increase monitoring frequency if usage is high
    if (usage.eventsEmitted > 500) {
      this.interval = this.baseInterval / 2; // Check twice as often
    } else if (usage.eventsEmitted < 100) {
      this.interval = this.baseInterval * 2; // Check less often
    }

    this.monitor.stopMonitoring();
    this.monitor.startMonitoring(this.interval);
  }

  public stop(): void {
    this.monitor.stopMonitoring();
  }
}
```

## Related Documentation

- [QuotaManager](./QuotaManager.md) - Enforce resource quotas
- [EventSandbox](./EventSandbox.md) - Monitor sandboxed events
- [PluginSecurityGuide](../guides/PluginSecurityGuide.md) - Security best practices

## See Also

- [Resource Quota Guide](../guides/ResourceQuotaGuide.md)
