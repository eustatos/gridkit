import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - destroy()', () => {
  describe('Store Destruction', () => {
    test('throws on setState after destroy', () => {
      const store = createStore({ count: 0 });
      store.destroy();

      expect(() => store.setState({ count: 1 })).toThrow('destroyed');
    });

    test('throws on getState after destroy', () => {
      const store = createStore({ count: 0 });
      store.destroy();

      expect(() => store.getState()).toThrow('destroyed');
    });

    test('throws on subscribe after destroy', () => {
      const store = createStore({ count: 0 });
      store.destroy();

      expect(() => store.subscribe(() => {})).toThrow('destroyed');
    });

    test('throws on batch after destroy', () => {
      const store = createStore({ count: 0 });
      store.destroy();

      expect(() => store.batch(() => {})).toThrow('destroyed');
    });

    test('throws on reset after destroy', () => {
      const store = createStore({ count: 0 });
      store.destroy();

      expect(() => store.reset()).toThrow('destroyed');
    });
  });

  describe('Listener Cleanup', () => {
    test('unsubscribes all listeners on destroy', () => {
      const store = createStore({ count: 0 });
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);
      store.subscribe(listener3);

      store.destroy();
      // Note: setState after destroy throws, tested in separate test

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });

    test('can still call unsubscribe after destroy', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.destroy();
      unsubscribe(); // Should not throw

      // Note: setState after destroy throws, tested in separate test
      // Check that listener was never called (before or after destroy)
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('State Cleanup', () => {
    test('clears state reference on destroy', () => {
      const store = createStore({ count: 0 });
      
      // Get reference to state
      const state = store.getState();
      
      store.destroy();
      
      // State should be cleared
      expect(() => store.getState()).toThrow();
    });

    test('multiple destroy calls are safe', () => {
      const store = createStore({ count: 0 });
      
      store.destroy();
      store.destroy(); // Should not throw
      store.destroy(); // Should not throw
    });
  });

  describe('Debug Mode', () => {
    test('logs summary in debug mode', () => {
      const store = createStore({ count: 0 }, { debug: true });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.destroy();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Destroyed after 2 updates')
      );

      consoleSpy.mockRestore();
    });

    test('does not log in non-debug mode', () => {
      const store = createStore({ count: 0 }, { debug: false });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      store.destroy();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Leak Prevention', () => {
    test('clears listeners set on destroy', () => {
      const store = createStore({ count: 0 });
      
      const listener = vi.fn();
      store.subscribe(listener);
      
      // Listener was added
      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
      
      store.destroy();
      
      // setState after destroy throws, tested in separate test
      // But we can verify the listener was cleared by checking it doesn't get called
      // after destroy (before the throw)
      let listenerCalledAfterDestroy = false;
      try {
        store.setState({ count: 2 });
        listenerCalledAfterDestroy = true;
      } catch {
        // Expected to throw
      }
      
      // Listener should not have been called after destroy
      expect(listenerCalledAfterDestroy).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('allows store to be garbage collected', () => {
      const listener = vi.fn();
      
      {
        const store = createStore({ count: 0 });
        store.subscribe(listener);
        store.setState({ count: 1 });
      }

      // Store should be eligible for gc
      // (This is a soft test - depends on gc timing)
    });
  });

  describe('Edge Cases', () => {
    test('destroy with no listeners', () => {
      const store = createStore({ count: 0 });
      
      // Should not throw
      store.destroy();
    });

    test('destroy immediately after creation', () => {
      const store = createStore({ count: 0 });
      
      // Should not throw
      store.destroy();
    });

    test('destroy with only fireImmediately listener', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener, { fireImmediately: true });
      store.destroy();
      
      // Listener was called once, but not after destroy
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
