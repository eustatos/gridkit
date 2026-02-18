import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionManager } from '../../isolation/PermissionManager';

describe('Permission Performance', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
    permissionManager.grantCapabilities('test-plugin', ['read:data', 'write:config', 'emit:events', 'receive:updates', '*']);
  });

  describe('permission checking overhead', () => {
    it('should check permissions in < 0.1ms', () => {
      const iterations = 1000;
      const testCases = [
        ['test-plugin', 'read:data'],
        ['test-plugin', 'write:config'],
        ['test-plugin', 'non-existent'],
        ['test-plugin', '*'],
      ];

      let totalDuration = 0;

      for (let i = 0; i < iterations; i++) {
        const [pluginId, permission] = testCases[i % testCases.length];
        const start = performance.now();
        permissionManager.hasPermission(pluginId, permission);
        const duration = performance.now() - start;
        totalDuration += duration;
      }

      const averageDuration = totalDuration / iterations;
      expect(averageDuration).toBeLessThan(0.1);
    });

    it('should handle 10000 permission checks within 100ms', () => {
      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        permissionManager.hasPermission('test-plugin', 'read:data');
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should scale linearly with permission count', () => {
      const smallSet = 10;
      const largeSet = 100;

      const smallPermissions = Array.from({ length: smallSet }, (_, i) => `perm:${i}`);
      permissionManager.grantCapabilities('small-plugin', smallPermissions);

      const largePermissions = Array.from({ length: largeSet }, (_, i) => `perm:${i}`);
      permissionManager.grantCapabilities('large-plugin', largePermissions);

      const smallStart = performance.now();
      for (let i = 0; i < 100; i++) {
        permissionManager.hasPermission('small-plugin', `perm:${Math.floor(Math.random() * smallSet)}`);
      }
      const smallDuration = performance.now() - smallStart;

      const largeStart = performance.now();
      for (let i = 0; i < 100; i++) {
        permissionManager.hasPermission('large-plugin', `perm:${Math.floor(Math.random() * largeSet)}`);
      }
      const largeDuration = performance.now() - largeStart;

      const ratio = largeDuration / smallDuration;
      expect(ratio).toBeLessThan(3);
    });
  });

  describe('batch permission checking', () => {
    it('should check all permissions in < 5ms for 100 permissions', () => {
      const permissions = Array.from({ length: 100 }, (_, i) => `perm:${i}`);
      permissionManager.grantCapabilities('batch-plugin', permissions);

      const start = performance.now();
      permissionManager.hasAllPermissions('batch-plugin', permissions.slice(0, 50));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
    });

    it('should check any permission in < 5ms for 100 permissions', () => {
      const permissions = Array.from({ length: 100 }, (_, i) => `perm:${i}`);
      permissionManager.grantCapabilities('batch-plugin', permissions);

      const start = performance.now();
      permissionManager.hasAnyPermission('batch-plugin', ['perm:50', 'perm:75', 'perm:99']);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('revocation performance', () => {
    it('should revoke permissions in < 5ms', () => {
      const permissions = Array.from({ length: 50 }, (_, i) => `perm:${i}`);
      permissionManager.grantCapabilities('revocation-plugin', permissions);

      const start = performance.now();
      permissionManager.revokeCapabilities('revocation-plugin', ['perm:0', 'perm:1', 'perm:2']);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
    });

    it('should check revoked permissions in < 5ms', () => {
      const permissions = Array.from({ length: 50 }, (_, i) => `perm:${i}`);
      permissionManager.grantCapabilities('revocation-plugin', permissions);
      permissionManager.revokeCapabilities('revocation-plugin', ['perm:0']);

      const start = performance.now();
      permissionManager.hasPermission('revocation-plugin', 'perm:0');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
    });
  });

  describe('wildcard permission performance', () => {
    it('should check wildcard permissions in < 0.1ms', () => {
      permissionManager.grantCapabilities('wildcard-plugin', ['*']);

      const start = performance.now();
      permissionManager.hasPermission('wildcard-plugin', 'any-permission');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(0.1);
    });

    it('should handle wildcard revocation in < 0.1ms', () => {
      permissionManager.grantCapabilities('wildcard-plugin', ['*']);
      permissionManager.revokeCapabilities('wildcard-plugin', ['specific-permission']);

      const start = performance.now();
      permissionManager.hasPermission('wildcard-plugin', 'specific-permission');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(0.1);
    });
  });
});
