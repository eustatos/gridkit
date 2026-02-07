import { describe, it, expect, beforeEach } from 'vitest';
import { CrossPluginBridge } from '../events/CrossPluginBridge';
import { createEventBus } from '../../events/PluginEventBus';

describe('CrossPluginBridge', () => {
  let bridge: CrossPluginBridge;
  let pluginABus: ReturnType<typeof createEventBus>;
  let pluginBBus: ReturnType<typeof createEventBus>;
  let pluginCBus: ReturnType<typeof createEventBus>;

  beforeEach(() => {
    bridge = new CrossPluginBridge();
    pluginABus = createEventBus();
    pluginBBus = createEventBus();
    pluginCBus = createEventBus();
  });

  describe('registerPlugin', () => {
    it('should register a plugin with its event bus', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      
      // We can't directly check the internal state, but we can test the behavior
      // by approving a channel and sending events
      bridge.approveChannel('plugin-a', 'plugin-b', ['test-event']);
      
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }, { source: 'plugin:plugin-a' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test' },
          source: 'plugin:plugin-a',
          metadata: expect.objectContaining({
            crossPlugin: true,
            sourcePlugin: 'plugin-a',
            targetPlugin: 'plugin-b',
          }),
        })
      );
    });
  });

  describe('unregisterPlugin', () => {
    it('should unregister a plugin', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.unregisterPlugin('plugin-a');
      
      // Try to approve a channel - should not work
      bridge.approveChannel('plugin-a', 'plugin-b', ['test-event']);
      
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }, { source: 'plugin:plugin-a' });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('approveChannel', () => {
    it('should approve a communication channel between plugins', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['allowed-event']);
      
      const handler = vi.fn();
      pluginBBus.on('allowed-event', handler);
      
      pluginABus.emit('allowed-event', { data: 'allowed' }, { source: 'plugin:plugin-a' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'allowed-event',
          payload: { data: 'allowed' },
          source: 'plugin:plugin-a',
          metadata: expect.objectContaining({
            crossPlugin: true,
            sourcePlugin: 'plugin-a',
            targetPlugin: 'plugin-b',
          }),
        })
      );
    });

    it('should not forward events not allowed on the channel', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['allowed-event']);
      
      const handler = vi.fn();
      pluginBBus.on('denied-event', handler);
      
      pluginABus.emit('denied-event', { data: 'denied' }, { source: 'plugin:plugin-a' });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('revokeChannel', () => {
    it('should revoke a communication channel between plugins', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['test-event']);
      bridge.revokeChannel('plugin-a', 'plugin-b');
      
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }, { source: 'plugin:plugin-a' });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('isChannelApproved', () => {
    it('should return true for approved channels', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['test-event']);
      
      // This is a private method, but we can test the behavior
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }, { source: 'plugin:plugin-a' });
      
      expect(handler).toHaveBeenCalled();
    });

    it('should return false for non-approved channels', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      // Don't approve the channel
      
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }, { source: 'plugin:plugin-a' });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('setupChannelForwarding', () => {
    it('should set up event forwarding for approved channels', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['forwarded-event']);
      
      const handler = vi.fn();
      pluginBBus.on('forwarded-event', handler);
      
      pluginABus.emit('forwarded-event', { data: 'forwarded' }, { source: 'plugin:plugin-a' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'forwarded-event',
          payload: { data: 'forwarded' },
          source: 'plugin:plugin-a',
          metadata: expect.objectContaining({
            crossPlugin: true,
            sourcePlugin: 'plugin-a',
            targetPlugin: 'plugin-b',
          }),
        })
      );
    });
  });

  describe('extractPluginIdFromSource', () => {
    it('should extract plugin ID from plugin source format', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['test-event']);
      
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }, { source: 'plugin:plugin-a' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'plugin:plugin-a',
          metadata: expect.objectContaining({
            sourcePlugin: 'plugin-a',
          }),
        })
      );
    });

    it('should return null for non-plugin sources', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['test-event']);
      
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }, { source: 'external-source' });
      
      // Events with non-plugin sources should not be forwarded
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return null for missing sources', () => {
      bridge.registerPlugin('plugin-a', pluginABus);
      bridge.registerPlugin('plugin-b', pluginBBus);
      
      bridge.approveChannel('plugin-a', 'plugin-b', ['test-event']);
      
      const handler = vi.fn();
      pluginBBus.on('test-event', handler);
      
      pluginABus.emit('test-event', { data: 'test' }); // No source
      
      // Events without sources should not be forwarded
      expect(handler).not.toHaveBeenCalled();
    });
  });
});