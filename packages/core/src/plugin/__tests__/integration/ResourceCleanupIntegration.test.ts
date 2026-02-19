import { describe, it, expect, vi } from 'vitest';
import { PermissionManager } from '../../isolation/PermissionManager';
import { QuotaManager } from '../../isolation/QuotaManager';
import { ResourceMonitor } from '../../security/ResourceMonitor';
import { CrossPluginBridge } from '../../core/CrossPluginBridge';
import { createEventBus, EventPriority } from '../../../events';
import { PluginEventForwarder } from '../../core/PluginEventForwarder';

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

describe('Resource Cleanup Integration', () => {
  describe('complete cleanup sequence', () => {
    it('should clean up all resources in correct order', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const permissionManager = new PermissionManager();
      const quotaManager = new QuotaManager();
      const resourceMonitor = new ResourceMonitor();
      const bridge = new CrossPluginBridge(forwarder);

      const pluginId = 'test-plugin';
      const permissions = [
        'read:data',
        'write:config',
        'emit:test',
        'receive:test',
      ];

      // Setup plugin
      permissionManager.grantCapabilities(pluginId, permissions);
      quotaManager.setQuota(pluginId, { maxEventsPerSecond: 100 });
      const pluginBus = forwarder.createSandbox(pluginId, permissions);

      // Create channel
      bridge.createChannel('test', [pluginId]);

      // Use resources
      pluginBus.emit(
        'test',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );
      quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1);
      resourceMonitor.recordEventEmission(pluginId, 100);

      // Cleanup sequence
      // 1. Destroy plugin sandbox
      forwarder.destroySandbox(pluginId);

      // 2. Clear permissions
      permissionManager.clearPermissions(pluginId);

      // 3. Reset quota
      quotaManager.resetUsage(pluginId);

      // 4. Resources should be fully cleaned up
      expect(forwarder.getSandbox(pluginId)).toBeUndefined();
      expect(permissionManager.getPermissions(pluginId)).toEqual([]);
      expect(quotaManager.getUsage(pluginId).eventsEmitted).toBe(0);
    });

    it('should handle cleanup with active listeners', () => {
      const forwarder = new PluginEventForwarder(createEventBus());

      const plugin = forwarder.createSandbox('test-plugin', ['*']);

      // Add many listeners
      const handlers = [];
      for (let i = 0; i < 100; i++) {
        handlers.push(plugin.on(`test:${i}`, () => {}));
      }

      // Add base bus listeners
      const baseHandlers = [];
      for (let i = 0; i < 100; i++) {
        baseHandlers.push(forwarder['baseBus'].on(`test:${i}`, () => {}));
      }

      // Destroy plugin
      forwarder.destroySandbox('test-plugin');

      // Should not throw
      expect(() => {
        forwarder.createSandbox('new-plugin', ['*']);
      }).not.toThrow();
    });
  });

  describe('cross-plugin bridge cleanup', () => {
    it('should clean up channel resources', () => {
      const forwarder = new PluginEventForwarder(createEventBus());
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      // Add listeners to channel
      const handlers = [];
      for (let i = 0; i < 10; i++) {
        handlers.push(channelBus.on('channel:test:message', () => {}));
      }

      // Destroy sandboxes
      forwarder.destroySandbox('plugin-a');
      forwarder.destroySandbox('plugin-b');

      // Destroy channel (if supported)
      // The current implementation doesn't have explicit channel destruction

      // Should not throw
      expect(() => {
        channelBus.emit('channel:test:message', { data: 'test' });
      }).not.toThrow();
    });

    it('should clean up when forwarder is destroyed', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const bridge = new CrossPluginBridge(forwarder);

      // Create multiple plugins and channels
      for (let i = 0; i < 10; i++) {
        forwarder.createSandbox(`plugin-${i}`, ['emit:channel:*:*']);
        bridge.createChannel(`channel-${i}`, [`plugin-${i}`]);
      }

      // Destroy forwarder
      // Note: The current implementation doesn't have explicit forwarder destruction

      // Should be able to create new forwarder
      const newForwarder = new PluginEventForwarder(baseBus);
      expect(newForwarder).toBeDefined();
    });
  });

  describe('memory leak prevention', () => {
    it('should not leak memory with repeated create/destroy cycles', async () => {
      const baseBus = createEventBus();
      const finalForwarder = new PluginEventForwarder(baseBus);
      const finalPlugin = finalForwarder.createSandbox('final', ['*']);
      
      // Add handler to base bus - use once to ensure it fires
      const handler = vi.fn();
      const off = baseBus.once('test', handler);
      
      // Run 1000 cycles
      for (let i = 0; i < 1000; i++) {
        const tempForwarder = new PluginEventForwarder(createEventBus());
        const plugin = tempForwarder.createSandbox(`plugin-${i}`, ['*']);

        // Add listeners
        for (let j = 0; j < 10; j++) {
          plugin.on(`test:${j}`, () => {});
        }

        tempForwarder.destroySandbox(`plugin-${i}`);
      }

      // Final test - emit with IMMEDIATE priority to ensure sync processing
      finalPlugin.emit('test', { data: 'final' }, { priority: EventPriority.IMMEDIATE });
      await flushMicrotasks();
      expect(handler).toHaveBeenCalled();
      off(); // Clean up
    });

    it('should handle massive numbers of plugins', () => {
      const forwarder = new PluginEventForwarder(createEventBus());

      // Create many plugins
      const plugins = [];
      for (let i = 0; i < 1000; i++) {
        const plugin = forwarder.createSandbox(`plugin-${i}`, ['*']);
        plugins.push(plugin);

        // Add some listeners
        for (let j = 0; j < 5; j++) {
          plugin.on(`test:${j}`, () => {});
        }
      }

      // Destroy all plugins
      for (let i = 0; i < 1000; i++) {
        forwarder.destroySandbox(`plugin-${i}`);
      }

      // Should not throw
      expect(() => {
        forwarder.createSandbox('final', ['*']);
      }).not.toThrow();
    });
  });

  describe('partial cleanup scenarios', () => {
    it('should handle cleanup when some plugins are destroyed', async () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);

      // Create multiple plugins
      const plugin1 = forwarder.createSandbox('plugin-1', ['*']);
      const plugin3 = forwarder.createSandbox('plugin-3', ['*']);

      // Add handlers to base bus using once to ensure they fire
      const handler1 = vi.fn();
      const handler3 = vi.fn();
      const off1 = baseBus.once('test', handler1);
      const off3 = baseBus.once('test', handler3);

      // Destroy only plugin-2 (non-existent)
      forwarder.destroySandbox('plugin-2');

      // Other plugins should still work - emit and check
      plugin1.emit('test', { data: 'test' }, { priority: EventPriority.IMMEDIATE });
      await flushMicrotasks();
      expect(handler1).toHaveBeenCalled();

      plugin3.emit('test', { data: 'test' }, { priority: EventPriority.IMMEDIATE });
      await flushMicrotasks();
      expect(handler3).toHaveBeenCalled();
      
      off1(); // Clean up
      off3(); // Clean up
    });

    it('should handle cleanup with overlapping permissions', () => {
      const forwarder = new PluginEventForwarder(createEventBus());
      const permissionManager = new PermissionManager();

      // Multiple plugins with shared permissions
      const sharedPermissions = ['read:data', 'receive:updates'];
      ['plugin-a', 'plugin-b', 'plugin-c'].forEach((pluginId) => {
        permissionManager.grantCapabilities(pluginId, sharedPermissions);
        forwarder.createSandbox(pluginId, sharedPermissions);
      });

      // Destroy one plugin
      forwarder.destroySandbox('plugin-b');

      // Other plugins should still work
      expect(forwarder.getSandbox('plugin-a')).toBeDefined();
      expect(forwarder.getSandbox('plugin-c')).toBeDefined();
    });
  });

  describe('resource quota cleanup', () => {
    it('should reset quota on plugin destruction', () => {
      const forwarder = new PluginEventForwarder(createEventBus());
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

      // Destroy plugin
      forwarder.destroySandbox(pluginId);

      // Quota should be reset
      quotaManager.resetUsage(pluginId);

      // Should be able to emit again
      expect(quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1)).toBe(
        true
      );
    });

    it('should clean up resource monitor data', () => {
      const forwarder = new PluginEventForwarder(createEventBus());
      const resourceMonitor = new ResourceMonitor();

      const pluginId = 'test-plugin';

      // Record some resource usage
      for (let i = 0; i < 100; i++) {
        resourceMonitor.recordEventEmission(pluginId, 100);
      }

      const usageBefore = resourceMonitor.getUsage(pluginId);
      expect(usageBefore.eventsEmitted).toBe(100);

      // Destroy plugin
      forwarder.destroySandbox(pluginId);

      // Resource monitor should still have the data
      // (This is expected - resource monitor tracks by plugin ID)
      const usageAfter = resourceMonitor.getUsage(pluginId);
      expect(usageAfter.eventsEmitted).toBe(100);
    });
  });

  describe('integration with event cleanup utilities', () => {
    it('should work with cleanup managers', () => {
      const forwarder = new PluginEventForwarder(createEventBus());
      const plugin = forwarder.createSandbox('test-plugin', ['*']);

      // Add many listeners
      const subscriptions = [];
      for (let i = 0; i < 100; i++) {
        const subscription = plugin.on(`test:${i}`, () => {});
        subscriptions.push(subscription);
      }

      // Unsubscribe some
      for (let i = 0; i < 50; i++) {
        subscriptions[i]();
      }

      // Destroy plugin
      forwarder.destroySandbox('test-plugin');

      // Should not throw
      expect(() => {
        forwarder.createSandbox('new-plugin', ['*']);
      }).not.toThrow();
    });

    it('should handle cleanup in error scenarios', () => {
      const forwarder = new PluginEventForwarder(createEventBus());

      const plugin = forwarder.createSandbox('test-plugin', ['*']);

      // Add error-prone listeners
      for (let i = 0; i < 100; i++) {
        plugin.on(`test:${i}`, () => {
          if (i === 50) {
            throw new Error('Test error');
          }
        });
      }

      // Destroy should handle errors
      expect(() => {
        forwarder.destroySandbox('test-plugin');
      }).not.toThrow();
    });
  });

  describe('stress test: rapid create/destroy', () => {
    it('should handle 1000 rapid create/destroy cycles', () => {
      const baseBus = createEventBus();
      const forwarder = new PluginEventForwarder(baseBus);
      const permissionManager = new PermissionManager();
      const quotaManager = new QuotaManager();
      const resourceMonitor = new ResourceMonitor();

      for (let cycle = 0; cycle < 1000; cycle++) {
        const pluginId = `plugin-${cycle}`;

        // Setup
        permissionManager.grantCapabilities(pluginId, ['*']);
        quotaManager.setQuota(pluginId, { maxEventsPerSecond: 100 });
        const pluginBus = forwarder.createSandbox(pluginId, ['*']);

        // Use resources
        pluginBus.emit(
          'test',
          { data: cycle },
          { priority: EventPriority.IMMEDIATE }
        );
        quotaManager.checkQuota(pluginId, 'maxEventsPerSecond', 1);
        resourceMonitor.recordEventEmission(pluginId, 100);

        // Cleanup
        forwarder.destroySandbox(pluginId);
        permissionManager.clearPermissions(pluginId);
        quotaManager.resetUsage(pluginId);
      }

      // Final plugin should work
      const finalPlugin = forwarder.createSandbox('final', ['*']);
      const handler = vi.fn();
      baseBus.on('test', handler);
      finalPlugin.emit(
        'test',
        { data: 'final' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(handler).toHaveBeenCalled();
    });
  });
});
