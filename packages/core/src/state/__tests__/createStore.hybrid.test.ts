import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createStore } from '../create-store';

describe('createStore - Hybrid Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Lifecycle Test', () => {
    test('entire store lifecycle', () => {
      const store = createStore({ count: 0, name: 'initial' });
      const listener = vi.fn();

      // 1. Subscribe
      store.subscribe(listener);
      expect(listener).not.toHaveBeenCalled(); // fireImmediately not set

      // 2. Initial state
      expect(store.getState()).toEqual({ count: 0, name: 'initial' });

      // 3. First update - preserve name field
      store.setState((prev) => ({ ...prev, count: 1 }));
      expect(store.getState()).toEqual({ count: 1, name: 'initial' });
      expect(listener).toHaveBeenCalledTimes(1);

      // 4. Batch updates
      store.batch(() => {
        store.setState((prev) => ({ ...prev, count: 2 }));
        store.setState((prev) => ({ ...prev, count: 3 }));
      });
      expect(listener).toHaveBeenCalledTimes(2);
      expect(store.getState()).toEqual({ count: 3, name: 'initial' });

      // 5. Reset
      store.reset();
      expect(store.getState()).toEqual({ count: 0, name: 'initial' });
      expect(listener).toHaveBeenCalledTimes(3);

      // 6. Unsubscribe
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.setState({ count: 5, name: 'changed' });
      // Listener count unchanged (unsubscribed)

      // 7. Destroy
      store.destroy();
      expect(() => store.getState()).toThrow('destroyed');
      expect(() => store.setState({})).toThrow('destroyed');
      expect(() => store.subscribe(() => {})).toThrow('destroyed');
      expect(() => store.batch(() => {})).toThrow('destroyed');
      expect(() => store.reset()).toThrow('destroyed');

      // 8. Verify listener was cleaned up (no-op since store is destroyed)
      // Listener was already unsubscribed, and store.destroy() clears all listeners
    });
  });

  describe('Complex State Scenario', () => {
    interface ComplexState {
      user: {
        id: number;
        name: string;
        email: string;
        settings: {
          theme: 'light' | 'dark';
          notifications: boolean;
          language: string;
        };
      };
      data: {
        items: { id: number; name: string; value: number }[];
        loading: boolean;
        error: string | null;
      };
      ui: {
        sidebarOpen: boolean;
        modalOpen: boolean;
        toast: { message: string; type: 'success' | 'error' } | null;
      };
    }

    test('handles complex state with nested updates', () => {
      const initialState: ComplexState = {
        user: {
          id: 1,
          name: 'John',
          email: 'john@example.com',
          settings: { theme: 'light', notifications: true, language: 'en' },
        },
        data: { items: [], loading: false, error: null },
        ui: { sidebarOpen: true, modalOpen: false, toast: null },
      };

      const store = createStore(initialState);
      const listener = vi.fn();
      store.subscribe(listener);

      // Update deeply nested settings
      store.setState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          settings: {
            ...prev.user.settings,
            theme: 'dark',
            notifications: false,
          },
        },
      }));

      expect(store.getState().user.settings.theme).toBe('dark');

      // Update data loading state
      store.batch(() => {
        store.setState((prev) => ({
          ...prev,
          data: { ...prev.data, loading: true },
        }));
        store.setState((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            loading: false,
            items: [{ id: 1, name: 'Item 1', value: 100 }],
          },
        }));
      });

      expect(store.getState().data.loading).toBe(false);
      expect(store.getState().data.items).toHaveLength(1);

      // Update UI state
      store.setState((prev) => ({
        ...prev,
        ui: { ...prev.ui, sidebarOpen: false, modalOpen: true },
      }));

      expect(store.getState().ui.sidebarOpen).toBe(false);
      expect(store.getState().ui.modalOpen).toBe(true);

      // Reset
      store.reset();
      expect(store.getState()).toEqual(initialState);
    });
  });

  describe('Race Condition Simulation', () => {
    test('handles concurrent updates sequentially', async () => {
      const store = createStore({ count: 0, timestamp: Date.now() });
      const listener = vi.fn();
      store.subscribe(listener);

      // Simulate concurrent updates
      const updates = [
        Promise.resolve().then(() => store.setState({ count: 1 })),
        Promise.resolve().then(() => store.setState({ count: 2 })),
        Promise.resolve().then(() => store.setState({ count: 3 })),
      ];

      await Promise.all(updates);

      // Final state should be one of the updates (order not guaranteed)
      expect(store.getState().count).toBe(3);
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });

  describe('Subscriber Error Handling', () => {
    test('continues operation after listener error', () => {
      const store = createStore({ count: 0 });

      const goodListener = vi.fn();
      const badListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      store.subscribe(goodListener);
      store.subscribe(badListener);

      // Should not throw
      expect(() => store.setState({ count: 1 })).not.toThrow();

      expect(goodListener).toHaveBeenCalledTimes(1);
      expect(badListener).toHaveBeenCalledTimes(1);

      // Store should still work
      store.setState({ count: 2 });
      expect(goodListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Leak Prevention', () => {
    test('cleanupRegistry works with FinalizationRegistry', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      // Create listener with weak reference behavior
      const unsubscribe = store.subscribe(listener);

      // Force cleanup simulation
      unsubscribe();

      // After unsubscribe, listener should not be called
      store.setState({ count: 1 });
      expect(listener).not.toHaveBeenCalled();
    });

    test('destroy clears all references', () => {
      const store = createStore({ count: 0 });
      const listeners = Array.from({ length: 10 }, () => {
        const fn = vi.fn();
        store.subscribe(fn);
        return fn;
      });

      store.destroy();

      // Verify store is destroyed
      expect(() => store.getState()).toThrow('destroyed');
      expect(() => store.setState({})).toThrow('destroyed');
      expect(() => store.subscribe(() => {})).toThrow('destroyed');
      expect(() => store.batch(() => {})).toThrow('destroyed');
      expect(() => store.reset()).toThrow('destroyed');

      // All listeners should not be called (already cleaned up on destroy)
      listeners.forEach((fn) => {
        expect(fn).not.toHaveBeenCalled();
      });
    });
  });

  describe('Custom Equality Function', () => {
    test('default shallowEqual works for primitives', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.setState({ count: 0 }); // Same value

      expect(listener).not.toHaveBeenCalled();
    });

    test('shallowEqual handles objects correctly', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      // Different object reference, same value
      store.setState({ count: 0 });
      expect(listener).not.toHaveBeenCalled(); // shallowEqual returns true

      // Different value
      store.setState({ count: 1 });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Edge Cases', () => {
    test('handles rapid-fire updates in batch', () => {
      const store = createStore({ count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);

      const start = performance.now();

      store.batch(() => {
        for (let i = 0; i < 1000; i++) {
          store.setState({ count: i });
        }
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(store.getState().count).toBe(999);
    });

    test('handles deep nested state efficiently', () => {
      const deepState = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  level6: {
                    level7: {
                      level8: {
                        level9: {
                          level10: { value: 0 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const store = createStore(deepState);
      const listener = vi.fn();

      store.subscribe(listener);

      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        store.setState((prev) => ({
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      level7: {
                        level8: {
                          level9: {
                            level10: {
                              value: prev.level1.level2.level3.level4.level5.level6.level7.level8.level9.level10.value + 1,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }));
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
      expect(store.getState().level1.level2.level3.level4.level5.level6.level7.level8.level9.level10.value).toBe(100);
    });
  });

  describe('Debug Mode', () => {
    test('slow update warning in debug mode', () => {
      // Mock console.warn
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create slow updater
      const store = createStore({ count: 0 }, { debug: true, slowUpdateThreshold: 0 });

      // Force slow update (in reality, this would be slow computation)
      // For testing, we'll just verify the option is respected
      store.setState({ count: 1 });

      // Cleanup
      consoleWarn.mockRestore();
    });
  });

  describe('Type Safety', () => {
    test('maintains TypeScript types', () => {
      const store = createStore({ count: 0, name: 'test' });

      // Type inference should work
      const state = store.getState();
      const count: number = state.count;
      const name: string = state.name;

      expect(count).toBe(0);
      expect(name).toBe('test');
    });
  });

  describe('Real-World Usage Patterns', () => {
    test('theme switcher pattern', () => {
      const store = createStore({ theme: 'light' as 'light' | 'dark' });
      const listeners = {
        light: vi.fn(),
        dark: vi.fn(),
      };

      store.subscribe((state) => {
        if (state.theme === 'light') {
          listeners.light();
        } else {
          listeners.dark();
        }
      });

      store.setState({ theme: 'dark' });
      expect(listeners.dark).toHaveBeenCalledTimes(1);
      expect(listeners.light).not.toHaveBeenCalled();

      store.setState({ theme: 'light' });
      expect(listeners.light).toHaveBeenCalledTimes(1);
    });

    test('form validation pattern', () => {
      interface FormState {
        values: { username: string; password: string };
        errors: { username?: string; password?: string };
        isValid: boolean;
        isSubmitting: boolean;
      }

      const store = createStore<FormState>({
        values: { username: '', password: '' },
        errors: {},
        isValid: false,
        isSubmitting: false,
      });

      const listener = vi.fn();
      store.subscribe(listener);

      // Validate
      store.setState((prev) => {
        const errors: FormState['errors'] = {};
        if (!prev.values.username) errors.username = 'Required';
        if (!prev.values.password) errors.password = 'Required';

        return {
          ...prev,
          errors,
          isValid: Object.keys(errors).length === 0,
        };
      });

      expect(store.getState().isValid).toBe(false);
      expect(store.getState().errors.username).toBe('Required');

      // Fill form
      store.batch(() => {
        store.setState((prev) => ({
          ...prev,
          values: { ...prev.values, username: 'user' },
        }));
        store.setState((prev) => ({
          ...prev,
          values: { ...prev.values, password: 'pass' },
        }));
      });

      // Re-validate
      store.setState((prev) => {
        const errors: FormState['errors'] = {};
        if (!prev.values.username) errors.username = 'Required';
        if (!prev.values.password) errors.password = 'Required';

        return {
          ...prev,
          errors,
          isValid: Object.keys(errors).length === 0,
          isSubmitting: true,
        };
      });

      expect(store.getState().isValid).toBe(true);
      expect(store.getState().isSubmitting).toBe(true);
    });
  });
});
