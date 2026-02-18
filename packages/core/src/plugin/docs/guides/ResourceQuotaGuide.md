# Resource Quota Guide

## Overview

This guide covers resource quota management for GridKit plugins. Proper quota management prevents plugins from consuming excessive resources and ensures system stability.

## Quota System Overview

GridKit provides two main quota management tools:

1. **QuotaManager**: Enforces resource quotas (events per second, handler time, memory)
2. **ResourceMonitor**: Monitors resource usage in real-time

## Types of Quotas

### 1. Event Rate Quota

Limits the number of events a plugin can emit per second.

```typescript
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100, // Maximum 100 events per second
});
```

### 2. Handler Execution Time Quota

Limits the total execution time of handlers per second.

```typescript
quotaManager.setQuota('plugin-1', {
  maxHandlerTimePerSecond: 50, // Maximum 50ms of handler time per second
});
```

### 3. Memory Usage Quota

Limits the memory usage for a plugin.

```typescript
quotaManager.setQuota('plugin-1', {
  maxMemoryUsage: 1024 * 1024, // Maximum 1MB memory
});
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

### 2. Monitor Resource Usage

```typescript
// Monitor plugin usage
const usage = quotaManager.getUsage('plugin-1');
if (usage.eventsEmitted > 50) {
  console.warn('Plugin approaching event limit');
}
```

### 3. Reset Usage Periodically

```typescript
// Reset at the start of each time period
quotaManager.resetUsage('plugin-1');
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

### 5. Combine QuotaManager with ResourceMonitor

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
  console.warn('Plugin is exceeding resource limits');
  // Suspend plugin
}
```

## Quota Examples

### 1. Event Rate Limiting

```typescript
class RateLimitedBus {
  private quotaManager = new QuotaManager();

  constructor() {
    this.quotaManager.setQuota('default', {
      maxEventsPerSecond: 60, // 60 events per second
    });
  }

  public emit(pluginId: string, type: string, payload: unknown): boolean {
    if (!this.quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)) {
      console.warn('Plugin exceeded event rate limit');
      return false;
    }

    bus.emit(type, payload);
    return true;
  }
}
```

### 2. CPU Time Quota

```typescript
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
      
      if (!this.quotaManager.checkQuota(pluginId, 'maxHandlerTimePerSecond', executionTime)) {
        console.warn('Plugin exceeded CPU quota');
      }
    }
  }
}
```

### 3. Memory Quota

```typescript
class MemoryAwareAllocator {
  private quotaManager = new QuotaManager();

  constructor() {
    this.quotaManager.setQuota('default', {
      maxMemoryUsage: 1024 * 1024, // 1MB
    });
  }

  public allocate(pluginId: string, size: number): boolean {
    if (!this.quotaManager.checkQuota(pluginId, 'maxMemoryUsage', size)) {
      console.warn('Plugin exceeded memory quota');
      return false;
    }

    allocateMemory(size);
    return true;
  }
}
```

## Quota Monitoring

### 1. Real-time Monitoring

```typescript
class QuotaMonitor {
  private quotaManager = new QuotaManager();
  private resourceMonitor = new ResourceMonitor();

  constructor() {
    this.resourceMonitor.startMonitoring(1000);
  }

  public checkQuotas(pluginId: string): void {
    // Check quota
    if (!this.quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)) {
      console.warn('Quota exceeded');
    }

    // Check resource monitor
    if (this.resourceMonitor.isExceedingLimits(pluginId)) {
      console.warn('Resource limit exceeded');
    }
  }

  public stop(): void {
    this.resourceMonitor.stopMonitoring();
  }
}
```

### 2. Usage Reporting

```typescript
function reportPluginUsage(
  pluginId: string,
  quotaManager: QuotaManager,
  resourceMonitor: ResourceMonitor
): void {
  const quotaUsage = quotaManager.getUsage(pluginId);
  const resourceUsage = resourceMonitor.getUsage(pluginId);

  console.log(`Plugin ${pluginId} usage:`);
  console.log(`  Events: ${quotaUsage.eventsEmitted}`);
  console.log(`  Handler time: ${quotaUsage.handlerExecutionTime}ms`);
  console.log(`  Resource events: ${resourceUsage.eventsEmitted}`);
  console.log(`  Resource handler time: ${resourceUsage.handlerExecutionTime}ms`);
}
```

### 3. Adaptive Quota Management

```typescript
class AdaptiveQuotaManager {
  private quotaManager = new QuotaManager();
  private baseInterval = 1000;
  private interval = 1000;

  constructor() {
    this.quotaManager.setQuota('default', {
      maxEventsPerSecond: 100,
    });
  }

  public adaptToLoad(pluginId: string): void {
    const usage = this.quotaManager.getUsage(pluginId);
    
    // Increase monitoring frequency if usage is high
    if (usage.eventsEmitted > 500) {
      this.interval = this.baseInterval / 2; // Check twice as often
    } else if (usage.eventsEmitted < 100) {
      this.interval = this.baseInterval * 2; // Check less often
    }
  }

  public getInterval(): number {
    return this.interval;
  }
}
```

## Quota Configuration

### 1. Default Quotas

```typescript
const DEFAULT_QUOTAS: PluginQuota = {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
  maxMemoryUsage: 1024 * 1024, // 1MB
};

function setupDefaultQuotas(pluginId: string): void {
  quotaManager.setQuota(pluginId, DEFAULT_QUOTAS);
}
```

### 2. Per-Plugin Quotas

```typescript
const PLUGIN_QUOTAS: Record<string, PluginQuota> = {
  'data-plugin': {
    maxEventsPerSecond: 200,
    maxHandlerTimePerSecond: 100,
  },
  'ui-plugin': {
    maxEventsPerSecond: 50,
    maxHandlerTimePerSecond: 25,
  },
};

function setupPluginQuotas(pluginId: string): void {
  const quotas = PLUGIN_QUOTAS[pluginId] || DEFAULT_QUOTAS;
  quotaManager.setQuota(pluginId, quotas);
}
```

### 3. Dynamic Quota Adjustment

```typescript
class DynamicQuotaAdjuster {
  private quotaManager = new QuotaManager();
  private usageHistory = new Map<string, number[]>();

  constructor() {
    this.quotaManager.setQuota('default', {
      maxEventsPerSecond: 100,
    });
  }

  public adjustQuota(pluginId: string, usage: number): void {
    const history = this.usageHistory.get(pluginId) || [];
    history.push(usage);
    
    // Keep last 100 usage samples
    if (history.length > 100) {
      history.shift();
    }
    
    this.usageHistory.set(pluginId, history);
    
    // Adjust quota based on usage patterns
    const avgUsage = this.calculateAverage(history);
    
    if (avgUsage > 80) {
      // Increase quota if consistently high usage
      this.increaseQuota(pluginId, 1.5);
    } else if (avgUsage < 20) {
      // Decrease quota if consistently low usage
      this.decreaseQuota(pluginId, 0.8);
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private increaseQuota(pluginId: string, multiplier: number): void {
    const quotas = this.quotaManager.getQuota(pluginId);
    if (quotas?.maxEventsPerSecond) {
      this.quotaManager.setQuota(pluginId, {
        ...quotas,
        maxEventsPerSecond: quotas.maxEventsPerSecond * multiplier,
      });
    }
  }

  private decreaseQuota(pluginId: string, multiplier: number): void {
    const quotas = this.quotaManager.getQuota(pluginId);
    if (quotas?.maxEventsPerSecond) {
      const newQuota = quotas.maxEventsPerSecond * multiplier;
      if (newQuota >= 10) { // Minimum quota
        this.quotaManager.setQuota(pluginId, {
          ...quotas,
          maxEventsPerSecond: newQuota,
        });
      }
    }
  }
}
```

## Quota Monitoring Checklist

- [ ] Set appropriate quotas for all plugins
- [ ] Monitor resource usage regularly
- [ ] Reset usage counters periodically
- [ ] Handle quota exceeded gracefully
- [ ] Combine QuotaManager with ResourceMonitor
- [ ] Log quota violations
- [ ] Adjust quotas based on usage patterns
- [ ] Set minimum and maximum quotas
- [ ] Document quota limits
- [ ] Test with quota limits

## Related Documentation

- [QuotaManager API](../api/QuotaManager.md)
- [ResourceMonitor API](../api/ResourceMonitor.md)
- [PluginSecurityGuide](./PluginSecurityGuide.md)

## See Also

- [Resource Quota Examples](../api/QuotaManager.md#examples)
- [Resource Monitoring Examples](../api/ResourceMonitor.md#examples)
