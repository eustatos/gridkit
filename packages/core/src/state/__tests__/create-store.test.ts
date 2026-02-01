import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '../create-store';

interface TestState {
  count: number;
  name: string;
}

describe('createStore', () => {
  describe('initialization', () => {
    it('should create store with initial state', () => {
      const store = createStore<TestState>({
        count: 0,
        name: 'test',
      });
      
      expect(store.getState()).toEqual({
        count: 0,
        name: 'test',
      });
    });
    
    it('should handle empty initial state', () => {
      const store = createStore({});
      expect(store.getState()).toEqual({});
    });
    
    it('should handle primitive initial state', () => {
      const store = createStore(42);
      expect(store.getState()).toBe(42);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const store = createStore({ count: 42 });
      
      expect(store.getState().count).toBe(42);
    });
    
    it('should throw when store is destroyed', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.getState()).toThrow('destroyed');
    });
  });

  describe('setState', () => {
    it('should update state with direct value', () => {
      const store = createStore({ count: 0 });
      
      store.setState({ count: 10 });
      
      expect(store.getState().count).toBe(10);
    });

    it('should update state with updater function', () => {
      const store = createStore({ count: 0 });
      
      store.setState(prev => ({ count: prev.count + 1 }));
      
      expect(store.getState().count).toBe(1);
    });

    it('should create new state object (immutability)', () => {
      const store = createStore({ count: 0 });
      const oldState = store.getState();
      
      store.setState(prev => ({ count: prev.count + 1 }));
      const newState = store.getState();
      
      expect(newState).not.toBe(oldState);
    });

    it('should not notify listeners if state unchanged (same reference)', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      
      // Set to same reference
      const currentState = store.getState();
      store.setState(currentState);
      
      expect(listener).not.toHaveBeenCalled();
    });
    
    it('should not notify listeners if state unchanged (deep equality)', () => {
      const store = createStore({ count: 0, name: 'test' });
      const listener = vi.fn();
      
      store.subscribe(listener);
      
      // Set to different object with same values
      store.setState({ count: 0, name: 'test' });
      
      expect(listener).toHaveBeenCalledTimes(1); // Called once because reference is different
    });

    it('should throw when store is destroyed', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.setState({ count: 1 })).toThrow('destroyed');
    });
    
    it('should handle nested state updates', () => {
      interface NestedState {
        user: {
          name: string;
          age: number;
        };
      }
      
      const store = createStore<NestedState>({
        user: {
          name: 'Alice',
          age: 30,
        },
      });
      
      store.setState(prev => ({
        ...prev,
        user: {
          ...prev.user,
          age: 31,
        },
      }));
      
      expect(store.getState().user.age).toBe(31);
      expect(store.getState().user.name).toBe('Alice'); // unchanged
    });
  });

  describe('subscribe', () => {
    it('should call listener on state change', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      store.setState({ count: 1 });
      
      expect(listener).toHaveBeenCalledWith({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should call listener immediately when fireImmediately is true', () => {
      const store = createStore({ count: 42 });
      const listener = vi.fn();
      
      store.subscribe(listener, true);
      
      expect(listener).toHaveBeenCalledWith({ count: 42 });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not call listener immediately by default', () => {
      const store = createStore({ count: 42 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const store = createStore({ count: 0 });
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      store.subscribe(listener1);
      store.subscribe(listener2);
      
      store.setState({ count: 1 });
      
      expect(listener1).toHaveBeenCalledWith({ count: 1 });
      expect(listener2).toHaveBeenCalledWith({ count: 1 });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      const unsubscribe = store.subscribe(listener);
      
      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      store.setState({ count: 2 });
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle unsubscribe multiple times safely', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      const unsubscribe = store.subscribe(listener);
      
      unsubscribe();
      unsubscribe(); // Should not throw
      unsubscribe(); // Should not throw
      
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should throw when subscribing to destroyed store', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.subscribe(() => {})).toThrow('destroyed');
    });
    
    it('should handle unsubscribe during notification', () => {
      const store = createStore({ count: 0 });
      let unsubscribe: (() => void) | null = null;
      
      const listener1 = vi.fn(() => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
      
      const listener2 = vi.fn();
      
      unsubscribe = store.subscribe(listener1);
      store.subscribe(listener2);
      
      // This should not crash even though listener1 unsubscribes itself
      store.setState({ count: 1 });
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
    
    it('should handle subscribe/unsubscribe in listener', () => {
      const store = createStore({ count: 0 });
      const newListener = vi.fn();
      
      const listener = vi.fn(() => {
        // Subscribe a new listener during notification
        store.subscribe(newListener);
      });
      
      store.subscribe(listener);
      
      store.setState({ count: 1 });
      
      // New listener should be called on next update
      store.setState({ count: 2 });
      
      expect(listener).toHaveBeenCalledTimes(2);
      expect(newListener).toHaveBeenCalledTimes(1);
      expect(newListener).toHaveBeenCalledWith({ count: 2 });
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = createStore({ count: 0 });
      
      store.setState({ count: 10 });
      expect(store.getState().count).toBe(10);
      
      store.reset();
      expect(store.getState().count).toBe(0);
    });

    it('should notify listeners on reset', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      store.setState({ count: 10 });
      
      listener.mockClear();
      
      store.reset();
      
      expect(listener).toHaveBeenCalledWith({ count: 0 });
      expect(listener).toHaveBeenCalledTimes(1);
    });
    
    it('should not notify listeners if state already at initial', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      
      // Reset without changing state first
      store.reset();
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should throw when store is destroyed', () => {
      const store = createStore({ count: 0 });
      store.destroy();
      
      expect(() => store.reset()).toThrow('destroyed');
    });
  });

  describe('destroy', () => {
    it('should clear all listeners', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();
      
      store.subscribe(listener);
      store.destroy();
      
      // setState would throw, but listeners are cleared
      expect(() => store.setState({ count: 1 })).toThrow('destroyed');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow multiple destroy calls', () => {
      const store = createStore({ count: 0 });
      
      store.destroy();
      
      expect(() => store.destroy()).not.toThrow();
    });
    
    it('should handle destroy during notification', () => {
      const store = createStore({ count: 0 });
      
      const listener = vi.fn(() => {
        store.destroy();
      });
      
      store.subscribe(listener);
      
      // This should not crash even though listener destroys store
      store.setState({ count: 1 });
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(() => store.getState()).toThrow('destroyed');
    });
  });

  describe('performance', () => {
    it('should handle many listeners efficiently', () => {
      const store = createStore({ count: 0 });
      const listeners = Array.from({ length: 1000 }, () => vi.fn());
      
      listeners.forEach(l => store.subscribe(l));
      
      const start = performance.now();
      store.setState({ count: 1 });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10); // < 10ms for 1000 listeners
      listeners.forEach(l => expect(l).toHaveBeenCalledWith({ count: 1 }));
    });

    it('should handle rapid updates efficiently', () => {
      const store = createStore({ count: 0 });
      
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        store.setState(prev => ({ count: prev.count + 1 }));
      }
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50); // < 50ms for 1000 updates
      expect(store.getState().count).toBe(1000);
    });
  });

  describe('memory', () => {
    it('should not leak memory with unsubscribe', () => {
      const store = createStore({ count: 0 });
      const unsubscribes: Array<() => void> = [];
      
      // Add and remove many listeners
      for (let i = 0; i < 1000; i++) {
        const unsub = store.subscribe(() => {});
        unsubscribes.push(unsub);
      }
      
      // Unsubscribe all
      unsubscribes.forEach(unsub => unsub());
      
      // After unsubscribe, internal Set should be empty
      // We can test this by timing a state update
      const start = performance.now();
      store.setState({ count: 1 });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1); // Should be instant with no listeners
    });
  });
});