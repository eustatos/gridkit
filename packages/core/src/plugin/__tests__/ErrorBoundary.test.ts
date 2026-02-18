import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorBoundary } from '../security/ErrorBoundary';

describe('ErrorBoundary', () => {
  let errorBoundary: ErrorBoundary;
  let onErrorCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onErrorCallback = vi.fn();
    errorBoundary = new ErrorBoundary('test-plugin', onErrorCallback);
  });

  describe('wrap', () => {
    it('should wrap a function and catch synchronous errors', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const faultyFunction = () => {
        throw new Error('Test error');
      };

      const wrappedFunction = errorBoundary.wrap(
        faultyFunction,
        'test-context'
      );

      expect(() => wrappedFunction()).not.toThrow();
      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        'test-plugin'
      );

      // Restore console.error
      errorSpy.mockRestore();
    });

    it('should wrap a function and handle successful execution', () => {
      const successfulFunction = () => 'success';

      const wrappedFunction = errorBoundary.wrap(successfulFunction);
      const result = wrappedFunction();

      expect(result).toBe('success');
      expect(onErrorCallback).not.toHaveBeenCalled();
    });

    it('should wrap a function and catch asynchronous errors', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const faultyAsyncFunction = async () => {
        throw new Error('Async test error');
      };

      const wrappedFunction = errorBoundary.wrap(
        faultyAsyncFunction,
        'async-test-context'
      );
      const promise = wrappedFunction();

      await expect(promise).rejects.toThrow('Async test error');
      expect(onErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Async test error' }),
        'test-plugin'
      );

      // Restore console.error
      errorSpy.mockRestore();
    });

    it('should wrap a function and handle successful asynchronous execution', async () => {
      const successfulAsyncFunction = async () => 'async-success';

      const wrappedFunction = errorBoundary.wrap(successfulAsyncFunction);
      const result = await wrappedFunction();

      expect(result).toBe('async-success');
      expect(onErrorCallback).not.toHaveBeenCalled();
    });
  });

  describe('handleError', () => {
    it('should log errors and call the error callback', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Test error');
      (errorBoundary as any).handleError(error, 'test-context');

      expect(errorSpy).toHaveBeenCalledWith(
        '[Plugin test-plugin] Error in test-context: Test error'
      );
      expect(onErrorCallback).toHaveBeenCalledWith(error, 'test-plugin');

      // Restore console.error
      errorSpy.mockRestore();
    });

    it('should handle errors in the error callback', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const faultyCallback = () => {
        throw new Error('Callback error');
      };

      const errorBoundaryWithFaultyCallback = new ErrorBoundary(
        'test-plugin',
        faultyCallback
      );
      const error = new Error('Test error');

      (errorBoundaryWithFaultyCallback as any).handleError(
        error,
        'test-context'
      );

      expect(errorSpy).toHaveBeenCalledWith(
        '[Plugin test-plugin] Error in test-context: Test error'
      );
      expect(errorSpy).toHaveBeenCalledWith(
        '[Plugin test-plugin] Error in error callback:',
        expect.any(Error)
      );

      // Restore console.error
      errorSpy.mockRestore();
    });
  });
});
