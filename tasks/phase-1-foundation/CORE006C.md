# CORE-006C: Plugin Event Isolation & Sandboxing

## 🎯 Goal

Implement secure event isolation between plugins with sandboxed execution, permission-based event filtering, and resource quotas.

## 📋 What to implement

### 1. Event Sandbox System

- Plugin-scoped event buses with automatic cleanup
- Event forwarding with permission checks
- Isolated event namespaces (`plugin:{id}:*`)
- Cross-plugin event communication via controlled channels
- Event payload validation for inter-plugin communication

### 2. Permission System

- Define plugin capabilities (`read:data`, `write:config`, `emit:events`)
- Capability-based event filtering
- Permission escalation prevention
- Runtime permission checking
- Permission revocation support

### 3. Resource Quotas & Limits

- Event emission rate limiting per plugin
- Handler execution time quotas
- Memory usage monitoring
- Automatic plugin suspension on quota violations
- Graceful degradation when limits exceeded

### 4. Security & Isolation

- Plugin event handler error boundaries
- Malformed event payload sanitization
- Event loop blocking prevention
- Cross-plugin interference prevention
- Secure event source verification

## 🚫 What NOT to do

- Do NOT implement full sandbox VM isolation
- Do NOT add complex ACL systems
- Do NOT implement encryption/decryption
- Do NOT add user authentication
- Keep focus on event-level isolation only

## 📁 File Structure

```
packages/core/src/plugin/
├── isolation/
│   ├── EventSandbox.ts     # Plugin-scoped event bus
│   ├── PermissionManager.ts # Capability-based access control
│   └── QuotaManager.ts     # Resource limits enforcement
├── security/
│   ├── EventValidator.ts   # Payload validation & sanitization
│   ├── ErrorBoundary.ts    # Plugin error isolation
│   └── ResourceMonitor.ts  # Runtime resource tracking
├── events/
│   ├── PluginEventForwarder.ts
│   └── CrossPluginBridge.ts
└── SandboxedPluginManager.ts
```

## 🧪 Test Requirements

- [ ] Event isolation: Plugin A cannot intercept Plugin B's events
- [ ] Permission checks: Plugins only emit events they have permission for
- [ ] Quota enforcement: Rate limits prevent plugin abuse
- [ ] Error boundaries: Plugin errors don't affect others
- [ ] Cross-plugin communication: Works only through approved channels
- [ ] Resource cleanup: No memory leaks after plugin destruction
- [ ] Performance: < 0.1ms overhead for permission checks
- [ ] Security: Malformed events are sanitized or rejected

## 💡 Implementation Example

```typescript
// isolation/EventSandbox.ts
export class EventSandbox {
  private pluginId: string;
  private baseBus: EventBus;
  private localBus = new EventBus();
  private permissions: Set<string>;

  constructor(pluginId: string, baseBus: EventBus, permissions: string[]) {
    this.pluginId = pluginId;
    this.baseBus = baseBus;
    this.permissions = new Set(permissions);

    // Forward approved events from plugin to base bus
    this.localBus.on('*', (event) => {
      if (this.hasPermission(`emit:${event.type}`)) {
        const sandboxedEvent = this.sandboxEvent(event);
        this.baseBus.emit(sandboxedEvent.type, sandboxedEvent.payload);
      }
    });

    // Forward approved events from base bus to plugin
    this.baseBus.on('*', (event) => {
      if (this.canReceiveEvent(event.type)) {
        this.localBus.emit(event.type, event.payload);
      }
    });
  }

  private hasPermission(permission: string): boolean {
    return this.permissions.has(permission) || this.permissions.has('*');
  }

  private sandboxEvent(event: GridEvent): GridEvent {
    return {
      ...event,
      source: `plugin:${this.pluginId}`,
      metadata: {
        ...event.metadata,
        sandboxed: true,
        pluginId: this.pluginId,
      },
    };
  }
}

// isolation/QuotaManager.ts
export class QuotaManager {
  private quotas = new Map<string, PluginQuota>();
  private usage = new Map<string, ResourceUsage>();

  checkQuota(pluginId: string, resource: string, amount: number): boolean {
    const quota = this.quotas.get(pluginId);
    const currentUsage = this.usage.get(pluginId) || this.createUsage();

    if (!quota || !quota[resource]) return true; // No quota = unlimited

    const limit = quota[resource]!;
    const used = currentUsage[resource] || 0;

    if (used + amount > limit) {
      this.onQuotaExceeded(pluginId, resource, limit);
      return false;
    }

    currentUsage[resource] = used + amount;
    this.usage.set(pluginId, currentUsage);
    return true;
  }

  resetUsage(pluginId: string): void {
    this.usage.set(pluginId, this.createUsage());
  }
}
```

## 🔗 Dependencies

- CORE-006A (Plugin System Foundation) - Required
- CORE-005C (Priority Scheduling) - Required for quota management
- CORE-005D (Middleware System) - Recommended for permission middleware

## 📊 Success Criteria

- 100% event isolation between plugins
- < 1ms overhead for permission checking (cached)
- Zero cross-plugin interference in stress tests
- Graceful handling of quota violations
- Complete resource cleanup on plugin destruction
- All security edge cases covered by tests
