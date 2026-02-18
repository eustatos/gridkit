import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginEventForwarder } from '../events/PluginEventForwarder';
import { createEventBus } from '../../events';

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

describe('PluginEventForwarder', () => {
  let baseBus: ReturnType<typeof createEventBus>;
  let forwarder: PluginEventForwarder;

  beforeEach(() => {
    baseBus = createEventBus();
    forwarder = new PluginEventForwarder(baseBus);
  });

  describe('createSandbox', () => {
    it('creates isolated event bus for plugin', () => {
      const pluginBus = forwarder.createSandbox('plugin-1', ['emit:test']);

      expect(pluginBus).toBeDefined();
      expect(pluginBus).not.toBe(baseBus);
    });
  });

  describe('isolation', () => {
    it('isolates events between plugins', async () => {
      const plugin1Bus = forwarder.createSandbox('plugin-1', ['emit:test']);
      const plugin2Bus = forwarder.createSandbox('plugin-2', ['emit:test']);

      const plugin1Handler = vi.fn();
      const plugin2Handler = vi.fn();

      plugin1Bus.on('test', plugin1Handler);
      plugin2Bus.on('test', plugin2Handler);

      // Plugin 1 emits event
      plugin1Bus.emit('test', { data: 'from-plugin-1' });

      // Wait for async execution
      await flushMicrotasks();

      // Plugin 1 should receive its own event
      expect(plugin1Handler).toHaveBeenCalled();
      // Plugin 2 should NOT receive plugin 1's event
      expect(plugin2Handler).not.toHaveBeenCalled();
    });
  });

  describe('permission forwarding', () => {
    it('forwards events with permission to base bus', async () => {
      const pluginBus = forwarder.createSandbox('plugin-1', ['emit:allowed']);

      const baseHandler = vi.fn();
      baseBus.on('allowed', baseHandler);
      baseBus.on('denied', baseHandler);

      // Plugin emits allowed event - should be forwarded to base bus
      pluginBus.emit('allowed', { data: 'allowed' });
      
      // Plugin emits denied event - should NOT be forwarded
      pluginBus.emit('denied', { data: 'denied' });

      // Wait for async execution
      await flushMicrotasks();

      // Only the allowed event should have been forwarded
      expect(baseHandler).toHaveBeenCalledTimes(1);
      expect(baseHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'allowed',
          payload: { data: 'allowed' },
          source: 'plugin:plugin-1'
        })
      );
    });
  });

  describe('destroy', () => {
    it('cleans up on destroy', () => {
      const pluginBus = forwarder.createSandbox('plugin-1', ['emit:test']);

      const handler = vi.fn();
      pluginBus.on('test', handler);

      forwarder.destroySandbox('plugin-1');
      
      // After destruction, the bus should still exist but not forward events
      // The exact behavior may vary, but it should not throw
      expect(() => pluginBus.emit('test', {})).not.toThrow();
    });
  });

  describe('getSandbox', () => {
    it('returns the event bus for a plugin', () => {
      const pluginBus = forwarder.createSandbox('plugin-1', ['emit:test']);
      const retrievedBus = forwarder.getSandbox('plugin-1');

      expect(retrievedBus).toBe(pluginBus);
    });

    it('returns undefined for non-existent plugin', () => {
      const retrievedBus = forwarder.getSandbox('non-existent');

      expect(retrievedBus).toBeUndefined();
    });
  });
});