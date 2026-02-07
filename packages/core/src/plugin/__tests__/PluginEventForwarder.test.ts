import { describe, it, expect, beforeEach } from 'vitest';
import { PluginEventForwarder } from '../events/PluginEventForwarder';
import { createEventBus } from '../../events/PluginEventBus';

describe('PluginEventForwarder', () => {
  let sourceBus: ReturnType<typeof createEventBus>;
  let targetBus: ReturnType<typeof createEventBus>;
  let forwarder: PluginEventForwarder;

  beforeEach(() => {
    sourceBus = createEventBus();
    targetBus = createEventBus();
  });

  describe('constructor', () => {
    it('should create a new event forwarder', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus);
      expect(forwarder).toBeInstanceOf(PluginEventForwarder);
    });

    it('should forward all events by default', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus);
      
      const handler = vi.fn();
      targetBus.on('test-event', handler);
      
      sourceBus.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test' },
        })
      );
    });

    it('should only forward allowed events when specified', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus, ['allowed-event']);
      
      const allowedHandler = vi.fn();
      const deniedHandler = vi.fn();
      
      targetBus.on('allowed-event', allowedHandler);
      targetBus.on('denied-event', deniedHandler);
      
      sourceBus.emit('allowed-event', { data: 'allowed' });
      sourceBus.emit('denied-event', { data: 'denied' });
      
      expect(allowedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'allowed-event',
          payload: { data: 'allowed' },
        })
      );
      
      expect(deniedHandler).not.toHaveBeenCalled();
    });
  });

  describe('addTransformer', () => {
    it('should add an event transformer', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus);
      
      const transformHandler = vi.fn((event) => ({
        ...event,
        payload: { ...event.payload, transformed: true },
      }));
      
      forwarder.addTransformer('test-event', transformHandler);
      
      const handler = vi.fn();
      targetBus.on('test-event', handler);
      
      sourceBus.emit('test-event', { data: 'test' });
      
      expect(transformHandler).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test', transformed: true },
        })
      );
    });
  });

  describe('removeTransformer', () => {
    it('should remove an event transformer', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus);
      
      const transformHandler = vi.fn((event) => ({
        ...event,
        payload: { ...event.payload, transformed: true },
      }));
      
      forwarder.addTransformer('test-event', transformHandler);
      forwarder.removeTransformer('test-event');
      
      const handler = vi.fn();
      targetBus.on('test-event', handler);
      
      sourceBus.emit('test-event', { data: 'test' });
      
      expect(transformHandler).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test' }, // Not transformed
        })
      );
    });
  });

  describe('setAllowedEvents', () => {
    it('should update allowed events', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus, ['initial-event']);
      
      const initialHandler = vi.fn();
      const newHandler = vi.fn();
      
      targetBus.on('initial-event', initialHandler);
      targetBus.on('new-event', newHandler);
      
      // Update allowed events
      forwarder.setAllowedEvents(['new-event']);
      
      sourceBus.emit('initial-event', { data: 'initial' });
      sourceBus.emit('new-event', { data: 'new' });
      
      expect(initialHandler).not.toHaveBeenCalled();
      expect(newHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'new-event',
          payload: { data: 'new' },
        })
      );
    });

    it('should allow all events when set to null', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus, ['initial-event']);
      
      const handler = vi.fn();
      targetBus.on('any-event', handler);
      
      // Update to allow all events
      forwarder.setAllowedEvents(null);
      
      sourceBus.emit('any-event', { data: 'any' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'any-event',
          payload: { data: 'any' },
        })
      );
    });
  });

  describe('isEventAllowed', () => {
    it('should allow all events when no restrictions are set', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus);
      
      // This is a private method, but we can test the behavior
      const handler = vi.fn();
      targetBus.on('test-event', handler);
      
      sourceBus.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalled();
    });

    it('should only allow specified events', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus, ['allowed-event']);
      
      const allowedHandler = vi.fn();
      const deniedHandler = vi.fn();
      
      targetBus.on('allowed-event', allowedHandler);
      targetBus.on('denied-event', deniedHandler);
      
      sourceBus.emit('allowed-event', { data: 'allowed' });
      sourceBus.emit('denied-event', { data: 'denied' });
      
      expect(allowedHandler).toHaveBeenCalled();
      expect(deniedHandler).not.toHaveBeenCalled();
    });
  });

  describe('transformEvent', () => {
    it('should transform events with registered transformers', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus);
      
      const transformHandler = vi.fn((event) => ({
        ...event,
        payload: { ...event.payload, transformed: true },
      }));
      
      forwarder.addTransformer('test-event', transformHandler);
      
      const handler = vi.fn();
      targetBus.on('test-event', handler);
      
      sourceBus.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test', transformed: true },
        })
      );
    });

    it('should not transform events without transformers', () => {
      forwarder = new PluginEventForwarder(sourceBus, targetBus);
      
      const handler = vi.fn();
      targetBus.on('test-event', handler);
      
      sourceBus.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test-event',
          payload: { data: 'test' }, // Not transformed
        })
      );
    });
  });
});