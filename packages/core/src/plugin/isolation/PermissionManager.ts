/**
 * PermissionManager handles capability-based access control for plugins.
 * It manages plugin permissions and provides runtime permission checking.
 */
export class PermissionManager {
  private pluginPermissions = new Map<string, Set<string>>();
  private revokedPermissions = new Map<string, Set<string>>();

  /**
   * Defines capabilities for a plugin.
   * @param pluginId - The plugin identifier
   * @param capabilities - The capabilities to grant
   */
  public grantCapabilities(pluginId: string, capabilities: string[]): void {
    if (!this.pluginPermissions.has(pluginId)) {
      this.pluginPermissions.set(pluginId, new Set());
    }

    const permissions = this.pluginPermissions.get(pluginId);
    for (const capability of capabilities) {
      permissions.add(capability);
    }
  }

  /**
   * Revokes capabilities from a plugin.
   * @param pluginId - The plugin identifier
   * @param capabilities - The capabilities to revoke
   */
  public revokeCapabilities(pluginId: string, capabilities: string[]): void {
    if (!this.pluginPermissions.has(pluginId)) {
      return;
    }

    const permissions = this.pluginPermissions.get(pluginId);
    for (const capability of capabilities) {
      permissions.delete(capability);
    }

    // Track revoked permissions for runtime checking
    if (!this.revokedPermissions.has(pluginId)) {
      this.revokedPermissions.set(pluginId, new Set());
    }

    const revoked = this.revokedPermissions.get(pluginId);
    for (const capability of capabilities) {
      revoked.add(capability);
    }
  }

  /**
   * Checks if a plugin has a specific permission.
   * Supports exact matches and wildcard patterns (e.g., 'receive:*' matches 'receive:test').
   * @param pluginId - The plugin identifier
   * @param permission - The permission to check
   * @returns true if the plugin has the permission, false otherwise
   */
  public hasPermission(pluginId: string, permission: string): boolean {
    // Check if permission was revoked
    if (this.revokedPermissions.has(pluginId)) {
      const revoked = this.revokedPermissions.get(pluginId);
      if (revoked.has(permission)) {
        return false;
      }
    }

    // Check if plugin has the permission
    if (this.pluginPermissions.has(pluginId)) {
      const permissions = this.pluginPermissions.get(pluginId);
      
      // Exact match
      if (permissions.has(permission)) {
        return true;
      }
      
      // Global wildcard matches everything
      if (permissions.has('*')) {
        return true;
      }
      
      // Check for pattern matches (e.g., 'receive:*' matches 'receive:test')
      for (const perm of permissions) {
        if (perm.endsWith(':*')) {
          const prefix = perm.slice(0, perm.indexOf(':*'));
          if (permission.startsWith(prefix + ':')) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Checks if a plugin has all required permissions.
   * @param pluginId - The plugin identifier
   * @param permissions - The permissions to check
   * @returns true if the plugin has all permissions, false otherwise
   */
  public hasAllPermissions(pluginId: string, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(pluginId, permission));
  }

  /**
   * Checks if a plugin has any of the required permissions.
   * @param pluginId - The plugin identifier
   * @param permissions - The permissions to check
   * @returns true if the plugin has any of the permissions, false otherwise
   */
  public hasAnyPermission(pluginId: string, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(pluginId, permission));
  }

  /**
   * Gets all permissions for a plugin.
   * @param pluginId - The plugin identifier
   * @returns Array of permissions
   */
  public getPermissions(pluginId: string): string[] {
    if (!this.pluginPermissions.has(pluginId)) {
      return [];
    }
    return Array.from(this.pluginPermissions.get(pluginId));
  }

  /**
   * Clears all permissions for a plugin.
   * @param pluginId - The plugin identifier
   */
  public clearPermissions(pluginId: string): void {
    this.pluginPermissions.delete(pluginId);
    this.revokedPermissions.delete(pluginId);
  }
}