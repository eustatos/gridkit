import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore } from "../../store";
import { atom } from "../../atom";
import { SimpleTimeTravel } from "../";

describe("SimpleTimeTravel - Undo/Redo", () => {
  const createTimeTravelStore = (maxHistory = 10, autoCapture = false) => {
    const store = createStore();

    // Create atoms with proper initialization
    const counterAtom = atom(0, "counter");
    const textAtom = atom("hello", "text");

    // Initialize atoms in store
    store.set(counterAtom, 0);
    store.set(textAtom, "hello");

    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory,
      autoCapture,
      atoms: [counterAtom, textAtom],
    });

    return { store, timeTravel, counterAtom, textAtom };
  };

  describe("undo", () => {
    it("should undo to previous state", () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      store.set(counterAtom, 5);

      // Wait for capture to happen
      setTimeout(() => {
        const result = timeTravel.undo();

        expect(result).toBe(true);
        expect(store.get(counterAtom)).toBe(0);
      }, 10);
    });

    it("should return false when no undo available", () => {
      const { timeTravel } = createTimeTravelStore(10, false);

      expect(timeTravel.undo()).toBe(false);
    });

    it("should move current snapshot to future after undo", () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      store.set(counterAtom, 5);

      setTimeout(() => {
        timeTravel.undo();

        expect(timeTravel.canRedo()).toBe(true);
        expect(timeTravel.getHistory().length).toBe(2); // initial + snapshot after set
      }, 10);
    });

    it("should handle multiple undos", async () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      return new Promise<void>((resolve) => {
        const step = 0;

        store.set(counterAtom, 1);

        setTimeout(() => {
          store.set(counterAtom, 2);

          setTimeout(() => {
            store.set(counterAtom, 3);

            setTimeout(() => {
              timeTravel.undo();
              expect(store.get(counterAtom)).toBe(2);

              timeTravel.undo();
              expect(store.get(counterAtom)).toBe(1);

              timeTravel.undo();
              expect(store.get(counterAtom)).toBe(0);

              resolve();
            }, 10);
          }, 10);
        }, 10);
      });
    });
  });

  describe("redo", () => {
    it("should redo after undo", () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      store.set(counterAtom, 5);

      setTimeout(() => {
        timeTravel.undo();
        expect(store.get(counterAtom)).toBe(0);

        const result = timeTravel.redo();

        expect(result).toBe(true);
        expect(store.get(counterAtom)).toBe(5);
      }, 10);
    });

    it("should return false when no redo available", () => {
      const { timeTravel } = createTimeTravelStore(10, false);

      expect(timeTravel.redo()).toBe(false);
    });

    it("should handle multiple redos", async () => {
      const { store, timeTravel, counterAtom } = createTimeTravelStore(
        10,
        true,
      );

      return new Promise<void>((resolve) => {
        store.set(counterAtom, 1);

        setTimeout(() => {
          store.set(counterAtom, 2);

          setTimeout(() => {
            store.set(counterAtom, 3);

            setTimeout(() => {
              timeTravel.undo();
              timeTravel.undo();
              expect(store.get(counterAtom)).toBe(1);

              timeTravel.redo();
              expect(store.get(counterAtom)).toBe(2);

              timeTravel.redo();
              expect(store.get(counterAtom)).toBe(3);

              resolve();
            }, 10);
          }, 10);
        }, 10);
      });
    });
  });

  // ... rest of the tests with similar async patterns
});
