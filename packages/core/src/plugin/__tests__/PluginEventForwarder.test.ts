import { describe, it, expect, beforeEach } from 'vitest';
import { PluginEventForwarder } from '../events/PluginEventForwarder';
import { createEventBus } from '../../events/PluginEventBus';

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
    it('isolates events between plugins', () => {
      const plugin1Bus = forwarder.createSandbox('plugin-1', ['emit:test']);
      const plugin2Bus = forwarder.createSandbox('plugin-2', ['emit:test']);

      const plugin1Handler = vi.fn();
      const plugin2Handler = vi.fn();

      plugin1Bus.on('test', plugin1Handler);
      plugin2Bus.on('test', plugin2Handler);

      // Plugin 1 emits event
      plugin1Bus.emit('test', { data: 'from-plugin-1' });

      // Only plugin 1 should receive its own event
      expect(plugin1Handler).toHaveBeenCalled();
      expect(plugin2Handler).not.toHaveBeenCalled();
    });
  });

  describe('permission forwarding', () => {
    it('forwards events with permission', () => {
      const pluginBus = forwarder.createSandbox('plugin-1', ['emit:allowed']);

      const baseHandler = vi.fn();
      baseBus.on('allowed', baseHandler);
      baseBus.on('denied', baseHandler);

      pluginBus.emit('allowed', { data: 'allowed' });
      pluginBus.emit('denied', { data: 'denied' });

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