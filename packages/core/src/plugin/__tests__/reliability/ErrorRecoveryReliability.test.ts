import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorBoundary } from '../../security/ErrorBoundary';
import { EventSandbox } from '../../isolation/EventSandbox';
import { createEventBus, EventPriority } from '../../../events';
import { PluginEventForwarder } from '../../core/PluginEventForwarder';

describe('Error Recovery Reliability', () => {
  describe('ErrorBoundary reliability', () => {
    let errorBoundary: ErrorBoundary;
    let onErrorCallback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      onErrorCallback = vi.fn();
      errorBoundary = new ErrorBoundary('test-plugin', onErrorCallback);
    });

    describe('synchronous error handling', () => {
      it('should catch and recover from synchronous errors', () => {
        const faultyFunction = () => {
          throw new Error('Synchronous error');
        };

        const wrapped = errorBoundary.wrap(faultyFunction);
        expect(() => wrapped()).not.toThrow();

        expect(onErrorCallback).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Synchronous error' }),
          'test-plugin'
        );
      });

      it('should allow recovery after synchronous errors', () => {
        let errorCount = 0;
        const faultyFunction = () => {
          errorCount++;
          if (errorCount <= 2) {
            throw new Error(`Error ${errorCount}`);
          }
          return 'success';
        };

        const wrapped = errorBoundary.wrap(faultyFunction);

        expect(wrapped()).toBe(undefined); // First call fails
        expect(wrapped()).toBe(undefined); // Second call fails
        expect(wrapped()).toBe('success'); // Third call succeeds
      });

      it('should handle nested synchronous errors', () => {
        const innerFunction = () => {
          throw new Error('Inner error');
        };

        const outerFunction = () => {
          try {
            innerFunction();
          } catch (innerError) {
            throw new Error('Outer error');
          }
        };

        const wrapped = errorBoundary.wrap(outerFunction);
        expect(() => wrapped()).not.toThrow();

        expect(onErrorCallback).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Outer error' }),
          'test-plugin'
        );
      });
    });

    describe('asynchronous error handling', () => {
      it('should catch and recover from asynchronous errors', async () => {
        const faultyAsyncFunction = async () => {
          throw new Error('Asynchronous error');
        };

        const wrapped = errorBoundary.wrap(faultyAsyncFunction);
        const promise = wrapped();

        await expect(promise).rejects.toThrow('Asynchronous error');
        expect(onErrorCallback).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Asynchronous error' }),
          'test-plugin'
        );
      });

      it('should allow recovery after asynchronous errors', async () => {
        let errorCount = 0;
        const faultyAsyncFunction = async () => {
          errorCount++;
          if (errorCount <= 2) {
            throw new Error(`Async error ${errorCount}`);
          }
          return 'success';
        };

        const wrapped = errorBoundary.wrap(faultyAsyncFunction);

        await expect(wrapped()).rejects.toThrow();
        await expect(wrapped()).rejects.toThrow();
        await expect(wrapped()).resolves.toBe('success');
      });

      it('should handle async functions that return promises', async () => {
        const asyncFunction = async () => {
          return Promise.resolve('success');
        };

        const wrapped = errorBoundary.wrap(asyncFunction);
        const result = await wrapped();

        expect(result).toBe('success');
        expect(onErrorCallback).not.toHaveBeenCalled();
      });
    });

    describe('error callback reliability', () => {
      it('should call error callback for synchronous errors', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const onError = vi.fn();
        const boundary = new ErrorBoundary('test-plugin', onError);

        const faultyFunction = () => {
          throw new Error('Test error');
        };

        boundary.wrap(faultyFunction)();
        expect(onError).toHaveBeenCalled();

        errorSpy.mockRestore();
      });

      it('should call error callback for asynchronous errors', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const onError = vi.fn();
        const boundary = new ErrorBoundary('test-plugin', onError);

        const faultyFunction = async () => {
          throw new Error('Async test error');
        };

        await expect(boundary.wrap(faultyFunction)()).rejects.toThrow();
        expect(onError).toHaveBeenCalled();

        errorSpy.mockRestore();
      });

      it('should handle errors in error callback', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const faultyCallback = () => {
          throw new Error('Callback error');
        };

        const boundary = new ErrorBoundary('test-plugin', faultyCallback);
        const faultyFunction = () => {
          throw new Error('Test error');
        };

        boundary.wrap(faultyFunction)();
        expect(errorSpy).toHaveBeenCalledWith('[Plugin test-plugin] Error in error callback:', expect.any(Error));

        errorSpy.mockRestore();
      });
    });

    describe('context preservation', () => {
      it('should preserve error context', () => {
        const onError = vi.fn();
        const boundary = new ErrorBoundary('test-plugin', onError);

        const faultyFunction = () => {
          throw new Error('Test error');
        };

        boundary.wrap(faultyFunction, 'test-context')();
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Test error' }),
          'test-plugin'
        );
      });

      it('should handle complex error stacks', () => {
        const onError = vi.fn();
        const boundary = new ErrorBoundary('test-plugin', onError);

        const deepFunction1 = () => deepFunction2();
        const deepFunction2 = () => deepFunction3();
        const deepFunction3 = () => {
          throw new Error('Deep error');
        };

        const wrapped = boundary.wrap(deepFunction1);
        expect(() => wrapped()).not.toThrow();

        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Deep error' }),
          'test-plugin'
        );
      });
    });
  });

  describe('EventSandbox error handling', () => {
    let baseBus: ReturnType<typeof createEventBus>;
    let sandbox: EventSandbox;

    beforeEach(() => {
      baseBus = createEventBus();
      sandbox = new EventSandbox('test-plugin', baseBus, ['*']);
    });

    it('should handle errors in local bus handlers', () => {
      const handler = vi.fn(() => {
        throw new Error('Handler error');
      });

      const localBus = sandbox.getBus();
      localBus.on('test', handler);

      // Use IMMEDIATE priority to ensure sync processing
      expect(() => localBus.emit('test', { data: 'test' }, { priority: EventPriority.IMMEDIATE })).not.toThrow();
      expect(handler).toHaveBeenCalled();
    });

    it('should handle errors in base bus handlers', () => {
      const handler = vi.fn(() => {
        throw new Error('Base handler error');
      });

      baseBus.on('test', handler);

      const localBus = sandbox.getBus();
      // Use IMMEDIATE priority to ensure sync processing
      expect(() => localBus.emit('test', { data: 'test' }, { priority: EventPriority.IMMEDIATE })).not.toThrow();
      expect(handler).toHaveBeenCalled();
    });

    it('should isolate errors between plugins', () => {
      const pluginA = new EventSandbox('plugin-a', baseBus, ['*']);
      const pluginB = new EventSandbox('plugin-b', baseBus, ['*']);

      const handlerA = vi.fn(() => {
        throw new Error('Plugin A error');
      });
      const handlerB = vi.fn();

      pluginA.getBus().on('test', handlerA);
      pluginB.getBus().on('test', handlerB);

      // Plugin A emits - should not affect plugin B
      expect(() => pluginA.getBus().emit('test', { data: 'test' }, { priority: EventPriority.IMMEDIATE })).not.toThrow();
      expect(handlerA).toHaveBeenCalled();
      expect(handlerB).not.toHaveBeenCalled();
    });
  });

  describe('plugin lifecycle reliability', () => {
    it('should handle plugin destruction gracefully', () => {
      const forwarder = new PluginEventForwarder(createEventBus());
      const plugin = forwarder.createSandbox('test-plugin', ['*']);

      const handler = vi.fn(() => {
        throw new Error('Handler error');
      });

      plugin.on('test', handler);

      // Destroy should clean up even with error-prone handlers
      expect(() => forwarder.destroySandbox('test-plugin')).not.toThrow();
    });

    it('should handle rapid plugin creation and destruction', () => {
      const forwarder = new PluginEventForwarder(createEventBus());

      // Create and destroy many plugins rapidly
      for (let i = 0; i < 100; i++) {
        const plugin = forwarder.createSandbox(`plugin-${i}`, ['*']);
        forwarder.destroySandbox(`plugin-${i}`);
      }

      // Should not throw
      expect(() => {
        forwarder.createSandbox('final-plugin', ['*']);
      }).not.toThrow();
    });
  });

  describe('resource cleanup reliability', () => {
    it('should clean up all event listeners on error', () => {
      const forwarder = new PluginEventForwarder(createEventBus());
      const plugin = forwarder.createSandbox('test-plugin', ['*']);

      const handlers = [];
      for (let i = 0; i < 10; i++) {
        handlers.push(plugin.on('test', () => {
          throw new Error('Error');
        }));
      }

      // Should clean up on destroy
      forwarder.destroySandbox('test-plugin');

      // Should be able to create new plugin without issues
      const newPlugin = forwarder.createSandbox('new-plugin', ['*']);
      expect(() => newPlugin.emit('test', { data: 'test' })).not.toThrow();
    });

    it('should not leak memory with repeated errors', () => {
      const forwarder = new PluginEventForwarder(createEventBus());

      for (let i = 0; i < 100; i++) {
        const plugin = forwarder.createSandbox(`plugin-${i}`, ['*']);
        plugin.on('test', () => {
          throw new Error('Error');
        });
        forwarder.destroySandbox(`plugin-${i}`);
      }

      // Final plugin should work normally
      const finalPlugin = forwarder.createSandbox('final-plugin', ['*']);
      const handler = vi.fn();
      finalPlugin.on('test', handler);

      // Use IMMEDIATE priority to ensure sync processing
      finalPlugin.emit('test', { data: 'test' }, { priority: EventPriority.IMMEDIATE });
      expect(handler).toHaveBeenCalled();
    });
  });
});
