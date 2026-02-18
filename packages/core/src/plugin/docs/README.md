# Plugin System Documentation

## Overview

This directory contains comprehensive documentation for the GridKit plugin system. The plugin system provides isolated, secure, and efficient plugin execution with event isolation, permission management, resource quotas, and security features.

## Directory Structure

```
docs/
├── api/                    # API documentation
│   ├── EventSandbox.md
│   ├── PermissionManager.md
│   ├── QuotaManager.md
│   ├── EventValidator.md
│   ├── ErrorBoundary.md
│   ├── ResourceMonitor.md
│   ├── PluginEventForwarder.md
│   ├── CrossPluginBridge.md
│   └── SandboxedPluginManager.md
├── guides/                 # User guides
│   ├── PluginSecurityGuide.md
│   ├── PermissionManagementGuide.md
│   └── ResourceQuotaGuide.md
└── examples/               # Code examples
    ├── BasicPluginExample.md
    ├── CrossPluginCommunicationExample.md
    └── ResourceManagementExample.md
```

## Quick Start

### 1. Basic Plugin Setup

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

class MyPlugin {
  private sandbox: EventSandbox;
  private bus: EventBus;

  constructor(baseBus: EventBus) {
    // Create sandbox with permissions
    this.sandbox = new EventSandbox('my-plugin', baseBus, [
      'emit:data:*',
      'receive:ui:*',
    ]);
    this.bus = this.sandbox.getBus();

    // Setup handlers
    this.bus.on('data:update', (event) => {
      console.log('Data updated:', event.payload);
    });
  }

  public emitData(data: unknown): void {
    this.bus.emit('data:update', data, { priority: EventPriority.NORMAL });
  }

  public destroy(): void {
    this.sandbox.destroy();
  }
}
```

### 2. Cross-Plugin Communication

```typescript
import {
  createEventBus,
  EventPriority,
} from '@gridkit/events';
import {
  PluginEventForwarder,
  CrossPluginBridge,
} from '@gridkit/plugin';

const baseBus = createEventBus();
const forwarder = new PluginEventForwarder(baseBus);
const bridge = new CrossPluginBridge(forwarder);

// Create sandboxes for plugins
forwarder.createSandbox('plugin-a', ['emit:*']);
forwarder.createSandbox('plugin-b', ['emit:*']);

// Create communication channel
const channelBus = bridge.createChannel('shared', ['plugin-a', 'plugin-b']);

// Plugin A sends message
forwarder.getSandbox('plugin-a')?.emit(
  'channel:shared:message',
  { from: 'plugin-a', message: 'Hello' },
  { priority: EventPriority.NORMAL }
);

// Plugin B receives message
channelBus.on('channel:shared:message', (event) => {
  console.log('Received:', event.payload);
});
```

### 3. Resource Management

```typescript
import {
  QuotaManager,
  ResourceMonitor,
} from '@gridkit/plugin';

const quotaManager = new QuotaManager();
const resourceMonitor = new ResourceMonitor();

// Set quotas
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});

// Start monitoring
resourceMonitor.startMonitoring(1000);

// Check quotas before operations
if (quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
  bus.emit('event', data);
}

// Stop monitoring when done
resourceMonitor.stopMonitoring();
```

## Documentation

### API Documentation

- **[EventSandbox](./api/EventSandbox.md)**: Isolated event handling for plugins
- **[PermissionManager](./api/PermissionManager.md)**: Capability-based access control
- **[QuotaManager](./api/QuotaManager.md)**: Resource quota enforcement
- **[EventValidator](./api/EventValidator.md)**: Event validation and sanitization
- **[ErrorBoundary](./api/ErrorBoundary.md)**: Error isolation for plugins
- **[ResourceMonitor](./api/ResourceMonitor.md)**: Real-time resource monitoring
- **[PluginEventForwarder](./api/PluginEventForwarder.md)**: Sandbox management
- **[CrossPluginBridge](./api/CrossPluginBridge.md)**: Cross-plugin communication
- **[SandboxedPluginManager](./api/SandboxedPluginManager.md)**: High-level plugin management

### User Guides

- **[Plugin Security Guide](./guides/PluginSecurityGuide.md)**: Security best practices
- **[Permission Management Guide](./guides/PermissionManagementGuide.md)**: Permission management
- **[Resource Quota Guide](./guides/ResourceQuotaGuide.md)**: Resource quota management

### Code Examples

- **[Basic Plugin Example](./examples/BasicPluginExample.md)**: Basic plugin setup
- **[Cross-Plugin Communication Example](./examples/CrossPluginCommunicationExample.md)**: Inter-plugin communication
- **[Resource Management Example](./examples/ResourceManagementExample.md)**: Resource management

## Key Features

### 1. Event Isolation

Each plugin runs in its own isolated event sandbox:

```typescript
const sandbox = new EventSandbox('plugin-1', baseBus, ['emit:*']);
const pluginBus = sandbox.getBus();

// Plugin events are isolated
pluginBus.on('event', handler);
```

### 2. Permission Management

Plugins only have access to what they're permitted:

```typescript
const sandbox = new EventSandbox('plugin-1', baseBus, [
  'emit:data:*',
  'receive:ui:*',
]);
```

### 3. Resource Quotas

Prevent plugins from consuming excessive resources:

```typescript
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});
```

### 4. Security

Protect against code injection and prototype pollution:

```typescript
const validator = new EventValidator();
const sanitized = validator.sanitizeEvent(event);
```

### 5. Error Handling

Isolate plugin errors to prevent system crashes:

```typescript
const errorBoundary = new ErrorBoundary('plugin-1', onError);
const safeHandler = errorBoundary.wrap(handler);
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Plugin System                      │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐            │
│  │ EventSandbox │  │ Permissions│            │
│  │   (Isolation)│  │   (Access) │            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  QuotaManager│  │ ResourceMonitor│          │
│  │   (Quotas)   │  │  (Monitoring)│            │
│  └──────────────┘  └──────────────┘            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │EventValidator│  │ErrorBoundary │            │
│  │   (Security) │  │   (Safety) │             │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

## Best Practices

### 1. Use Minimal Permissions

```typescript
// Good
const permissions = ['emit:data:*', 'receive:ui:*'];

// Bad
const permissions = ['*'];
```

### 2. Validate All Inputs

```typescript
// Good
const result = validator.validateEvent(event);
if (!result.isValid) {
  return;
}

// Bad
processEvent(event); // No validation!
```

### 3. Monitor Resource Usage

```typescript
// Good
resourceMonitor.recordEventEmission(pluginId, size);
if (resourceMonitor.isExceedingLimits(pluginId)) {
  console.warn('Plugin using too many resources');
}

// Bad
// No monitoring!
```

### 4. Handle Errors Gracefully

```typescript
// Good
const safeHandler = errorBoundary.wrap(handler, 'context');

// Bad
bus.on('event', handler); // No error handling!
```

## Security Checklist

- [ ] Grant minimal permissions
- [ ] Validate all event inputs
- [ ] Sanitize all event payloads
- [ ] Use error boundaries for all handlers
- [ ] Set resource quotas for all plugins
- [ ] Monitor plugin resource usage
- [ ] Log security events
- [ ] Regular security audits

## Performance Guidelines

- Set appropriate quotas based on usage patterns
- Monitor resource usage in real-time
- Use specific permissions over wildcards
- Clean up resources when plugins are unloaded
- Use asynchronous operations for long-running tasks

## Troubleshooting

### Plugin Not Receiving Events

1. Check permissions: Ensure plugin has `receive:*` or specific receive permissions
2. Check sandbox: Verify plugin is using the correct local bus
3. Check forwarding: Ensure EventForwarder is properly configured

### Plugin Emitting Too Many Events

1. Check quotas: Set appropriate `maxEventsPerSecond` quota
2. Monitor usage: Use ResourceMonitor to track event rates
3. Implement rate limiting: Queue events if needed

### Plugin Consuming Too Much CPU

1. Check handler time quotas: Set `maxHandlerTimePerSecond`
2. Profile handlers: Identify slow operations
3. Use async operations: Break up long-running tasks

## Contributing

When contributing to the plugin system:

1. Follow the coding standards in [.ai/rules/01-typescript-standards.md](../../.ai/rules/01-typescript-standards.md)
2. Add tests in `src/plugin/__tests__/`
3. Update documentation as needed
4. Ensure >95% test coverage
5. Follow security best practices

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## See Also

- [GridKit Core Documentation](../../../README.md)
- [Plugin Development Guide](../../../docs/PLUGINS.md)
- [Architecture Documentation](../../../docs/ARCHITECTURE.md)
