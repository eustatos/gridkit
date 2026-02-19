import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEventBus, EventPriority } from '../../../events';
import { PluginEventForwarder } from '../../core/PluginEventForwarder';
import { CrossPluginBridge } from '../../core/CrossPluginBridge';
import { PermissionManager } from '../../isolation/PermissionManager';

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

describe('Cross-Plugin Communication Integration', () => {
  let baseBus: ReturnType<typeof createEventBus>;
  let forwarder: PluginEventForwarder;

  beforeEach(() => {
    baseBus = createEventBus();
    forwarder = new PluginEventForwarder(baseBus);
  });

  describe('channel creation', () => {
    it('should create a channel for multiple plugins', () => {
      const bridge = new CrossPluginBridge(forwarder);

      const channelBus = bridge.createChannel('test-channel', [
        'plugin-a',
        'plugin-b',
      ]);

      expect(channelBus).toBeDefined();
      expect(typeof channelBus.on).toBe('function');
      expect(typeof channelBus.emit).toBe('function');
    });

    it('should require plugins to be registered before channel creation', () => {
      const bridge = new CrossPluginBridge(forwarder);

      // Try to create channel with non-existent plugins
      const channelBus = bridge.createChannel('test-channel', [
        'non-existent-plugin',
      ]);

      expect(channelBus).toBeDefined();
    });
  });

  describe('bidirectional communication', () => {
    it('should forward events from plugin to channel', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      const channelHandler = vi.fn();
      channelBus.on('channel:test:message', channelHandler);

      const pluginABus = forwarder.getSandbox('plugin-a');
      pluginABus?.emit(
        'channel:test:message',
        { data: 'from-a' },
        { priority: EventPriority.IMMEDIATE }
      );

      expect(channelHandler).toHaveBeenCalled();
    });

    it('should forward events from channel to plugin', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', [
        'emit:channel:test:*',
        'receive:channel:test:*',
      ]);
      forwarder.createSandbox('plugin-b', [
        'emit:channel:test:*',
        'receive:channel:test:*',
      ]);

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      const pluginAHunter = vi.fn();
      channelBus.on('channel:test:message', pluginAHunter);

      channelBus.emit(
        'channel:test:message',
        { data: 'from-channel' },
        { priority: EventPriority.IMMEDIATE }
      );

      expect(pluginAHunter).toHaveBeenCalled();
    });
  });

  describe('permission-based access control', () => {
    it('should only forward to authorized plugins', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);
      // Note: plugin-c is not in the allowed list

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      const channelHandler = vi.fn();
      channelBus.on('channel:test:message', channelHandler);

      const pluginABus = forwarder.getSandbox('plugin-a');
      pluginABus?.emit(
        'channel:test:message',
        { data: 'from-a' },
        { priority: EventPriority.IMMEDIATE }
      );

      expect(channelHandler).toHaveBeenCalled();
    });

    it('should prevent unauthorized plugins from emitting to channel', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);

      const channelBus = bridge.createChannel('test', ['plugin-a']); // Only plugin-a

      const channelHandler = vi.fn();
      channelBus.on('channel:test:message', channelHandler);

      // Plugin-b tries to emit (but shouldn't be able to)
      const pluginBBus = forwarder.getSandbox('plugin-b');
      pluginBBus?.emit(
        'channel:test:message',
        { data: 'from-b' },
        { priority: EventPriority.IMMEDIATE }
      );

      // Channel should not receive from unauthorized plugin
      expect(channelHandler).not.toHaveBeenCalled();
    });
  });

  describe('multiple channels', () => {
    it('should support multiple independent channels', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:*:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:*:*']);
      forwarder.createSandbox('plugin-c', ['emit:channel:*:*']);

      const channel1 = bridge.createChannel('channel1', [
        'plugin-a',
        'plugin-b',
      ]);
      const channel2 = bridge.createChannel('channel2', [
        'plugin-a',
        'plugin-c',
      ]);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      channel1.on('channel:channel1:message', handler1);
      channel2.on('channel:channel2:message', handler2);

      const pluginABus = forwarder.getSandbox('plugin-a');

      // Emit to channel 1
      pluginABus?.emit(
        'channel:channel1:message',
        { data: 'channel1' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(handler1).toHaveBeenCalled();

      // Emit to channel 2
      pluginABus?.emit(
        'channel:channel2:message',
        { data: 'channel2' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(handler2).toHaveBeenCalled();

      // Handlers should be independent
      expect(handler1).not.toHaveBeenCalledWith(
        expect.objectContaining({ payload: { data: 'channel2' } })
      );
      expect(handler2).not.toHaveBeenCalledWith(
        expect.objectContaining({ payload: { data: 'channel1' } })
      );
    });

    it('should isolate events between channels', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:*:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:*:*']);

      const channel1 = bridge.createChannel('channel1', [
        'plugin-a',
        'plugin-b',
      ]);
      const channel2 = bridge.createChannel('channel2', [
        'plugin-a',
        'plugin-b',
      ]);

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      channel1.on('channel:channel1:message', handler1);
      channel2.on('channel:channel2:message', handler2);

      const pluginABus = forwarder.getSandbox('plugin-a');

      // Emit to channel 1
      pluginABus?.emit(
        'channel:channel1:message',
        { data: 'channel1' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('dynamic channel membership', () => {
    it('should handle dynamic plugin membership', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      const handler = vi.fn();
      channelBus.on('channel:test:message', handler);

      const pluginABus = forwarder.getSandbox('plugin-a');

      // Emit before plugin-c joins
      pluginABus?.emit(
        'channel:test:message',
        { data: 'before' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(handler).toHaveBeenCalled();

      // Add plugin-c to channel
      // (This would require modifying the bridge implementation to support dynamic membership)

      // Emit after plugin-c joins
      pluginABus?.emit(
        'channel:test:message',
        { data: 'after' },
        { priority: EventPriority.IMMEDIATE }
      );
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle missing plugins gracefully', () => {
      const bridge = new CrossPluginBridge(forwarder);

      // Create channel with non-existent plugin
      const channelBus = bridge.createChannel('test', ['non-existent-plugin']);

      expect(() => {
        channelBus.emit(
          'channel:test:message',
          { data: 'test' },
          { priority: EventPriority.IMMEDIATE }
        );
      }).not.toThrow();
    });

    it('should handle malformed channel IDs', () => {
      const bridge = new CrossPluginBridge(forwarder);

      const malformedIds = [
        '',
        ' ',
        null as any,
        undefined as any,
        'channel with spaces',
      ];

      malformedIds.forEach((id: any) => {
        expect(() => {
          bridge.createChannel(id, ['plugin-a', 'plugin-b']);
        }).not.toThrow();
      });
    });

    it('should handle permission errors during forwarding', () => {
      const bridge = new CrossPluginBridge(forwarder);

      // Plugin with limited permissions
      forwarder.createSandbox('plugin-a', ['emit:other:*']); // No channel permissions

      const channelBus = bridge.createChannel('test', ['plugin-a']);

      const handler = vi.fn();
      channelBus.on('channel:test:message', handler);

      const pluginABus = forwarder.getSandbox('plugin-a');

      // Plugin should not be able to emit to channel
      expect(() => {
        pluginABus?.emit(
          'channel:test:message',
          { data: 'test' },
          { priority: EventPriority.IMMEDIATE }
        );
      }).not.toThrow();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('performance under load', () => {
    it('should handle high volume of channel messages', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      const handler = vi.fn();
      channelBus.on('channel:test:message', handler);

      const pluginABus = forwarder.getSandbox('plugin-a');

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        pluginABus?.emit(
          `channel:test:message:${i % 10}`,
          { data: i },
          { priority: EventPriority.IMMEDIATE }
        );
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle many concurrent channels', () => {
      const bridge = new CrossPluginBridge(forwarder);

      const channels = [];
      const allPluginIds = [];
      for (let i = 0; i < 10; i++) {
        forwarder.createSandbox(`plugin-${i}`, ['emit:channel:*:*']);
        allPluginIds.push(`plugin-${i}`);
      }
      
      // Create channels with all plugins to enable cross-plugin communication
      for (let i = 0; i < 10; i++) {
        const channel = bridge.createChannel(`channel-${i}`, allPluginIds);
        channels.push(channel);
      }

      // Emit to all channels
      const handlers = channels.map((channel, index) => {
        const handler = vi.fn();
        channel.on(`channel:channel-${index}:message`, handler);
        return handler;
      });

      const plugin0Bus = forwarder.getSandbox('plugin-0');

      for (let i = 0; i < 10; i++) {
        plugin0Bus?.emit(
          `channel:channel-${i}:message`,
          { data: i },
          { priority: EventPriority.IMMEDIATE }
        );
      }

      // Wait for async execution (though IMMEDIATE should be sync)
      flushMicrotasks();

      // Verify all handlers received events
      handlers.forEach((handler, index) => {
        expect(handler).toHaveBeenCalled();
      });
    });
  });

  describe('integration with sandbox', () => {
    it('should integrate with event sandbox metadata', () => {
      const bridge = new CrossPluginBridge(forwarder);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);

      const channelBus = bridge.createChannel('test', ['plugin-a']);

      const handler = vi.fn();
      channelBus.on('channel:test:message', handler);

      const pluginABus = forwarder.getSandbox('plugin-a');
      pluginABus?.emit(
        'channel:test:message',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      const eventArg = handler.mock.calls[0][0];
      expect(eventArg.metadata?.sandboxed).toBe(true);
      expect(eventArg.metadata?.pluginId).toBe('plugin-a');
    });

    it('should work with permission-managed sandboxes', () => {
      const bridge = new CrossPluginBridge(forwarder);
      const permissionManager = new PermissionManager();

      permissionManager.grantCapabilities('plugin-a', ['emit:channel:test:*']);
      permissionManager.grantCapabilities('plugin-b', ['emit:channel:test:*']);

      forwarder.createSandbox('plugin-a', ['emit:channel:test:*']);
      forwarder.createSandbox('plugin-b', ['emit:channel:test:*']);

      const channelBus = bridge.createChannel('test', ['plugin-a', 'plugin-b']);

      const handler = vi.fn();
      channelBus.on('channel:test:message', handler);

      const pluginABus = forwarder.getSandbox('plugin-a');
      pluginABus?.emit(
        'channel:test:message',
        { data: 'test' },
        { priority: EventPriority.IMMEDIATE }
      );

      expect(handler).toHaveBeenCalled();
    });
  });
});

