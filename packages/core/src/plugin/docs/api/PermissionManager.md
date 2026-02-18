# PermissionManager

## Overview

`PermissionManager` handles capability-based access control for plugins. It manages plugin permissions and provides runtime permission checking with support for wildcard patterns.

## Features

- **Capability Management**: Grant and revoke capabilities for plugins
- **Wildcard Support**: Support for wildcard patterns (e.g., `emit:*`)
- **Permission Validation**: Check if a plugin has specific permissions
- **Group Checks**: Check for multiple permissions at once
- **Runtime Permission Revocation**: Dynamically revoke permissions at runtime

## Installation

```typescript
import { PermissionManager } from '@gridkit/plugin/isolation/PermissionManager';
```

## Usage

### Creating a Permission Manager

```typescript
import { PermissionManager } from '@gridkit/plugin/isolation/PermissionManager';

const permissionManager = new PermissionManager();

// Grant capabilities to a plugin
permissionManager.grantCapabilities('plugin-1', [
  'read:data',
  'write:config',
]);

// Check permissions
if (permissionManager.hasPermission('plugin-1', 'read:data')) {
  // Plugin can read data
}

// Revoke capabilities
permissionManager.revokeCapabilities('plugin-1', ['write:config']);
```

### Using Wildcards

```typescript
// Grant wildcard permissions
permissionManager.grantCapabilities('plugin-1', ['*']);

// Now plugin has all permissions
permissionManager.hasPermission('plugin-1', 'any-permission'); // true

// Or use category wildcards
permissionManager.grantCapabilities('plugin-1', ['emit:*']);

// Can emit any event
permissionManager.hasPermission('plugin-1', 'emit:data'); // true
permissionManager.hasPermission('plugin-1', 'emit:config'); // true

// Cannot receive any event
permissionManager.hasPermission('plugin-1', 'receive:data'); // false
```

### Group Permission Checks

```typescript
// Grant multiple capabilities
permissionManager.grantCapabilities('plugin-1', [
  'read:data',
  'write:data',
  'read:config',
]);

// Check if plugin has ALL required permissions
const hasAll = permissionManager.hasAllPermissions('plugin-1', [
  'read:data',
  'write:data',
]);
console.log(hasAll); // true

// Check if plugin has ANY of the required permissions
const hasAny = permissionManager.hasAnyPermission('plugin-1', [
  'admin:access',
  'read:data', // This one matches
]);
console.log(hasAny); // true
```

## API

### Constructor

```typescript
new PermissionManager()
```

Creates a new permission manager instance.

### Methods

#### grantCapabilities()

```typescript
grantCapabilities(pluginId: string, capabilities: string[]): void
```

Defines capabilities for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `capabilities` (string[]): The capabilities to grant

**Example**:

```typescript
permissionManager.grantCapabilities('plugin-1', [
  'read:data',
  'write:config',
  'emit:*',
]);
```

#### revokeCapabilities()

```typescript
revokeCapabilities(pluginId: string, capabilities: string[]): void
```

Revokes capabilities from a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `capabilities` (string[]): The capabilities to revoke

**Example**:

```typescript
// Revoke specific capabilities
permissionManager.revokeCapabilities('plugin-1', ['write:config']);

// Revoke all capabilities
permissionManager.grantCapabilities('plugin-1', ['*']);
permissionManager.revokeCapabilities('plugin-1', ['*']);
```

#### hasPermission()

```typescript
hasPermission(pluginId: string, permission: string): boolean
```

Checks if a plugin has a specific permission.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `permission` (string): The permission to check

**Returns**: `boolean` - `true` if the plugin has the permission, `false` otherwise

**Example**:

```typescript
permissionManager.grantCapabilities('plugin-1', ['read:data']);

permissionManager.hasPermission('plugin-1', 'read:data'); // true
permissionManager.hasPermission('plugin-1', 'write:data'); // false
permissionManager.hasPermission('plugin-1', 'admin:*'); // false
```

#### hasAllPermissions()

```typescript
hasAllPermissions(pluginId: string, permissions: string[]): boolean
```

Checks if a plugin has all required permissions.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `permissions` (string[]): The permissions to check

**Returns**: `boolean` - `true` if the plugin has all permissions, `false` otherwise

**Example**:

```typescript
permissionManager.grantCapabilities('plugin-1', [
  'read:data',
  'write:data',
  'read:config',
]);

permissionManager.hasAllPermissions('plugin-1', [
  'read:data',
  'write:data',
]); // true

permissionManager.hasAllPermissions('plugin-1', [
  'read:data',
  'admin:*',
]); // false
```

#### hasAnyPermission()

```typescript
hasAnyPermission(pluginId: string, permissions: string[]): boolean
```

Checks if a plugin has any of the required permissions.

**Parameters**:

- `pluginId` (string): The plugin identifier
- `permissions` (string[]): The permissions to check

**Returns**: `boolean` - `true` if the plugin has any of the permissions, `false` otherwise

**Example**:

```typescript
permissionManager.grantCapabilities('plugin-1', ['read:data']);

permissionManager.hasAnyPermission('plugin-1', [
  'read:data',
  'write:config',
]); // true

permissionManager.hasAnyPermission('plugin-1', [
  'admin:*',
  'superuser:*',
]); // false
```

#### getPermissions()

```typescript
getPermissions(pluginId: string): string[]
```

Gets all permissions for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier

**Returns**: `string[]` - Array of permissions (empty array if plugin has no permissions)

**Example**:

```typescript
permissionManager.grantCapabilities('plugin-1', [
  'read:data',
  'write:data',
]);

const permissions = permissionManager.getPermissions('plugin-1');
console.log(permissions); // ['read:data', 'write:data']
```

#### clearPermissions()

```typescript
clearPermissions(pluginId: string): void
```

Clears all permissions for a plugin.

**Parameters**:

- `pluginId` (string): The plugin identifier

**Example**:

```typescript
permissionManager.grantCapabilities('plugin-1', ['*']);

// Revoke all permissions
permissionManager.clearPermissions('plugin-1');

permissionManager.hasPermission('plugin-1', 'read:data'); // false
```

## Permission Patterns

### Exact Match

```typescript
permissionManager.grantCapabilities('plugin-1', ['read:data']);

// Must match exactly
permissionManager.hasPermission('plugin-1', 'read:data'); // true
permissionManager.hasPermission('plugin-1', 'read:*'); // false
```

### Category Wildcard

```typescript
permissionManager.grantCapabilities('plugin-1', ['emit:data:*']);

// Matches any event in the data category
permissionManager.hasPermission('plugin-1', 'emit:data:read'); // true
permissionManager.hasPermission('plugin-1', 'emit:data:write'); // true
permissionManager.hasPermission('plugin-1', 'emit:config:*'); // false
```

### Global Wildcard

```typescript
permissionManager.grantCapabilities('plugin-1', ['*']);

// Grants all permissions
permissionManager.hasPermission('plugin-1', 'any-action:*'); // true
permissionManager.hasPermission('plugin-1', 'read:*'); // true
```

## Best Practices

### 1. Use Specific Permissions

```typescript
// Good - narrow permissions
permissionManager.grantCapabilities('plugin-1', [
  'read:data',
  'write:data',
  'read:config',
]);

// Bad - overly broad permissions
permissionManager.grantCapabilities('plugin-1', ['*']);
```

### 2. Revoke Permissions When No Longer Needed

```typescript
// Revoke permissions when plugin feature is disabled
permissionManager.revokeCapabilities('plugin-1', ['write:config']);
```

### 3. Use Group Checks for Complex Permissions

```typescript
// Check if plugin has all required permissions for an operation
if (permissionManager.hasAllPermissions('plugin-1', [
  'read:data',
  'write:data',
  'admin:*',
])) {
  // Safe to perform operation
}
```

### 4. Check Permissions Before Operations

```typescript
// Good
if (permissionManager.hasPermission('plugin-1', 'write:config')) {
  configPlugin.updateConfig(newConfig);
}

// Bad - assumes permission
configPlugin.updateConfig(newConfig);
```

## Examples

### Basic Plugin Permission Management

```typescript
import { PermissionManager } from '@gridkit/plugin/isolation/PermissionManager';

class PluginManager {
  private permissionManager = new PermissionManager();

  public registerPlugin(pluginId: string, capabilities: string[]): void {
    // Grant initial capabilities
    this.permissionManager.grantCapabilities(pluginId, capabilities);
  }

  public disableFeature(pluginId: string, feature: string): void {
    // Revoke capability for a feature
    this.permissionManager.revokeCapabilities(pluginId, [feature]);
  }

  public canPerformAction(pluginId: string, action: string): boolean {
    return this.permissionManager.hasPermission(pluginId, action);
  }
}
```

### Role-Based Access Control

```typescript
import { PermissionManager } from '@gridkit/plugin/isolation/PermissionManager';

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

## Related Documentation

- [EventSandbox](./EventSandbox.md) - Use permissions in event sandboxes
- [QuotaManager](./QuotaManager.md) - Enforce resource quotas
- [PluginSecurityGuide](../guides/PluginSecurityGuide.md) - Security best practices

## See Also

- [Permission Management Guide](../guides/PermissionManagementGuide.md)
