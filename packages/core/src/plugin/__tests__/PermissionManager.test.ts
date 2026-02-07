import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionManager } from '../isolation/PermissionManager';

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
  });

  describe('grantCapabilities', () => {
    it('should grant capabilities to a plugin', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data', 'write:config']);

      expect(permissionManager.hasPermission('test-plugin', 'read:data')).toBe(true);
      expect(permissionManager.hasPermission('test-plugin', 'write:config')).toBe(true);
    });

    it('should handle multiple capability grants', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data']);
      permissionManager.grantCapabilities('test-plugin', ['write:config']);

      expect(permissionManager.hasPermission('test-plugin', 'read:data')).toBe(true);
      expect(permissionManager.hasPermission('test-plugin', 'write:config')).toBe(true);
    });
  });

  describe('revokeCapabilities', () => {
    it('should revoke capabilities from a plugin', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data', 'write:config']);
      permissionManager.revokeCapabilities('test-plugin', ['read:data']);

      expect(permissionManager.hasPermission('test-plugin', 'read:data')).toBe(false);
      expect(permissionManager.hasPermission('test-plugin', 'write:config')).toBe(true);
    });

    it('should handle revoking non-existent capabilities', () => {
      expect(() => {
        permissionManager.revokeCapabilities('test-plugin', ['non-existent']);
      }).not.toThrow();
    });
  });

  describe('hasPermission', () => {
    it('should return true for granted permissions', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data']);
      expect(permissionManager.hasPermission('test-plugin', 'read:data')).toBe(true);
    });

    it('should return false for denied permissions', () => {
      expect(permissionManager.hasPermission('test-plugin', 'read:data')).toBe(false);
    });

    it('should return true for wildcard permissions', () => {
      permissionManager.grantCapabilities('test-plugin', ['*']);
      expect(permissionManager.hasPermission('test-plugin', 'any-permission')).toBe(true);
    });

    it('should return false for revoked permissions', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data']);
      permissionManager.revokeCapabilities('test-plugin', ['read:data']);
      expect(permissionManager.hasPermission('test-plugin', 'read:data')).toBe(false);
    });

    it('should return false for non-existent plugins', () => {
      expect(permissionManager.hasPermission('non-existent-plugin', 'read:data')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if plugin has all permissions', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data', 'write:config']);
      expect(
        permissionManager.hasAllPermissions('test-plugin', ['read:data', 'write:config'])
      ).toBe(true);
    });

    it('should return false if plugin is missing any permission', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data']);
      expect(
        permissionManager.hasAllPermissions('test-plugin', ['read:data', 'write:config'])
      ).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if plugin has any of the permissions', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data']);
      expect(
        permissionManager.hasAnyPermission('test-plugin', ['read:data', 'write:config'])
      ).toBe(true);
    });

    it('should return false if plugin has none of the permissions', () => {
      expect(
        permissionManager.hasAnyPermission('test-plugin', ['read:data', 'write:config'])
      ).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('should return all permissions for a plugin', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data', 'write:config']);
      const permissions = permissionManager.getPermissions('test-plugin');

      expect(permissions).toEqual(expect.arrayContaining(['read:data', 'write:config']));
      expect(permissions.length).toBe(2);
    });

    it('should return empty array for non-existent plugins', () => {
      const permissions = permissionManager.getPermissions('non-existent-plugin');
      expect(permissions).toEqual([]);
    });
  });

  describe('clearPermissions', () => {
    it('should clear all permissions for a plugin', () => {
      permissionManager.grantCapabilities('test-plugin', ['read:data', 'write:config']);
      permissionManager.clearPermissions('test-plugin');

      expect(permissionManager.hasPermission('test-plugin', 'read:data')).toBe(false);
      expect(permissionManager.getPermissions('test-plugin')).toEqual([]);
    });

    it('should handle clearing permissions for non-existent plugins', () => {
      expect(() => {
        permissionManager.clearPermissions('non-existent-plugin');
      }).not.toThrow();
    });
  });
});