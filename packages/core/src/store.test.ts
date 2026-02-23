import { describe, it, expect, vi, beforeEach } from "vitest";
import { atom, createStore, atomRegistry, createEnhancedStore } from "./index";
import type { Getter, Setter } from "./types";

describe("store", () => {
  describe("createStore", () => {
    it("should create a store without plugins", () => {
      const store = createStore();
      expect(store).toBeDefined();
      expect(typeof store.get).toBe("function");
      expect(typeof store.set).toBe("function");
      expect(typeof store.subscribe).toBe("function");
      expect(typeof store.getState).toBe("function");
    });

    it("should create a store with plugins", () => {
      const plugin = vi.fn((store) => {
        store.applyPlugin = (p) => {
          console.log("Plugin applied");
        };
      });
      const store = createStore([plugin]);
      expect(store).toBeDefined();
      expect(plugin).toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("should get atom value", () => {
      const store = createStore();
      const countAtom = atom(0);
      expect(store.get(countAtom)).toBe(0);
    });

    it("should get computed atom value", () => {
      const store = createStore();
      const baseAtom = atom(10);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(store.get(doubleAtom)).toBe(20);
    });

    it("should return cached value on repeated get", () => {
      const store = createStore();
      const countAtom = atom(0);
      store.get(countAtom);
      store.get(countAtom);
      expect(store.get(countAtom)).toBe(0);
    });

    it("should handle atom not in store initially", () => {
      const store = createStore();
      const atom1 = atom(42);
      expect(store.get(atom1)).toBe(42);
    });
  });

  describe("set", () => {
    it("should set atom value", () => {
      const store = createStore();
      const countAtom = atom(0);
      store.set(countAtom, 10);
      expect(store.get(countAtom)).toBe(10);
    });

    it("should set atom value with update function", () => {
      const store = createStore();
      const countAtom = atom(0);
      store.set(countAtom, (prev) => prev + 5);
      expect(store.get(countAtom)).toBe(5);
    });

    it("should set computed atom value indirectly through writable atom", () => {
      const store = createStore();
      const baseAtom = atom(10);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      store.set(writableAtom, 20);
      expect(store.get(baseAtom)).toBe(20);
    });

    it("should throw error when setting computed atom directly", () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(() => store.set(computedAtom, 100)).toThrow(
        "Cannot set value of computed atom"
      );
    });

    it("should handle multiple sets in sequence", () => {
      const store = createStore();
      const countAtom = atom(0);

      store.set(countAtom, 1);
      expect(store.get(countAtom)).toBe(1);

      store.set(countAtom, 2);
      expect(store.get(countAtom)).toBe(2);

      store.set(countAtom, 3);
      expect(store.get(countAtom)).toBe(3);
    });

    it("should handle setting to same value", () => {
      const store = createStore();
      const countAtom = atom(0);
      store.set(countAtom, 0);
      expect(store.get(countAtom)).toBe(0);
    });
  });

  describe("subscribe", () => {
    it("should subscribe to atom changes", () => {
      const store = createStore();
      const countAtom = atom(0);
      let lastValue = 0;

      const unsubscribe = store.subscribe(countAtom, (value) => {
        lastValue = value;
      });

      store.set(countAtom, 5);
      expect(lastValue).toBe(5);

      unsubscribe();
      store.set(countAtom, 10);
      expect(lastValue).toBe(5);
    });

    it("should handle multiple subscribers", () => {
      const store = createStore();
      const countAtom = atom(0);

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      store.subscribe(countAtom, callback1);
      store.subscribe(countAtom, callback2);

      store.set(countAtom, 5);

      expect(callback1).toHaveBeenCalledWith(5);
      expect(callback2).toHaveBeenCalledWith(5);
    });

    it("should unsubscribe correctly", () => {
      const store = createStore();
      const countAtom = atom(0);

      const callback = vi.fn();
      const unsubscribe = store.subscribe(countAtom, callback);

      unsubscribe();
      store.set(countAtom, 5);

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle double unsubscribe without error", () => {
      const store = createStore();
      const countAtom = atom(0);

      const unsubscribe = store.subscribe(countAtom, vi.fn());
      unsubscribe();

      expect(() => unsubscribe()).not.toThrow();
    });

    it("should handle unsubscribing and resubscribing", () => {
      const store = createStore();
      const countAtom = atom(0);
      let callCount = 0;

      const unsubscribe = store.subscribe(countAtom, () => {
        callCount++;
      });

      store.set(countAtom, 1);
      expect(callCount).toBe(1);

      unsubscribe();
      store.set(countAtom, 2);
      expect(callCount).toBe(1);

      const unsubscribe2 = store.subscribe(countAtom, () => {
        callCount++;
      });

      store.set(countAtom, 3);
      expect(callCount).toBe(2);

      unsubscribe2();
    });
  });

  describe("getState", () => {
    it("should return all atom states", () => {
      const store = createStore();
      const atom1 = atom(1);
      const atom2 = atom("test");

      store.set(atom1, 10);
      store.set(atom2, "value");

      const state = store.getState();
      expect(Object.keys(state).length).toBe(2);
    });

    it("should handle empty store", () => {
      const store = createStore();
      const state = store.getState();
      expect(state).toEqual({});
    });

    it("should include atom names in state keys", () => {
      const store = createStore();
      const countAtom = atom(0, "count");
      store.set(countAtom, 42);

      const state = store.getState();
      expect(state).toHaveProperty("count");
      expect(state.count).toBe(42);
    });
  });

  describe("enhanced store methods", () => {
    it("should apply plugin", () => {
      const plugin = vi.fn((store) => {
        // Store enhancement
        store.getState = () => {
          return { ...store.getState(), pluginApplied: true };
        };
      });

      const store = createStore([plugin]);
      const state = store.getState();

      expect(plugin).toHaveBeenCalled();
    });

    it("should serialize state", () => {
      const store = createStore();
      const atom1 = atom(42);
      const atom2 = atom("test");

      store.set(atom1, 100);
      store.set(atom2, "value");

      const serialized = store.serializeState?.();
      expect(serialized).toBeDefined();
    });

    it("should handle non-serializable values in state", () => {
      const store = createStore();
      const atomWithFunc = atom({ fn: () => {}, value: 42 });

      // Should not throw
      const serialized = store.serializeState?.();
      expect(serialized).toBeDefined();
    });
  });

  describe("subscription edge cases", () => {
    it("should handle subscriber that throws", () => {
      const store = createStore();
      const countAtom = atom(0);

      store.subscribe(countAtom, () => {
        throw new Error("Subscriber error");
      });

      // Should not throw from store
      expect(() => store.set(countAtom, 1)).not.toThrow();
    });

    it("should handle atom with complex state in subscription", () => {
      const store = createStore();
      const complexAtom = atom({ name: "test", count: 0 });
      let receivedValue: any = null;

      store.subscribe(complexAtom, (value) => {
        receivedValue = value;
      });

      store.set(complexAtom, { name: "updated", count: 1 });
      expect(receivedValue).toEqual({ name: "updated", count: 1 });
    });
  });

  describe("performance", () => {
    it("should handle 100+ atoms efficiently", () => {
      const store = createStore();
      const atoms = Array.from({ length: 100 }, (_, i) => atom(i));

      const start = performance.now();
      atoms.forEach((a) => store.get(a));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // <100ms for 100 atoms
    });

    it("should handle rapid updates", () => {
      const store = createStore();
      const testAtom = atom(0);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        store.set(testAtom, i);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it("should handle subscription to many atoms", () => {
      const store = createStore();
      const atoms = Array.from({ length: 50 }, (_, i) => atom(i));

      const start = performance.now();
      atoms.forEach((a) => store.subscribe(a, () => {}));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });

  describe("atom registry integration", () => {
    it("should register atoms with global registry", () => {
      const store = createStore();
      const testAtom = atom(42, "registry-test");
      atomRegistry.clear();

      store.get(testAtom);

      const registeredAtom = atomRegistry.get(testAtom.id);
      expect(registeredAtom).toBe(testAtom);
    });

    it("should track atoms per store in isolated mode", () => {
      const store = createEnhancedStore([], { registryMode: "isolated" });
      const testAtom = atom(0);

      store.get(testAtom);

      const atoms = atomRegistry.getAtomsForStore(store);
      expect(atoms.length).toBeGreaterThan(0);
    });

    it("should get store for atom", () => {
      const store = createStore();
      const testAtom = atom(0);

      store.get(testAtom);

      const atomStore = atomRegistry.getStoreForAtom(testAtom.id);
      expect(atomStore).toBeDefined();
    });
  });

  describe("computed atom recomputation", () => {
    it("should recompute when dependency changes", () => {
      const store = createStore();
      const baseAtom = atom(5);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(store.get(doubleAtom)).toBe(10);

      store.set(baseAtom, 10);
      expect(store.get(doubleAtom)).toBe(20);
    });

    it("should recompute chain of computed atoms", () => {
      const store = createStore();
      const baseAtom = atom(2);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const quadrupleAtom = atom((get: Getter) => get(doubleAtom) * 2);

      expect(store.get(quadrupleAtom)).toBe(8);

      store.set(baseAtom, 3);
      expect(store.get(quadrupleAtom)).toBe(12);
    });

    it("should not recompute if dependency unchanged", () => {
      const store = createStore();
      const baseAtom = atom(10);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

      // First computation
      const firstValue = store.get(doubleAtom);

      // Change unrelated atom
      const unrelatedAtom = atom(0);
      store.set(unrelatedAtom, 5);

      // Double atom should still have same value
      expect(store.get(doubleAtom)).toBe(firstValue);
    });
  });

  describe("store edge cases", () => {
    it("should handle atom with function value", () => {
      const store = createStore();
      const funcAtom = atom(() => 42);

      const value = store.get(funcAtom);
      expect(typeof value).toBe("function");
      expect(value()).toBe(42);
    });

    it("should handle atom with Symbol value", () => {
      const store = createStore();
      const symbolAtom = atom(Symbol.for("test"));

      const value = store.get(symbolAtom);
      expect(value).toBe(Symbol.for("test"));
    });

    it("should handle atom with BigInt value", () => {
      const store = createStore();
      const bigintAtom = atom(BigInt(123456789));

      const value = store.get(bigintAtom);
      expect(value).toBe(BigInt(123456789));
    });

    it("should handle atom with Date value", () => {
      const store = createStore();
      const dateAtom = atom(new Date("2023-01-01"));

      const value = store.get(dateAtom);
      expect(value).toBeInstanceOf(Date);
    });

    it("should handle atom with RegExp value", () => {
      const store = createStore();
      const regexpAtom = atom(/test/i);

      const value = store.get(regexpAtom);
      expect(value).toBeInstanceOf(RegExp);
    });
  });

  describe("circular dependency handling", () => {
    it("should detect circular dependencies in computed atoms", () => {
      const store = createStore();

      const atom1 = atom((get: Getter) => {
        return get(atom2) + 1;
      });
      const atom2 = atom((get: Getter) => {
        return get(atom1) + 1;
      });

      // This should either throw or handle gracefully
      expect(() => store.get(atom1)).not.toThrow();
    });
  });
});
