# Permission Management Guide

## Overview

This guide covers permission management best practices for GridKit plugins. Proper permission management ensures plugins can only access the resources they need while preventing unauthorized access.

## Permission System Overview

GridKit uses a capability-based access control system with the following features:

- **Exact Match**: Specific permission strings
- **Wildcard Patterns**: Use `*` for broad permissions
- **Category Wildcards**: Use `category:*` for category-level access
- **Runtime Revocation**: Dynamically revoke permissions

## Permission Format

Permissions follow the format: `action:category:resource`

Examples:
- `read:data` - Read data
- `write:config` - Write configuration
- `emit:*` - Emit any event
- `receive:*` - Receive any event
- `emit:data:*` - Emit any data event
- `receive:config:*` - Receive any config event

## Best Practices

### 1. Use the Principle of Least Privilege

Grant only the minimum permissions required.

```typescript
// Good - minimal permissions
const permissions = [
  'read:data',
  'write:data',
  'receive:ui:*',
];

// Bad - overly broad permissions
const permissions = ['*'];
```

### 2. Use Specific Permissions

Prefer specific permissions over wildcard patterns.

```typescript
// Good - specific permissions
const permissions = [
  'emit:data:read',
  'emit:data:write',
  'receive:ui:*',
];

// Bad - uses wildcard
const permissions = ['emit:*', 'receive:ui:*'];
```

### 3. Use Category Wildcards When Appropriate

Category wildcards are acceptable when the category is well-defined.

```typescript
// Good - category wildcard for well-defined category
const permissions = [
  'emit:data:*',
  'receive:config:*',
];

// Bad - wildcard for broad categories
const permissions = ['emit:*']; // Too broad!
```

### 4. Revoke Permissions When No Longer Needed

Remove permissions when plugin features are disabled.

```typescript
// Good
function disableFeature(pluginId: string): void {
  permissionManager.revokeCapabilities(pluginId, ['write:config']);
}

// Bad
function disableFeature(pluginId: string): void {
  // No permission revocation!
}
```

### 5. Use Group Permission Checks

Check for multiple permissions at once.

```typescript
// Good
if (permissionManager.hasAllPermissions(pluginId, [
  'read:data',
  'write:data',
  'admin:*',
])) {
  performOperation();
}

// Bad
if (permissionManager.hasPermission(pluginId, 'read:data') &&
    permissionManager.hasPermission(pluginId, 'write:data') &&
    permissionManager.hasPermission(pluginId, 'admin:*')) {
  performOperation();
}
```

## Permission Patterns

### 1. Data Access Pattern

```typescript
// Plugin needs to read and write data
const permissions = [
  'read:data:*',
  'write:data:*',
];

// Check before operations
if (permissionManager.hasAllPermissions(pluginId, [
  'read:data:users',
  'write:data:users',
])) {
  // Safe to access user data
}
```

### 2. Configuration Pattern

```typescript
// Plugin needs to read configuration
const permissions = [
  'read:config:*',
];

// Check before reading config
if (permissionManager.hasPermission(pluginId, 'read:config:app')) {
  const config = readConfig('app');
}
```

### 3. UI Pattern

```typescript
// Plugin needs to emit UI events
const permissions = [
  'emit:ui:*',
  'receive:ui:*',
];

// Emit UI events
if (permissionManager.hasPermission(pluginId, 'emit:ui:update')) {
  bus.emit('ui:update', data);
}
```

### 4. Admin Pattern

```typescript
// Admin plugin needs all permissions
const permissions = ['*'];

// Only grant to trusted plugins!
if (isTrustedPlugin(pluginId)) {
  permissionManager.grantCapabilities(pluginId, ['*']);
}
```

## Common Permission Scenarios

### 1. Read-Only Plugin

```typescript
const permissions = [
  'read:data:*',
  'read:config:*',
  'receive:ui:*',
];

// Plugin can read data, read config, and receive UI events
// But cannot write or emit events
```

### 2. Write-Only Plugin

```typescript
const permissions = [
  'write:data:*',
  'write:config:*',
  'emit:ui:*',
];

// Plugin can write data, write config, and emit UI events
// But cannot read data or receive events
```

### 3. Event Forwarder Plugin

```typescript
const permissions = [
  'emit:*',
  'receive:*',
];

// Plugin can emit and receive any events
// Useful for plugins that forward events between systems
```

### 4. Event Filter Plugin

```typescript
const permissions = [
  'receive:*',
  'emit:filtered:*',
];

// Plugin can receive any events
// But can only emit events with 'filtered:' prefix
```

## Permission Management API

### Grant Permissions

```typescript
permissionManager.grantCapabilities(pluginId, [
  'read:data',
  'write:data',
]);
```

### Revoke Permissions

```typescript
permissionManager.revokeCapabilities(pluginId, [
  'write:data',
]);
```

### Check Single Permission

```typescript
if (permissionManager.hasPermission(pluginId, 'read:data')) {
  // Plugin has 'read:data' permission
}
```

### Check Multiple Permissions

```typescript
// All permissions required
if (permissionManager.hasAllPermissions(pluginId, [
  'read:data',
  'write:data',
])) {
  // Plugin has both permissions
}

// Any permission sufficient
if (permissionManager.hasAnyPermission(pluginId, [
  'admin:*',
  'read:data',
])) {
  // Plugin has at least one permission
}
```

### Get All Permissions

```typescript
const permissions = permissionManager.getPermissions(pluginId);
console.log('Plugin permissions:', permissions);
```

### Clear All Permissions

```typescript
permissionManager.clearPermissions(pluginId);
```

## Permission Auditing

### 1. Audit Wildcard Permissions

```typescript
function auditWildcardPermissions(permissionManager: PermissionManager): void {
  const plugins = getAllPlugins();
  
  for (const pluginId of plugins) {
    const permissions = permissionManager.getPermissions(pluginId);
    
    if (permissions.includes('*')) {
      console.warn(`Plugin ${pluginId} has wildcard permission!`);
    }
  }
}
```

### 2. Audit Unused Permissions

```typescript
function auditUnusedPermissions(permissionManager: PermissionManager): void {
  const plugins = getAllPlugins();
  
  for (const pluginId of plugins) {
    const permissions = permissionManager.getPermissions(pluginId);
    
    // Check for overly broad permissions
    if (permissions.length > 10) {
      console.warn(`Plugin ${pluginId} has many permissions:`, permissions);
    }
  }
}
```

### 3. Audit Permission Changes

```typescript
function auditPermissionChanges(
  permissionManager: PermissionManager,
  pluginId: string
): void {
  const permissions = permissionManager.getPermissions(pluginId);
  
  // Log permission changes
  console.log(`Plugin ${pluginId} permissions:`, permissions);
  
  // Check for suspicious patterns
  if (permissions.includes('*')) {
    console.error('Plugin has wildcard permission - requires audit');
  }
}
```

## Permission Best Practices Checklist

- [ ] Grant minimal permissions
- [ ] Use specific permissions over wildcards
- [ ] Revoke permissions when no longer needed
- [ ] Audit wildcard permissions regularly
- [ ] Log permission changes
- [ ] Use group permission checks
- [ ] Document required permissions
- [ ] Review permissions periodically
- [ ] Test with minimal permissions
- [ ] Use least privilege for all plugins

## Examples

### Role-Based Permission Management

```typescript
enum PluginRole {
  READER = 'reader',
  WRITER = 'writer',
  ADMIN = 'admin',
}

class RoleBasedPermissionManager {
  private permissionManager = new PermissionManager();

  public assignRole(pluginId: string, role: PluginRole): void {
    switch (role) {
      case PluginRole.READER:
        this.permissionManager.grantCapabilities(pluginId, [
          'read:data',
          'read:config',
        ]);
        break;
      case PluginRole.WRITER:
        this.permissionManager.grantCapabilities(pluginId, [
          'read:data',
          'write:data',
          'read:config',
        ]);
        break;
      case PluginRole.ADMIN:
        this.permissionManager.grantCapabilities(pluginId, ['*']);
        break;
    }
  }

  public removeRole(pluginId: string, role: PluginRole): void {
    switch (role) {
      case PluginRole.READER:
        this.permissionManager.revokeCapabilities(pluginId, [
          'read:data',
          'read:config',
        ]);
        break;
      case PluginRole.WRITER:
        this.permissionManager.revokeCapabilities(pluginId, [
          'read:data',
          'write:data',
          'read:config',
        ]);
        break;
      case PluginRole.ADMIN:
        this.permissionManager.clearPermissions(pluginId);
        break;
    }
  }
}
```

### Dynamic Permission Management

```typescript
class DynamicPermissionManager {
  private permissionManager = new PermissionManager();
  private permissionsByFeature = new Map<string, string[]>();

  public registerFeature(feature: string, permissions: string[]): void {
    this.permissionsByFeature.set(feature, permissions);
  }

  public enableFeature(pluginId: string, feature: string): void {
    const permissions = this.permissionsByFeature.get(feature);
    if (permissions) {
      this.permissionManager.grantCapabilities(pluginId, permissions);
    }
  }

  public disableFeature(pluginId: string, feature: string): void {
    const permissions = this.permissionsByFeature.get(feature);
    if (permissions) {
      this.permissionManager.revokeCapabilities(pluginId, permissions);
    }
  }

  public hasFeature(pluginId: string, feature: string): boolean {
    const permissions = this.permissionsByFeature.get(feature);
    if (!permissions) {
      return false;
    }
    return this.permissionManager.hasAllPermissions(pluginId, permissions);
  }
}
```

## Related Documentation

- [PermissionManager API](../api/PermissionManager.md)
- [EventSandbox API](../api/EventSandbox.md)
- [Security Best Practices](./PluginSecurityGuide.md)

## See Also

- [Security Guide](./PluginSecurityGuide.md)
- [Permission Management Examples](../api/PermissionManager.md#examples)
