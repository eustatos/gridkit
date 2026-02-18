# Resource Management Example

This example demonstrates how to manage resources effectively using QuotaManager and ResourceMonitor.

## Basic Resource Management

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  QuotaManager,
  ResourceMonitor,
} from '@gridkit/plugin';

class ResourceManager {
  private quotaManager: QuotaManager;
  private resourceMonitor: ResourceMonitor;
  private bus: EventBus;

  constructor(bus: EventBus) {
    this.bus = bus;
    this.quotaManager = new QuotaManager();
    this.resourceMonitor = new ResourceMonitor();

    // Start monitoring
    this.resourceMonitor.startMonitoring(1000);

    // Set quotas for default plugin
    this.quotaManager.setQuota('default', {
      maxEventsPerSecond: 100,
      maxHandlerTimePerSecond: 50,
      maxMemoryUsage: 1024 * 1024, // 1MB
    });
  }

  public emit(pluginId: string, type: string, payload: unknown): boolean {
    const size = JSON.stringify(payload).length;

    // Check quota
    if (!this.quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)) {
      console.warn('Event quota exceeded');
      return false;
    }

    // Emit event
    this.bus.emit(type, payload, { priority: EventPriority.NORMAL });

    // Track resource usage
    this.resourceMonitor.recordEventEmission(pluginId, size);

    return true;
  }

  public async executeHandler(
    pluginId: string,
    handler: () => Promise<void>
  ): Promise<void> {
    const startTime = performance.now();

    try {
      await handler();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Check quota
      if (!this.quotaManager.checkQuota(
        pluginId,
        'maxHandlerTimePerSecond',
        duration
      )) {
        console.warn('Handler time quota exceeded');
      }

      // Track resource usage
      this.resourceMonitor.recordHandlerExecution(pluginId, duration);
    }
  }

  public getUsage(pluginId: string): { quota: any, resource: any } {
    return {
      quota: this.quotaManager.getUsage(pluginId),
      resource: this.resourceMonitor.getUsage(pluginId),
    };
  }

  public isExceedingLimits(pluginId: string): boolean {
    return this.resourceMonitor.isExceedingLimits(pluginId);
  }

  public stop(): void {
    this.resourceMonitor.stopMonitoring();
  }
}

// Usage
const baseBus = createEventBus();
const manager = new ResourceManager(baseBus);

// Emit event
manager.emit('plugin-1', 'test', { data: 'test' });

// Execute handler
manager.executeHandler('plugin-1', async () => {
  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 10));
});

// Check usage
const usage = manager.getUsage('plugin-1');
console.log('Usage:', usage);

// Stop monitoring
manager.stop();
```

## Advanced Resource Management

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  QuotaManager,
  ResourceMonitor,
} from '@gridkit/plugin';

class AdvancedResourceManager {
  private quotaManager: QuotaManager;
  private resourceMonitor: ResourceMonitor;
  private bus: EventBus;
  private usageHistory: Map<string, number[]> = new Map();
  private monitoringInterval: number | null = null;

  constructor(bus: EventBus) {
    this.bus = bus;
    this.quotaManager = new QuotaManager();
    this.resourceMonitor = new ResourceMonitor();

    // Start monitoring
    this.resourceMonitor.startMonitoring(1000);
    this.startPeriodicCheck();
  }

  private startPeriodicCheck(): void {
    this.monitoringInterval = setInterval(() => {
      this.checkAllPlugins();
    }, 1000);
  }

  public registerPlugin(
    pluginId: string,
    quotas?: { maxEventsPerSecond?: number, maxHandlerTimePerSecond?: number }
  ): void {
    // Set default quotas
    this.quotaManager.setQuota(pluginId, {
      maxEventsPerSecond: quotas?.maxEventsPerSecond ?? 100,
      maxHandlerTimePerSecond: quotas?.maxHandlerTimePerSecond ?? 50,
      maxMemoryUsage: 1024 * 1024, // 1MB
    });

    // Initialize usage history
    this.usageHistory.set(pluginId, []);
  }

  public unregisterPlugin(pluginId: string): void {
    this.quotaManager.clearPermissions(pluginId);
    this.usageHistory.delete(pluginId);
  }

  public emit(pluginId: string, type: string, payload: unknown): boolean {
    const size = JSON.stringify(payload).length;

    // Check quota
    if (!this.quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)) {
      this.logQuotaViolation(pluginId, 'maxEventsPerSecond');
      return false;
    }

    // Emit event
    this.bus.emit(type, payload, { priority: EventPriority.NORMAL });

    // Track resource usage
    this.resourceMonitor.recordEventEmission(pluginId, size);

    // Update usage history
    this.updateUsageHistory(pluginId, 'eventsEmitted', 1);

    return true;
  }

  public async executeHandler(
    pluginId: string,
    handler: () => Promise<void>
  ): Promise<void> {
    const startTime = performance.now();

    try {
      await handler();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Check quota
      if (!this.quotaManager.checkQuota(
        pluginId,
        'maxHandlerTimePerSecond',
        duration
      )) {
        this.logQuotaViolation(pluginId, 'maxHandlerTimePerSecond');
      }

      // Track resource usage
      this.resourceMonitor.recordHandlerExecution(pluginId, duration);

      // Update usage history
      this.updateUsageHistory(pluginId, 'handlerExecutionTime', duration);
    }
  }

  private updateUsageHistory(
    pluginId: string,
    field: 'eventsEmitted' | 'handlerExecutionTime',
    value: number
  ): void {
    const history = this.usageHistory.get(pluginId) || [];
    history.push(value);

    // Keep last 60 seconds of data
    if (history.length > 60) {
      history.shift();
    }

    this.usageHistory.set(pluginId, history);
  }

  public getPluginStats(pluginId: string): {
    quota: any,
    resource: any,
    averageUsage: { events: number, handlerTime: number }
  } {
    const history = this.usageHistory.get(pluginId) || [];
    const averageUsage = {
      events: this.calculateAverage(history),
      handlerTime: this.calculateAverage(history),
    };

    return {
      quota: this.quotaManager.getUsage(pluginId),
      resource: this.resourceMonitor.getUsage(pluginId),
      averageUsage,
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private checkAllPlugins(): void {
    const plugins = this.usageHistory.keys();

    for (const pluginId of plugins) {
      const stats = this.getPluginStats(pluginId);
      const resourceUsage = stats.resource;

      // Check for excessive resource usage
      if (resourceUsage.eventsEmitted > 500) {
        console.warn(`Plugin ${pluginId} emitting excessive events`);
      }

      if (resourceUsage.handlerExecutionTime > 200) {
        console.warn(`Plugin ${pluginId} using excessive CPU`);
      }
    }
  }

  private logQuotaViolation(pluginId: string, resource: string): void {
    const usage = this.quotaManager.getUsage(pluginId);
    console.warn(`Plugin ${pluginId} quota exceeded for ${resource}:`, usage);
  }

  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.resourceMonitor.stopMonitoring();
  }
}

// Usage
const baseBus = createEventBus();
const manager = new AdvancedResourceManager(baseBus);

// Register plugins
manager.registerPlugin('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});

// Emit events
for (let i = 0; i < 5; i++) {
  manager.emit('plugin-1', 'test', { data: i });
}

// Execute handlers
manager.executeHandler('plugin-1', async () => {
  await new Promise(resolve => setTimeout(resolve, 10));
});

// Get stats
const stats = manager.getPluginStats('plugin-1');
console.log('Stats:', stats);

// Stop
manager.stop();
```

## Adaptive Quota Management

```typescript
import {
  QuotaManager,
  ResourceMonitor,
} from '@gridkit/plugin';

class AdaptiveQuotaManager {
  private quotaManager: QuotaManager;
  private resourceMonitor: ResourceMonitor;
  private baseQuotas: Map<string, PluginQuota> = new Map();
  private adjustedQuotas: Map<string, PluginQuota> = new Map();
  private usageHistory: Map<string, number[]> = new Map();

  constructor() {
    this.quotaManager = new QuotaManager();
    this.resourceMonitor = new ResourceMonitor();
    this.resourceMonitor.startMonitoring(1000);
  }

  public setBaseQuota(
    pluginId: string,
    quotas: PluginQuota
  ): void {
    this.baseQuotas.set(pluginId, quotas);
    this.quotaManager.setQuota(pluginId, quotas);
  }

  public adjustQuota(
    pluginId: string,
    multiplier: number
  ): void {
    const baseQuotas = this.baseQuotas.get(pluginId);
    if (!baseQuotas) {
      console.error('Base quotas not set for plugin');
      return;
    }

    const adjustedQuotas: PluginQuota = {};
    
    if (baseQuotas.maxEventsPerSecond) {
      adjustedQuotas.maxEventsPerSecond = 
        Math.floor(baseQuotas.maxEventsPerSecond * multiplier);
    }
    
    if (baseQuotas.maxHandlerTimePerSecond) {
      adjustedQuotas.maxHandlerTimePerSecond = 
        Math.floor(baseQuotas.maxHandlerTimePerSecond * multiplier);
    }

    this.adjustedQuotas.set(pluginId, adjustedQuotas);
    this.quotaManager.setQuota(pluginId, adjustedQuotas);
  }

  public resetQuota(pluginId: string): void {
    const baseQuotas = this.baseQuotas.get(pluginId);
    if (baseQuotas) {
      this.quotaManager.setQuota(pluginId, baseQuotas);
    }
  }

  public getAdjustedQuota(pluginId: string): PluginQuota | undefined {
    return this.adjustedQuotas.get(pluginId);
  }

  public checkAndAdjust(pluginId: string): void {
    const usage = this.resourceMonitor.getUsage(pluginId);
    const baseQuota = this.baseQuotas.get(pluginId);

    if (!baseQuota) {
      return;
    }

    // Adjust quota based on usage
    if (usage.eventsEmitted > 500) {
      // High usage - increase quota
      this.adjustQuota(pluginId, 1.5);
    } else if (usage.eventsEmitted < 100) {
      // Low usage - decrease quota
      this.adjustQuota(pluginId, 0.8);
    } else {
      // Normal usage - reset quota
      this.resetQuota(pluginId);
    }
  }

  public stop(): void {
    this.resourceMonitor.stopMonitoring();
  }
}

// Usage
const manager = new AdaptiveQuotaManager();

// Set base quotas
manager.setBaseQuota('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});

// Check and adjust quota based on usage
manager.checkAndAdjust('plugin-1');

// Get adjusted quota
const adjusted = manager.getAdjustedQuota('plugin-1');
console.log('Adjusted quota:', adjusted);

// Stop
manager.stop();
```

## Resource Monitoring Dashboard

```typescript
import {
  QuotaManager,
  ResourceMonitor,
} from '@gridkit/plugin';

class ResourceDashboard {
  private quotaManager: QuotaManager;
  private resourceMonitor: ResourceMonitor;
  private plugins: string[] = [];
  private lastCheck: Map<string, number> = new Map();

  constructor() {
    this.quotaManager = new QuotaManager();
    this.resourceMonitor = new ResourceMonitor();
    this.resourceMonitor.startMonitoring(1000);
  }

  public registerPlugin(pluginId: string): void {
    this.plugins.push(pluginId);
    this.quotaManager.setQuota(pluginId, {
      maxEventsPerSecond: 100,
      maxHandlerTimePerSecond: 50,
      maxMemoryUsage: 1024 * 1024, // 1MB
    });
  }

  public unregisterPlugin(pluginId: string): void {
    this.plugins = this.plugins.filter(p => p !== pluginId);
    this.quotaManager.clearPermissions(pluginId);
  }

  public getDashboardData(): {
    plugins: string[],
    usage: { pluginId: string, quota: any, resource: any, status: string }[]
  } {
    const usage = this.plugins.map(pluginId => {
      const quotaUsage = this.quotaManager.getUsage(pluginId);
      const resourceUsage = this.resourceMonitor.getUsage(pluginId);
      const lastCheck = this.lastCheck.get(pluginId) || 0;
      const timeSinceCheck = Date.now() - lastCheck;

      // Determine status
      let status = 'normal';
      if (resourceUsage.eventsEmitted > 800) {
        status = 'critical';
      } else if (resourceUsage.eventsEmitted > 500) {
        status = 'warning';
      } else if (resourceUsage.eventsEmitted > 0) {
        status = 'active';
      } else if (timeSinceCheck > 60000) {
        status = 'idle';
      }

      this.lastCheck.set(pluginId, Date.now());

      return {
        pluginId,
        quota: quotaUsage,
        resource: resourceUsage,
        status,
      };
    });

    return {
      plugins: this.plugins,
      usage,
    };
  }

  public stop(): void {
    this.resourceMonitor.stopMonitoring();
  }
}

// Usage
const dashboard = new ResourceDashboard();

// Register plugins
dashboard.registerPlugin('plugin-1');
dashboard.registerPlugin('plugin-2');
dashboard.registerPlugin('plugin-3');

// Simulate some activity
dashboard.getDashboardData(); // Get initial data

// Check dashboard data
const data = dashboard.getDashboardData();
console.log('Dashboard:', data);

// Stop
dashboard.stop();
```

## Features Demonstrated

1. **Event Rate Limiting**: Limit events per second
2. **Handler Execution Time**: Limit handler execution time
3. **Memory Usage**: Monitor memory usage
4. **Usage History**: Track usage over time
5. **Adaptive Quotas**: Automatically adjust quotas based on usage
6. **Resource Monitoring**: Real-time monitoring with ResourceMonitor
7. **Dashboard**: Visualize resource usage

## Benefits

- **Performance**: Prevent plugins from consuming excessive resources
- **Reliability**: Detect and handle resource issues
- **Flexibility**: Adjust quotas based on usage patterns
- **Monitoring**: Real-time visibility into resource usage
- **Optimization**: Automatically optimize quotas
