import { describe, test, expect, vi } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - Integration Tests', () => {
  describe('Counter Pattern', () => {
    test('implements counter with all features', () => {
      const store = createStore({ count: 0, step: 1 });
      const listeners = {
        increment: vi.fn(),
        decrement: vi.fn(),
        reset: vi.fn(),
      };

      store.subscribe(listeners.increment);
      store.subscribe(listeners.decrement);
      store.subscribe(listeners.reset);

      // Increment
      store.batch(() => {
        store.setState((prev) => ({ count: prev.count + prev.step }));
        store.setState((prev) => ({ count: prev.count + prev.step }));
      });

      expect(store.getState().count).toBe(2);
      expect(listeners.increment).toHaveBeenCalledTimes(1);

      // Decrement
      store.setState((prev) => ({ count: prev.count - prev.step }));
      expect(store.getState().count).toBe(1);
      expect(listeners.decrement).toHaveBeenCalledTimes(1);

      // Reset
      store.reset();
      expect(store.getState().count).toBe(0);
      expect(listeners.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form State Management', () => {
    test('manages form state with validation', () => {
      interface FormState {
        values: { name: string; email: string; age: number };
        errors: { name?: string; email?: string; age?: string };
        touched: { [key: string]: boolean };
        isValid: boolean;
        isSubmitting: boolean;
      }

      const initialState: FormState = {
        values: { name: '', email: '', age: 0 },
        errors: {},
        touched: {},
        isValid: false,
        isSubmitting: false,
      };

      const store = createStore(initialState);
      const listener = vi.fn();

      store.subscribe(listener);

      // Update fields
      store.batch(() => {
        store.setState((prev) => ({
          ...prev,
          values: { ...prev.values, name: 'John' },
          touched: { ...prev.touched, name: true },
        }));

        store.setState((prev) => ({
          ...prev,
          values: { ...prev.values, email: 'john@example.com' },
          touched: { ...prev.touched, email: true },
        }));

        store.setState((prev) => ({
          ...prev,
          values: { ...prev.values, age: 30 },
          touched: { ...prev.touched, age: true },
        }));

        // Validate
        store.setState((prev) => {
          const errors: FormState['errors'] = {};
          if (!prev.values.name) errors.name = 'Required';
          if (!prev.values.email.includes('@')) errors.email = 'Invalid email';
          if (prev.values.age < 0) errors.age = 'Invalid age';

          return {
            ...prev,
            errors,
            isValid: Object.keys(errors).length === 0,
          };
        });
      });

      expect(store.getState().isValid).toBe(true);
      expect(store.getState().values).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 30,
      });
      expect(listener).toHaveBeenCalledTimes(1); // One batch with multiple updates
    });
  });

  describe('Async State Updates', () => {
    test('handles async state updates', async () => {
      const store = createStore({ data: null, loading: false });

      const listener = vi.fn();

      store.subscribe(listener);

      // Simulate async fetch
      store.setState({ loading: true });
      
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      store.setState({ data: { id: 1, name: 'Loaded' }, loading: false });

      expect(store.getState().loading).toBe(false);
      expect(store.getState().data).toEqual({ id: 1, name: 'Loaded' });
      expect(listener).toHaveBeenCalledTimes(2);
    });

    test('handles concurrent async updates', async () => {
      const store = createStore({ count: 0 });

      // Simulate concurrent updates
      const updates = [1, 2, 3].map((val) =>
        new Promise((resolve) => {
          setTimeout(() => {
            store.setState((prev) => ({ count: prev.count + val }));
            resolve(val);
          }, val * 10);
        })
      );

      await Promise.all(updates);

      expect(store.getState().count).toBe(6);
    });
  });

  describe('Undo/Redo Pattern', () => {
    test('implements basic undo functionality', () => {
      const store = createStore({ history: [0], currentIndex: 0 });

      const listener = vi.fn();
      store.subscribe(listener);

      const setNextState = (value: number) => {
        store.setState((prev) => {
          const newHistory = prev.history.slice(0, prev.currentIndex + 1);
          newHistory.push(value);
          return { history: newHistory, currentIndex: newHistory.length - 1 };
        });
      };

      const undo = () => {
        store.setState((prev) => {
          if (prev.currentIndex > 0) {
            return { ...prev, currentIndex: prev.currentIndex - 1 };
          }
          return prev;
        });
      };

      // Make some changes
      setNextState(1);
      setNextState(2);
      setNextState(3);

      expect(store.getState().history).toEqual([0, 1, 2, 3]);
      expect(store.getState().currentIndex).toBe(3);

      // Undo
      undo();
      expect(store.getState().currentIndex).toBe(2);

      undo();
      expect(store.getState().currentIndex).toBe(1);

      // Can redo by going forward again
      setNextState(4);
      expect(store.getState().history).toEqual([0, 1, 4]);
    });
  });

  describe('Cart/Shopping State', () => {
    test('manages shopping cart state', () => {
      interface CartItem {
        id: number;
        name: string;
        price: number;
        quantity: number;
      }

      interface CartState {
        items: CartItem[];
        total: number;
        itemCount: number;
      }

      const initialState: CartState = {
        items: [],
        total: 0,
        itemCount: 0,
      };

      const store = createStore(initialState);
      const listener = vi.fn();
      store.subscribe(listener);

      const addItem = (item: CartItem) => {
        store.setState((prev) => {
          const existing = prev.items.find((i) => i.id === item.id);
          let newItems;

          if (existing) {
            newItems = prev.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            );
          } else {
            newItems = [...prev.items, item];
          }

          const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

          return { ...prev, items: newItems, total, itemCount };
        });
      };

      const removeItem = (id: number) => {
        store.setState((prev) => {
          const newItems = prev.items.filter((i) => i.id !== id);
          const total = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          const itemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);

          return { ...prev, items: newItems, total, itemCount };
        });
      };

      // Add items
      addItem({ id: 1, name: 'Item 1', price: 10, quantity: 2 });
      addItem({ id: 2, name: 'Item 2', price: 20, quantity: 1 });
      addItem({ id: 1, name: 'Item 1', price: 10, quantity: 1 }); // Add more

      expect(store.getState().items).toHaveLength(2);
      expect(store.getState().total).toBe(50); // (10*3) + (20*1)
      expect(store.getState().itemCount).toBe(4);

      // Remove item
      removeItem(2);
      expect(store.getState().items).toHaveLength(1);
      expect(store.getState().total).toBe(30);
      expect(store.getState().itemCount).toBe(3);
    });
  });

  describe('Real-Time Data Sync', () => {
    test('synchronizes with simulated WebSocket', () => {
      const store = createStore({ messages: [] as string[], unreadCount: 0 });
      const listener = vi.fn();
      store.subscribe(listener);

      const simulateMessage = (message: string) => {
        store.batch(() => {
          store.setState((prev) => ({
            messages: [...prev.messages, message],
          }));
          store.setState((prev) => ({
            unreadCount: prev.unreadCount + 1,
          }));
        });
      };

      // Simulate real-time messages
      simulateMessage('Hello');
      simulateMessage('World');
      simulateMessage('How are you?');

      expect(store.getState().messages).toHaveLength(3);
      expect(store.getState().unreadCount).toBe(3);
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe('Complex Nested Updates', () => {
    test('handles deeply nested state with immer-like patterns', () => {
      interface NestedState {
        users: {
          [id: number]: {
            name: string;
            posts: {
              [postId: number]: {
                title: string;
                comments: { id: number; text: string }[];
              };
            };
          };
        };
      }

      const initialState: NestedState = {
        users: {
          1: {
            name: 'Alice',
            posts: {
              1: {
                title: 'Post 1',
                comments: [],
              },
            },
          },
        },
      };

      const store = createStore(initialState);

      // Add comment to nested post
      store.setState((prev) => ({
        ...prev,
        users: {
          ...prev.users,
          1: {
            ...prev.users[1],
            posts: {
              ...prev.users[1].posts,
              1: {
                ...prev.users[1].posts[1],
                comments: [
                  ...prev.users[1].posts[1].comments,
                  { id: 1, text: 'Great post!' },
                ],
              },
            },
          },
        },
      }));

      const state = store.getState();
      expect(state.users[1].posts[1].comments).toHaveLength(1);
      expect(state.users[1].posts[1].comments[0].text).toBe('Great post!');
    });
  });

  describe('Performance with Many Updates', () => {
    test('handles rapid updates efficiently', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Rapid-fire updates
      for (let i = 0; i < 1000; i++) {
        store.setState({ count: i });
      }

      expect(store.getState().count).toBe(999);
      expect(listener).toHaveBeenCalledTimes(999); // First setState({ count: 0 }) doesn't change state
    });
  });

  describe('State Versioning', () => {
    test('maintains state versions for rollback', () => {
      interface VersionedState {
        version: number;
        data: string;
      }

      const store = createStore<VersionedState>({ version: 1, data: 'initial' });
      const versions: VersionedState[] = [];

      store.subscribe((state) => {
        versions.push({ ...state });
      });

      store.setState((prev) => ({ version: prev.version + 1, data: 'version 2' }));
      store.setState((prev) => ({ version: prev.version + 1, data: 'version 3' }));

      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe(2);
      expect(versions[1].version).toBe(3);
      expect(store.getState().version).toBe(3);
    });
  });
});
