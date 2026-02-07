import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventSandbox } from '../isolation/EventSandbox';
import { createEventBus } from '../../events/PluginEventBus';

describe('EventSandbox', () => {
  let baseBus: ReturnType<typeof createEventBus>;
  let sandbox: EventSandbox;

  beforeEach(() => {
    baseBus = createEventBus();
    sandbox = new EventSandbox('test-plugin', baseBus, ['emit:test-event', 'receive:test-event']);
  });

  describe('constructor', () => {
    it('should create a new event sandbox', () => {
      expect(sandbox).toBeInstanceOf(EventSandbox);
    });

    it('should set up event forwarding from local to base bus', () => {
      const handler = vi.fn();
      baseBus.on('test-event', handler);

      const localBus = sandbox.getBus();
      localBus.emit('test-event', { data: 'test' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test' },
          source: 'plugin:test-plugin',
          metadata: expect.objectContaining({
            sandboxed: true,
            pluginId: 'test-plugin',
          }),
        })
      );
    });

    it('should set up event forwarding from base to local bus', () => {
      const handler = vi.fn();
      const localBus = sandbox.getBus();
      localBus.on('external-event', handler);

      baseBus.emit('external-event', { data: 'external' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'external-event',
          payload: { data: 'external' },
        })
      );
    });
  });

  describe('hasPermission', () => {
    it('should return true for granted permissions', () => {
      // This is a private method, so we can't test it directly
      // But we can test the behavior through event emission
      const handler = vi.fn();
      baseBus.on('allowed-event', handler);

      const localBus = sandbox.getBus();
      localBus.emit('allowed-event', { data: 'test' });

      expect(handler).toHaveBeenCalled();
    });

    it('should return false for denied permissions', () => {
      const handler = vi.fn();
      baseBus.on('denied-event', handler);

      const localBus = sandbox.getBus();
      localBus.emit('denied-event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getBus', () => {
    it('should return the local event bus', () => {
      const localBus = sandbox.getBus();
      expect(localBus).toBeDefined();
      expect(typeof localBus.on).toBe('function');
      expect(typeof localBus.emit).toBe('function');
    });
  });

  describe('destroy', () => {
    it('should clean up event listeners', () => {
      const handler = vi.fn();
      const localBus = sandbox.getBus();
      localBus.on('cleanup-test', handler);

      sandbox.destroy();

      // Emit event after destruction
      localBus.emit('cleanup-test', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('sandboxEvent', () => {
    it('should wrap events with sandbox metadata', () => {
      const handler = vi.fn();
      baseBus.on('metadata-test', handler);

      const localBus = sandbox.getBus();
      localBus.emit('metadata-test', { testData: 'value' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'metadata-test',
          payload: { testData: 'value' },
          source: 'plugin:test-plugin',
          metadata: expect.objectContaining({
            sandboxed: true,
            pluginId: 'test-plugin',
          }),
        })
      );
    });
  });
});