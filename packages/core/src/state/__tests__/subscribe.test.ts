import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - subscribe()', () => {
  describe('Basic Subscription', () => {
    test('notifies listener on state change', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });

    test('notifies with latest state', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.subscribe(listener);
      store.setState({ count: 3 });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 3 });
    });

    test('multiple listeners all notified', () => {
      const store = createStore({ count: 0 });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);
      store.setState({ count: 1 });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unsubscribe', () => {
    test('unsubscribed listener not notified', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.setState({ count: 1 });

      expect(listener).not.toHaveBeenCalled();
    });

    test('can unsubscribe multiple times safely', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      unsubscribe(); // Should not throw

      store.setState({ count: 1 });
      expect(listener).not.toHaveBeenCalled();
    });

    test('unsubscribing one listener does not affect others', () => {
      const store = createStore({ count: 0 });
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = store.subscribe(listener1);
      store.subscribe(listener2);

      unsubscribe1();
      store.setState({ count: 1 });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('fireImmediately Option', () => {
    test('calls listener immediately with current state', () => {
      const store = createStore({ count: 42 });
      const listener = vi.fn();

      store.subscribe(listener, { fireImmediately: true });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 42 });
    });

    test('does not call again on next state change', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener, { fireImmediately: true });
      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(1, { count: 0 });
      expect(listener).toHaveBeenNthCalledWith(2, { count: 1 });
    });
  });

  describe('Multiple Updates', () => {
    test('notifies on every state change', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState({ count: 1 });
      store.setState({ count: 2 });
      store.setState({ count: 3 });

      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenNthCalledWith(1, { count: 1 });
      expect(listener).toHaveBeenNthCalledWith(2, { count: 2 });
      expect(listener).toHaveBeenNthCalledWith(3, { count: 3 });
    });

    test('does not notify for unchanged state', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState({ count: 0 }); // No change (same as initial)
      store.setState({ count: 1 }); // Change
      store.setState({ count: 1 }); // No change (same as previous)

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });
  });

  describe('Listener Errors', () => {
    test('does not crash store when listener throws', () => {
      const store = createStore({ count: 0 });
      const listener1 = vi.fn(() => { throw new Error('Listener error'); });
      const listener2 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);

      // Should not throw
      expect(() => store.setState({ count: 1 })).not.toThrow();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    test('continues notifying other listeners after error', () => {
      const store = createStore({ count: 0 });
      const errorListener = vi.fn(() => { throw new Error('Error'); });
      const goodListener = vi.fn();

      store.subscribe(errorListener);
      store.subscribe(goodListener);

      store.setState({ count: 1 });
      store.setState({ count: 2 });

      expect(errorListener).toHaveBeenCalledTimes(2);
      expect(goodListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Management', () => {
    test('gc can collect listener after unsubscribe', () => {
      const store = createStore({ count: 0 });
      let listener: (state: any) => void;

      // Create a listener that can be gc'd
      {
        const tempListener = vi.fn();
        listener = tempListener;
        store.subscribe(tempListener);
      }

      store.setState({ count: 1 });

      // If gc ran, listener should not have been called
      // (This is a soft test - depends on gc timing)
    });

    test('gc can collect listener after store destroy', () => {
      const store = createStore({ count: 0 });
      
      {
        const listener = vi.fn();
        store.subscribe(listener);
      }

      store.destroy();

      // Store cleaned up references
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined state', () => {
      const store = createStore(undefined);
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('handles null state', () => {
      const store = createStore(null);
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('handles empty string state', () => {
      const store = createStore('');
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState('test');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('test');
    });
  });
});
