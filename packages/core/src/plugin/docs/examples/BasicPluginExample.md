# Basic Plugin Example

This example demonstrates a basic plugin with proper event isolation, permissions, and error handling.

## Plugin Implementation

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  EventSandbox,
  PermissionManager,
  QuotaManager,
  ErrorBoundary,
  ResourceMonitor,
  EventValidator,
} from '@gridkit/plugin';

class DataPlugin {
  private sandbox: EventSandbox;
  private permissionManager: PermissionManager;
  private quotaManager: QuotaManager;
  private errorBoundary: ErrorBoundary;
  private resourceMonitor: ResourceMonitor;
  private validator: EventValidator;
  private localBus: EventBus;

  constructor(baseBus: EventBus, pluginId: string) {
    this.permissionManager = new PermissionManager();
    this.quotaManager = new QuotaManager();
    this.resourceMonitor = new ResourceMonitor();
    this.validator = new EventValidator();

    // Grant permissions
    this.permissionManager.grantCapabilities(pluginId, [
      'emit:data:*',
      'receive:ui:*',
      'read:config:*',
    ]);

    // Set quotas
    this.quotaManager.setQuota(pluginId, {
      maxEventsPerSecond: 100,
      maxHandlerTimePerSecond: 50,
      maxMemoryUsage: 1024 * 1024, // 1MB
    });

    // Create sandbox with permissions
    this.sandbox = new EventSandbox(
      pluginId,
      baseBus,
      [
        'emit:data:*',
        'receive:ui:*',
        'read:config:*',
      ]
    );
    this.localBus = this.sandbox.getBus();

    // Setup error boundary
    this.errorBoundary = new ErrorBoundary(
      pluginId,
      this.handlePluginError.bind(this)
    );

    // Start monitoring
    this.resourceMonitor.startMonitoring(1000);

    // Setup event handlers
    this.setupHandlers(pluginId);
  }

  private setupHandlers(pluginId: string): void {
    // Listen for UI events
    this.localBus.on(
      'ui:refresh',
      this.errorBoundary.wrap(() => {
        this.refreshData();
      }, 'ui-refresh')
    );

    // Listen for config changes
    this.localBus.on(
      'config:update',
      this.errorBoundary.wrap((event) => {
        this.handleConfigUpdate(event.payload);
      }, 'config-update')
    );

    // Listen for custom data events
    this.localBus.on(
      'data:refresh',
      this.errorBoundary.wrap(() => {
        this.refreshData();
      }, 'data-refresh')
    );
  }

  public async refreshData(): Promise<void> {
    // Check quotas
    if (!this.quotaManager.checkQuota(
      this.getPluginId(),
      'maxEventsPerSecond',
      1
    )) {
      console.warn('Event quota exceeded');
      return;
    }

    // Start timing
    const startTime = performance.now();

    try {
      // Simulate data refresh
      const data = await this.loadData();
      
      // Emit data update
      this.localBus.emit(
        'data:update',
        { data, timestamp: Date.now() },
        { priority: EventPriority.NORMAL }
      );

      // Emit UI update
      this.localBus.emit(
        'ui:refresh',
        { type: 'data-refresh' },
        { priority: EventPriority.NORMAL }
      );
    } finally {
      // Track resource usage
      const endTime = performance.now();
      this.resourceMonitor.recordEventEmission(
        this.getPluginId(),
        100 // Approximate size
      );
      this.resourceMonitor.recordHandlerExecution(
        this.getPluginId(),
        endTime - startTime
      );
    }
  }

  private handleConfigUpdate(config: unknown): void {
    // Validate config
    if (!this.validator.validateEvent({ type: 'config', payload: config }).isValid) {
      console.error('Invalid config');
      return;
    }

    // Process config
    console.log('Config updated:', config);
  }

  private async loadData(): Promise<unknown> {
    // Simulate data loading
    await new Promise(resolve => setTimeout(resolve, 10));
    return { data: 'loaded' };
  }

  private getPluginId(): string {
    return 'data-plugin';
  }

  private handlePluginError(error: Error, pluginId: string): void {
    console.error(`[${pluginId}] Error:`, error);
    // Report error to monitoring service
    reportError(error, pluginId);
  }

  public destroy(): void {
    this.sandbox.destroy();
    this.resourceMonitor.stopMonitoring();
  }
}

// Usage
const baseBus = createEventBus();
const plugin = new DataPlugin(baseBus, 'data-plugin');

// Listen for plugin events
baseBus.on('data:update', (event) => {
  console.log('Data updated:', event.payload);
});

baseBus.on('ui:refresh', (event) => {
  console.log('UI needs refresh:', event.payload);
});

// Trigger data refresh
plugin.refreshData();

// Cleanup
setTimeout(() => {
  plugin.destroy();
}, 5000);
```

## Key Features Demonstrated

1. **Event Isolation**: Plugin uses EventSandbox for isolated event handling
2. **Permission Management**: Plugin has specific permissions (emit:data:*, receive:ui:*)
3. **Resource Quotas**: Plugin has quotas for events per second and handler time
4. **Error Handling**: Plugin uses ErrorBoundary for safe error handling
5. **Resource Monitoring**: Plugin tracks resource usage with ResourceMonitor
6. **Event Validation**: Plugin validates events before processing

## Benefits

- **Security**: Events are sanitized and validated
- **Isolation**: Plugin errors don't affect other plugins
- **Resource Control**: Plugin can't consume excessive resources
- **Debugging**: Errors are caught and logged
- **Monitoring**: Resource usage is tracked and monitored
