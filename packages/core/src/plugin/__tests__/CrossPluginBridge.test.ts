import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrossPluginBridge } from '../../core/CrossPluginBridge';
import { PluginEventForwarder } from '../../core/PluginEventForwarder';
import { createEventBus, EventPriority } from '../../core/PluginEventForwarder';

describe('CrossPluginBridge', () => {
  let baseBus: ReturnType<typeof createEventBus>;
  let forwarder: PluginEventForwarder;
  let bridge: CrossPluginBridge;

  beforeEach(() => {
    baseBus = createEventBus();
    forwarder = new PluginEventForwarder(baseBus);
    bridge = new CrossPluginBridge(forwarder);
  });

  describe('createChannel', () => {
    it('creates a channel for cross-plugin communication', () => {
      // Create sandboxes for plugins with wildcard permissions
      forwarder.createSandbox('plugin-1', ['emit:*']);
      forwarder.createSandbox('plugin-2', ['emit:*']);

      // Create channel
      const channelBus = bridge.createChannel('test', ['plugin-1', 'plugin-2']);

      expect(channelBus).toBeDefined();
    });
  });

  describe('channel forwarding', () => {
    it('creates channel and forwards events to channel bus', () => {
      // Create sandboxes for plugins with wildcard permissions
      const plugin1Bus = forwarder.createSandbox('plugin-1', ['emit:*']);
      const plugin2Bus = forwarder.createSandbox('plugin-2', ['emit:*']);

      // Create channel
      const channelBus = bridge.createChannel('test', ['plugin-1', 'plugin-2']);

      // Channel should be able to receive events
      const channelHandler = vi.fn();
      channelBus.on('channel:test:message', channelHandler);

      // Channel bus should forward events to plugins
      plugin1Bus.emit('channel:test:message', { data: 'from-plugin-1' }, { priority: EventPriority.IMMEDIATE });
      plugin2Bus.emit('channel:test:message', { data: 'from-plugin-2' }, { priority: EventPriority.IMMEDIATE });

      // Channel should have received events from both plugins
      expect(channelHandler).toHaveBeenCalledTimes(2);
    });

    it('creates channel and verifies channel bus exists', () => {
      const plugin1Bus = forwarder.createSandbox('plugin-1', ['emit:*']);
      const plugin2Bus = forwarder.createSandbox('plugin-2', ['emit:*']);

      const channelBus = bridge.createChannel('mychannel', ['plugin-1', 'plugin-2']);

      expect(channelBus).toBeDefined();
      expect(typeof channelBus.on).toBe('function');
      expect(typeof channelBus.emit).toBe('function');
    });
  });
});
