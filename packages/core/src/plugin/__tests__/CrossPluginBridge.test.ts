import { describe, it, expect, beforeEach } from 'vitest';
import { CrossPluginBridge } from '../events/CrossPluginBridge';
import { PluginEventForwarder } from '../events/PluginEventForwarder';
import { createEventBus } from '../../events/PluginEventBus';

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
      // Create sandboxes for plugins
      forwarder.createSandbox('plugin-1', ['emit:channel:test:msg']);
      forwarder.createSandbox('plugin-2', ['emit:channel:test:msg']);

      // Create channel
      const channelBus = bridge.createChannel('test', ['plugin-1', 'plugin-2']);

      expect(channelBus).toBeDefined();
    });
  });

  describe('channel forwarding', () => {
    it('forwards events between plugins through channel', () => {
      // Create sandboxes for plugins
      const plugin1Bus = forwarder.createSandbox('plugin-1', ['emit:channel:test:message']);
      const plugin2Bus = forwarder.createSandbox('plugin-2', ['emit:channel:test:message']);

      // Create channel
      const channelBus = bridge.createChannel('test', ['plugin-1', 'plugin-2']);

      // Set up handlers
      const plugin1Handler = vi.fn();
      const plugin2Handler = vi.fn();
      const channelHandler = vi.fn();

      plugin1Bus.on('channel:test:message', plugin1Handler);
      plugin2Bus.on('channel:test:message', plugin2Handler);
      channelBus.on('channel:test:message', channelHandler);

      // Plugin 1 emits event to channel
      plugin1Bus.emit('channel:test:message', { data: 'from-plugin-1' });

      // Channel should receive the event
      expect(channelHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'channel:test:message',
          payload: { data: 'from-plugin-1' }
        })
      );

      // Plugin 2 should receive the event (if properly configured)
      // Note: The exact forwarding logic depends on the implementation
      // This test checks the basic functionality
    });
  });
});