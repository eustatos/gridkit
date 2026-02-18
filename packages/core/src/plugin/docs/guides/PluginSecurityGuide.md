# Plugin Security Guide

## Overview

This guide covers security best practices for plugin development with GridKit's event isolation system. Plugins run in isolated environments, but proper security practices are essential to prevent abuse and protect the core system.

## Key Security Principles

### 1. Principle of Least Privilege

Only grant plugins the minimum permissions they need to function.

```typescript
// Good - minimal permissions
const plugin = manager.registerPlugin('data-plugin', {
  permissions: ['emit:data:*', 'receive:ui:*'],
});

// Bad - overly broad permissions
const plugin = manager.registerPlugin('data-plugin', {
  permissions: ['*'],
});
```

### 2. Input Validation

Always validate and sanitize event payloads before processing.

```typescript
// Good
const result = validator.validateEvent(event);
if (!result.isValid) {
  throw new Error('Invalid event');
}

const sanitized = validator.sanitizeEvent(event);

// Bad
processEvent(event); // No validation!
```

### 3. Error Isolation

Use error boundaries to prevent plugin errors from affecting other plugins.

```typescript
// Good
const safeHandler = errorBoundary.wrap((event) => {
  processEvent(event);
}, 'event-handler');

// Bad
bus.on('event', (event) => {
  processEvent(event); // No error handling!
});
```

### 4. Resource Quotas

Enforce resource quotas to prevent plugins from consuming excessive resources.

```typescript
// Good
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100,
  maxHandlerTimePerSecond: 50,
});

// Bad
// No quotas set - plugin could consume infinite resources
```

## Common Security Threats

### 1. Prototype Pollution

Attackers may try to inject dangerous properties into event payloads.

```typescript
// Attack
const maliciousEvent = {
  type: 'data-update',
  payload: {
    data: 'legitimate',
    __proto__: { dangerous: 'value' },
  },
};

// Defense
const sanitized = validator.sanitizeEvent(maliciousEvent);
console.log(sanitized.payload.__proto__); // undefined
```

### 2. Code Injection

Attackers may try to inject executable code through events.

```typescript
// Attack
const maliciousEvent = {
  type: 'command',
  payload: {
    code: 'eval("malicious code")',
  },
};

// Defense
const safePayload = sanitizer.sanitize(maliciousEvent.payload);
// Functions are removed from payload
```

### 3. Event Flooding

Attackers may try to flood the event system.

```typescript
// Defense
quotaManager.setQuota('plugin-1', {
  maxEventsPerSecond: 100, // Limit to 100 events/second
});

if (!quotaManager.checkQuota('plugin-1', 'maxEventsPerSecond', 1)) {
  console.warn('Event rate limit exceeded');
  return;
}
```

### 4. Memory Exhaustion

Attackers may try to consume excessive memory.

```typescript
// Defense
quotaManager.setQuota('plugin-1', {
  maxMemoryUsage: 1024 * 1024, // 1MB limit
});

// Monitor memory usage
resourceMonitor.recordEventEmission('plugin-1', size);
if (resourceMonitor.isExceedingLimits('plugin-1')) {
  console.warn('Plugin exceeding memory limits');
}
```

## Security Checklist

- [ ] Grant minimal permissions to plugins
- [ ] Validate all event inputs
- [ ] Sanitize all event payloads
- [ ] Use error boundaries for all handlers
- [ ] Set resource quotas for all plugins
- [ ] Monitor plugin resource usage
- [ ] Log security events
- [ ] Regular security audits
- [ ] Update dependencies regularly
- [ ] Follow the principle of least privilege

## Secure Plugin Template

```typescript
import {
  EventSandbox,
  PermissionManager,
  QuotaManager,
  ErrorBoundary,
  ResourceMonitor,
  EventValidator,
} from '@gridkit/plugin';

class SecurePlugin {
  private sandbox: EventSandbox;
  private permissionManager: PermissionManager;
  private quotaManager: QuotaManager;
  private errorBoundary: ErrorBoundary;
  private resourceMonitor: ResourceMonitor;
  private validator: EventValidator;
  private pluginId: string;

  constructor(
    baseBus: EventBus,
    pluginId: string,
    permissions: string[]
  ) {
    this.pluginId = pluginId;

    // Initialize components
    this.sandbox = new EventSandbox(pluginId, baseBus, permissions);
    this.permissionManager = new PermissionManager();
    this.quotaManager = new QuotaManager();
    this.errorBoundary = new ErrorBoundary(pluginId, this.handlePluginError.bind(this));
    this.resourceMonitor = new ResourceMonitor();
    this.validator = new EventValidator();

    // Set quotas
    this.quotaManager.setQuota(pluginId, {
      maxEventsPerSecond: 100,
      maxHandlerTimePerSecond: 50,
    });

    // Start monitoring
    this.resourceMonitor.startMonitoring(1000);

    // Setup handlers
    this.setupHandlers();
  }

  private setupHandlers(): void {
    const localBus = this.sandbox.getBus();

    localBus.on('event', this.errorBoundary.wrap((event) => {
      // Validate event
      const result = this.validator.validateEvent(event);
      if (!result.isValid) {
        console.error('Invalid event:', result.errorMessage);
        return;
      }

      // Sanitize payload
      const sanitized = this.validator.sanitizeEvent(event);
      if (!sanitized) {
        console.warn('Event could not be sanitized');
        return;
      }

      // Process event
      this.handleEvent(sanitized);
    }, 'event-handler'));
  }

  private handleEvent(event: GridEvent): void {
    // Check quotas
    if (!this.quotaManager.checkQuota(this.pluginId, 'maxEventsPerSecond', 1)) {
      console.warn('Event quota exceeded');
      return;
    }

    // Process event
    try {
      // Event processing logic
      console.log('Processing event:', event.type);
    } finally {
      // Track resource usage
      this.resourceMonitor.recordEventEmission(this.pluginId, 100);
    }
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
```

## Best Practices

### 1. Use Specific Permissions

```typescript
// Good
const permissions = [
  'emit:data:*',
  'emit:config:*',
  'receive:ui:*',
];

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

### 3. Sanitize All Outputs

```typescript
// Good
const sanitized = validator.sanitizeEvent(event);
bus.emit(sanitized.type, sanitized.payload);

// Bad
bus.emit(event.type, event.payload); // No sanitization!
```

### 4. Monitor Resource Usage

```typescript
// Good
resourceMonitor.recordEventEmission(pluginId, size);
if (resourceMonitor.isExceedingLimits(pluginId)) {
  console.warn('Plugin using too many resources');
}

// Bad
// No monitoring!
```

### 5. Handle Errors Gracefully

```typescript
// Good
const safeHandler = errorBoundary.wrap((event) => {
  processEvent(event);
}, 'event-handler');

// Bad
bus.on('event', (event) => {
  processEvent(event); // No error handling!
});
```

## Security Auditing

### 1. Permission Auditing

Regularly review plugin permissions:

```typescript
function auditPermissions(pluginId: string, manager: PluginManager): void {
  const permissions = manager.getPluginPermissions(pluginId);
  
  // Check for overly broad permissions
  if (permissions.includes('*')) {
    console.warn('Plugin has wildcard permission');
  }
  
  // Log permissions for review
  console.log(`Plugin ${pluginId} permissions:`, permissions);
}
```

### 2. Resource Usage Auditing

Monitor resource usage patterns:

```typescript
function auditResourceUsage(pluginId: string, monitor: ResourceMonitor): void {
  const usage = monitor.getUsage(pluginId);
  
  // Check for unusual patterns
  if (usage.eventsEmitted > 500) {
    console.warn('Plugin emitting excessive events');
  }
  
  if (usage.handlerExecutionTime > 200) {
    console.warn('Plugin using excessive CPU');
  }
}
```

### 3. Error Pattern Auditing

Track error patterns:

```typescript
function auditErrors(pluginId: string, errorCount: number): void {
  if (errorCount > 10) {
    console.warn('Plugin has high error rate');
  }
}
```

## Related Documentation

- [EventSandbox API](../api/EventSandbox.md)
- [PermissionManager API](../api/PermissionManager.md)
- [QuotaManager API](../api/QuotaManager.md)
- [ErrorBoundary API](../api/ErrorBoundary.md)
- [ResourceMonitor API](../api/ResourceMonitor.md)
- [EventValidator API](../api/EventValidator.md)

## See Also

- [Permission Management Guide](./PermissionManagementGuide.md)
- [Resource Quota Guide](./ResourceQuotaGuide.md)
- [Plugin Development Best Practices](../../../docs/PLUGINS.md)
