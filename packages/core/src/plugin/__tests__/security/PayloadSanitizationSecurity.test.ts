import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEventBus, EventPriority } from '../../../events';
import { PluginEventForwarder } from '../../../plugin/events';

describe('Payload Sanitization Security', () => {
  let baseBus: ReturnType<typeof createEventBus>;
  let forwarder: PluginEventForwarder;

  beforeEach(() => {
    baseBus = createEventBus();
    forwarder = new PluginEventForwarder(baseBus);
  });

  describe('malicious payload handling', () => {
    it('should handle circular references in payloads', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const circular: any = { data: 'test' };
      circular.self = circular;

      sandbox.emit('test', circular, { priority: EventPriority.IMMEDIATE });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle very large payloads', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const largePayload = {
        data: new Array(100000).fill('test data').join(' '),
        array: Array.from({ length: 1000 }, (_, i) => i),
        object: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: `value-${i}`,
        })),
      };

      sandbox.emit('test', largePayload, { priority: EventPriority.IMMEDIATE });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle prototype pollution attempts', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const polluted = JSON.parse('{"__proto__": {"polluted": true}}');

      sandbox.emit('test', polluted, { priority: EventPriority.IMMEDIATE });

      expect(handler).toHaveBeenCalled();
      expect({}.polluted).toBeUndefined();
    });
  });

  describe('function injection prevention', () => {
    it('should handle function properties in payloads', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const payloadWithFunction = {
        data: 'test',
        handler: () => {
          throw new Error('Injected function executed');
        },
      };

      sandbox.emit('test', payloadWithFunction, {
        priority: EventPriority.IMMEDIATE,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle async function payloads', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const payloadWithAsyncFunction = {
        data: 'test',
        asyncHandler: async () => {
          throw new Error('Injected async function executed');
        },
      };

      sandbox.emit('test', payloadWithAsyncFunction, {
        priority: EventPriority.IMMEDIATE,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle Symbol properties', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const symbolKey = Symbol('test');
      const payloadWithSymbol = {
        data: 'test',
        [symbolKey]: 'symbol value',
      };

      sandbox.emit('test', payloadWithSymbol, {
        priority: EventPriority.IMMEDIATE,
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('error injection prevention', () => {
    it('should handle Error objects in payloads', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const payloadWithError = {
        data: 'test',
        error: new Error('Injected error'),
      };

      sandbox.emit('test', payloadWithError, {
        priority: EventPriority.IMMEDIATE,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle exception objects', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const payloadWithException = {
        data: 'test',
        exception: {
          name: 'Exception',
          message: 'Injected exception',
          stack: 'at injected ()',
        },
      };

      sandbox.emit('test', payloadWithException, {
        priority: EventPriority.IMMEDIATE,
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should handle Promise objects in payloads', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const payloadWithPromise = {
        data: 'test',
        promise: Promise.resolve('test'),
      };

      sandbox.emit('test', payloadWithPromise, {
        priority: EventPriority.IMMEDIATE,
      });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('sandbox metadata protection', () => {
    it('should prevent payload from overriding metadata', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const payload = {
        data: 'test',
        metadata: {
          sandboxed: false,
          pluginId: 'fake-plugin',
        },
      };

      sandbox.emit('test', payload, { priority: EventPriority.IMMEDIATE });

      const eventArg = handler.mock.calls[0][0];
      expect(eventArg.metadata?.sandboxed).toBe(true);
      expect(eventArg.metadata?.pluginId).toBe('test-plugin');
    });

    it('should prevent payload from overriding source', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['*']);

      const handler = vi.fn();
      baseBus.on('test', handler);

      const payload = {
        data: 'test',
        source: 'fake-source',
      };

      sandbox.emit('test', payload, { priority: EventPriority.IMMEDIATE });

      const eventArg = handler.mock.calls[0][0];
      expect(eventArg.source).toBe('plugin:test-plugin');
    });
  });

  describe('handler injection prevention', () => {
    it('should not execute functions from payload', () => {
      const sandbox = forwarder.createSandbox('test-plugin', ['emit:*']);

      let functionExecuted = false;
      const handler = vi.fn((event) => {
        if (typeof event.payload.executor === 'function') {
          functionExecuted = true;
          event.payload.executor();
        }
      });
      baseBus.on('test', handler);

      const payload = {
        data: 'test',
        executor: () => {
          functionExecuted = true;
        },
      };

      sandbox.emit('test', payload, { priority: EventPriority.IMMEDIATE });

      expect(handler).toHaveBeenCalled();
      expect(functionExecuted).toBe(false);
    });
  });
});
