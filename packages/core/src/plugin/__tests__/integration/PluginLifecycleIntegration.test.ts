import { describe, it, expect, vi } from 'vitest';
import { PermissionManager } from '../../isolation/PermissionManager';
import { QuotaManager } from '../../isolation/QuotaManager';
import { ResourceMonitor } from '../../security/ResourceMonitor';
import { EventSandbox } from '../..';
import { createEventBus, EventPriority } from '../../../events';
import { PluginEventForwarder } from '../..';
import { CrossPluginBridge } from '../..';

// Helper to wait for microtasks to complete
const flushMicrotasks = () =>
  new Promise((resolve) => {
    if (typeof queueMicrotask !== 'undefined') {
      queueMicrotask(() => queueMicrotask(() => queueMicrotask(resolve)));
    } else {
      // Fallback for environments without queueMicrotask
      setTimeout(resolve, 0);
    }
  });

describe('Plugin Lifecycle Integration', () => {
  describe('plugin initialization', () => {
    it('should initialize plugin with correct permissions', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const permissionManager = new PermissionManager();

      const pluginId = 'test-plugin';
      const permissions = ['read:data', 'write:config', 'emit:test'];

      permissionManager.grantCapabilities(pluginId, permissions);
      const pluginBus = forwarder.createSandbox(pluginId, permissions);

      expect(pluginBus).toBeDefined();
      expect(permissionManager.hasPermission(pluginId, 'read:data')).toBe(true);
    });

    it('should set up event forwarding on initialization', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);

      const pluginBus = forwarder.createSandbox('test-plugin', ['emit:test']);

      const baseHandler = vi.fn();
      baseBus.on('test', baseHandler);

      pluginBus.emit(
        'test',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      expect(baseHandler).toHaveBeenCalled();
      expect(baseHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test',
          payload: { data: 'test' },
          source: 'plugin:test-plugin',
          metadata: expect.objectContaining({
            sandboxed: true,
            pluginId: 'test-plugin',
          }),
        })
      );
    });

    it('should integrate with quota management on initialization', () => {
      const quotaManager = new QuotaManager();

      const pluginId = 'test-plugin';
      quotaManager.setQuota(pluginId, { maxEventsPerSecond: 100 });

      // Should be able to emit events within quota
      for (let i = 0; i < 100; i++) {
        expect(quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)).toBe(
          true
        );
      }

      // Should exceed quota
      expect(quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)).toBe(
        false
      );
    });
  });

  describe('plugin operation', () => {
    it('should handle plugin events with permission checking', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const permissionManager = new PermissionManager();

      const pluginId = 'test-plugin';
      const permissions = ['emit:allowed', 'receive:allowed'];
      permissionManager.grantCapabilities(pluginId, permissions);
      const pluginBus = forwarder.createSandbox(pluginId, permissions);

      const baseHandler = vi.fn();
      baseBus.on('allowed', baseHandler);
      baseBus.on('denied', baseHandler);

      // Should allow 'allowed' events
      pluginBus.emit(
        'allowed',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(baseHandler).toHaveBeenCalledTimes(1);
      expect(baseHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'allowed' })
      );

      // Should not allow 'denied' events
      pluginBus.emit(
        'denied',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(baseHandler).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should handle resource monitoring during operation', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const resourceMonitor = new ResourceMonitor();

      const pluginBus = forwarder.createSandbox('test-plugin', ['emit:*']);

      // Simulate plugin operation
      for (let i = 0; i < 100; i++) {
        pluginBus.emit(
          'test',
          { data: i },
          { priority: EventPriority.IMMEDIATE }
        );
        resourceMonitor.recordEventEmission('test-plugin', 100);
      }

      const usage = resourceMonitor.getUsage('test-plugin');
      expect(usage.eventsEmitted).toBe(100);
    });
  });

  describe('plugin suspension', () => {
    it('should suspend plugin on quota exceeded', () => {
      const quotaManager = new QuotaManager();

      const pluginId = 'test-plugin';
      quotaManager.setQuota(pluginId, { maxEventsPerSecond: 5 });

      // Use up quota
      for (let i = 0; i < 5; i++) {
        quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1);
      }

      expect(quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)).toBe(
        false
      );

      // Plugin should be suspended
      expect(() => {
        quotaManager.suspendPlugin(pluginId);
      }).not.toThrow();
    });

    it('should clean up suspended plugin', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const quotaManager = new QuotaManager();

      const pluginId = 'test-plugin';
      quotaManager.setQuota(pluginId, { maxEventsPerSecond: 1 });

      // Use up quota
      quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1);
      expect(quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)).toBe(
        false
      );

      // Suspend and clean up
      quotaManager.suspendPlugin(pluginId);
      forwarder.destroySandbox(pluginId);

      // Should not throw
      expect(() => {
        forwarder.createSandbox(pluginId, ['emit:test']);
      }).not.toThrow();
    });
  });

  describe('plugin destruction', () => {
    it('should clean up all resources on destruction', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const permissionManager = new PermissionManager();
      const quotaManager = new QuotaManager();
      const resourceMonitor = new ResourceMonitor();

      const pluginId = 'test-plugin';
      const permissions = ['emit:test', 'receive:test'];

      // Setup
      permissionManager.grantCapabilities(pluginId, permissions);
      quotaManager.setQuota(pluginId, { maxEventsPerSecond: 100 });
      const pluginBus = forwarder.createSandbox(pluginId, permissions);

      // Use some resources
      pluginBus.emit(
        'test',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1);
      resourceMonitor.recordEventEmission(pluginId, 100);

      // Destroy
      forwarder.destroySandbox(pluginId);
      permissionManager.clearPermissions(pluginId);
      quotaManager.resetUsage(pluginId);

      // Verify cleanup
      expect(forwarder.getSandbox(pluginId)).toBeUndefined();
      expect(permissionManager.getPermissions(pluginId)).toEqual([]);
      expect(quotaManager.getUsage(pluginId).eventsEmitted).toBe(0);
    });

    it('should handle destruction of non-existent plugin gracefully', () => {
      const forwarder = new PluginEventForwarder(createEventBus());

      expect(() => {
        forwarder.destroySandbox('non-existent-plugin');
      }).not.toThrow();
    });

    it('should allow immediate recreation after destruction', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);

      const pluginId = 'test-plugin';
      const permissions = ['emit:test'];

      // Create handler first
      const baseHandler = vi.fn();
      baseBus.on('test', baseHandler);

      // Create, use, destroy
      const plugin1 = forwarder.createSandbox(pluginId, permissions);
      plugin1.emit(
        'test',
        { data: 'first' },
        { priority: EventPriority.IMMEDIATE }
      );
      forwarder.destroySandbox(pluginId);

      // Immediately recreate
      const plugin2 = forwarder.createSandbox(pluginId, permissions);
      expect(plugin2).not.toBe(plugin1); // Different instance

      plugin2.emit(
        'test',
        { data: 'second' },
        { priority: EventPriority.IMMEDIATE }
      );
      
      // Both emits should have been forwarded to base handler
      expect(baseHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('plugin upgrade', () => {
    it('should update permissions during upgrade', async () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const permissionManager = new PermissionManager();

      const pluginId = 'test-plugin';
      const initialPermissions = ['read:data'];
      permissionManager.grantCapabilities(pluginId, initialPermissions);

      // Upgrade permissions
      const upgradedPermissions = [
        ...initialPermissions,
        'emit:write:config',
        'emit:emit:test',
      ];
      permissionManager.grantCapabilities(pluginId, upgradedPermissions);

      // Create new sandbox with upgraded permissions
      forwarder.destroySandbox(pluginId);
      const upgradedPluginBus = forwarder.createSandbox(
        pluginId,
        upgradedPermissions
      );

      const baseHandler = vi.fn();
      baseBus.on('write:config', baseHandler);
      baseBus.on('emit:test', baseHandler);

      upgradedPluginBus.emit(
        'write:config',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      upgradedPluginBus.emit(
        'emit:test',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Wait for async execution (though IMMEDIATE should be sync)
      await flushMicrotasks();
      expect(baseHandler).toHaveBeenCalledTimes(2);
    });

    it('should maintain state across plugin upgrade', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);

      const pluginId = 'test-plugin';
      let eventCount = 0;

      // Create initial plugin
      const initialPlugin = forwarder.createSandbox(pluginId, ['emit:test']);
      const initialHandler = vi.fn(() => {
        eventCount++;
      });
      baseBus.on('test', initialHandler);

      initialPlugin.emit(
        'test',
        { data: 'initial' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(eventCount).toBe(1);

      // Destroy and recreate
      forwarder.destroySandbox(pluginId);
      const upgradedPlugin = forwarder.createSandbox(pluginId, ['emit:test']);
      const upgradedHandler = vi.fn(() => {
        eventCount++;
      });
      baseBus.on('test', upgradedHandler);

      upgradedPlugin.emit(
        'test',
        { data: 'upgraded' },
        { priority: EventPriority.IMMEDIATE }
      );
      // Both handlers should be called - initialHandler (1) + upgradedHandler (1) = 2 more calls
      // But since eventCount was already 1, it should now be 3
      expect(eventCount).toBe(3);
    });
  });

  describe('multi-plugin coordination', () => {
    it('should coordinate multiple plugins with different permissions', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const permissionManager = new PermissionManager();

      // Plugin A: read-only
      permissionManager.grantCapabilities('plugin-a', [
        'read:data',
        'receive:updates',
      ]);
      const pluginABus = forwarder.createSandbox('plugin-a', [
        'read:data',
        'receive:updates',
      ]);

      // Plugin B: read-write
      permissionManager.grantCapabilities('plugin-b', [
        'read:data',
        'emit:write:config',
        'receive:updates',
      ]);
      const pluginBBus = forwarder.createSandbox('plugin-b', [
        'read:data',
        'emit:write:config',
        'receive:updates',
      ]);

      // Plugin C: admin (all)
      permissionManager.grantCapabilities('plugin-c', ['*']);
      const pluginCBus = forwarder.createSandbox('plugin-c', ['*']);

      const baseHandler = vi.fn();
      baseBus.on('*', baseHandler);

      // Plugin A: can only receive
      pluginABus.emit(
        'read:data',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(baseHandler).not.toHaveBeenCalled(); // No emit permission

      // Plugin B: can emit write:config
      baseHandler.mockReset();
      pluginBBus.emit(
        'write:config',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(baseHandler).toHaveBeenCalledTimes(1);
      expect(baseHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'write:config' })
      );

      // Plugin C: can emit anything
      baseHandler.mockReset();
      pluginCBus.emit(
        'any-event',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(baseHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle plugin failures without affecting others', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);

      const pluginA = forwarder.createSandbox('plugin-a', ['*']);
      const pluginB = forwarder.createSandbox('plugin-b', ['*']);
      const pluginC = forwarder.createSandbox('plugin-c', ['*']);

      const handlerA = vi.fn(() => {
        throw new Error('Plugin A error');
      });
      const handlerB = vi.fn();
      const handlerC = vi.fn();

      pluginA.on('test', handlerA);
      pluginB.on('test', handlerB);
      pluginC.on('test', handlerC);

      // Emit to plugin A - should not affect B and C
      expect(() => {
        pluginA.emit(
          'test',
          { data: 'test' },
          { priority: EventPriority.IMMEDIATE }
        );
      }).not.toThrow();

      expect(handlerA).toHaveBeenCalled();
      expect(handlerB).not.toHaveBeenCalled();
      expect(handlerC).not.toHaveBeenCalled();
    });
  });

  describe('cross-plugin communication', () => {
    it('should enable cross-plugin communication through channels', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const bridge = new CrossPluginBridge(forwarder);

      const pluginA = forwarder.createSandbox('plugin-a', [
        'emit:channel:test:*',
      ]);
      const pluginB = forwarder.createSandbox('plugin-b', [
        'emit:channel:test:*',
      ]);

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      const handlerA = vi.fn();
      const handlerB = vi.fn();
      const channelHandler = vi.fn();

      pluginA.on('channel:test:message', handlerA);
      pluginB.on('channel:test:message', handlerB);
      channelBus.on('channel:test:message', channelHandler);

      // Plugin A emits to channel
      pluginA.emit(
        'channel:test:message',
        { data: 'from-a' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Channel should receive
      expect(channelHandler).toHaveBeenCalled();
    });
  });
});
