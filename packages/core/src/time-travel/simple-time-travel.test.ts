import { describe, it, expect, vi } from "vitest";
import { atom, createEnhancedStore } from "../index";

describe("SimpleTimeTravel", () => {
  describe("capture", () => {
    it("should capture snapshot with action name", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);
      store.set(countAtom, 5);

      const snapshot = store.captureSnapshot?.("set to 5");
      
      expect(snapshot).toBeDefined();
      expect(snapshot?.id).toBeDefined();
      expect(snapshot?.metadata.action).toBe("set to 5");
      expect(snapshot?.metadata.timestamp).toBeDefined();
    });

    it("should capture snapshot without action name", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);
      store.set(countAtom, 5);

      const snapshot = store.captureSnapshot?.();
      
      expect(snapshot).toBeDefined();
      expect(snapshot?.id).toBeDefined();
      expect(snapshot?.metadata.action).toBeUndefined();
    });

    it("should capture all atom values", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const atom1 = atom(10);
      const atom2 = atom("test");
      const atom3 = atom(true);

      store.set(atom1, 100);
      store.set(atom2, "updated");
      store.set(atom3, false);

      const snapshot = store.captureSnapshot?.();
      
      expect(snapshot?.state).toBeDefined();
      expect(Object.keys(snapshot?.state || {}).length).toBeGreaterThanOrEqual(3);
    });

    it("should track atom count in metadata", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const atom1 = atom(1);
      const atom2 = atom(2);

      const snapshot = store.captureSnapshot?.();
      
      expect(snapshot?.metadata.atomCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("undo", () => {
    it("should undo to previous state", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      store.set(countAtom, 10);
      expect(store.get(countAtom)).toBe(10);

      store.undo?.();
      expect(store.get(countAtom)).toBe(5);
    });

    it("should return false when no history", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      const result = store.undo?.();
      expect(result).toBe(false);
    });

    it("should handle undo with computed atoms", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const baseAtom = atom(5);
      const doubleAtom = atom((get) => get(baseAtom) * 2);

      store.set(baseAtom, 5);
      store.captureSnapshot?.("set base to 5");

      store.set(baseAtom, 10);
      expect(store.get(doubleAtom)).toBe(20);

      store.undo?.();
      expect(store.get(doubleAtom)).toBe(10);
    });
  });

  describe("redo", () => {
    it("should redo after undo", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      store.set(countAtom, 10);
      store.undo?.();
      expect(store.get(countAtom)).toBe(5);

      store.redo?.();
      expect(store.get(countAtom)).toBe(10);
    });

    it("should return false when no forward history", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.undo?.(); // No undo available

      const result = store.redo?.();
      expect(result).toBe(false);
    });
  });

  describe("canUndo/canRedo", () => {
    it("should check undo availability", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      
      expect(store.canUndo?.()).toBe(false);

      const countAtom = atom(0);
      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      expect(store.canUndo?.()).toBe(true);

      store.undo?.();
      expect(store.canUndo?.()).toBe(false);
    });

    it("should check redo availability", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      store.set(countAtom, 10);
      expect(store.canRedo?.()).toBe(false);

      store.undo?.();
      expect(store.canRedo?.()).toBe(true);

      store.redo?.();
      expect(store.canRedo?.()).toBe(false);
    });
  });

  describe("jumpTo", () => {
    it("should jump to specific snapshot", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      for (let i = 0; i < 5; i++) {
        store.set(countAtom, i);
        store.captureSnapshot?.(`step ${i}`);
      }

      store.jumpTo?.(2);
      expect(store.get(countAtom)).toBe(2);
    });

    it("should return false for invalid index", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      const result = store.jumpTo?.(100);
      expect(result).toBe(false);
    });

    it("should return true for current index", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      const result = store.jumpTo?.(0);
      expect(result).toBe(true);
    });
  });

  describe("clearHistory", () => {
    it("should clear all snapshots", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      for (let i = 0; i < 3; i++) {
        store.set(countAtom, i);
        store.captureSnapshot?.(`step ${i}`);
      }

      expect(store.getHistory?.()?.length).toBe(3);

      store.clearHistory?.();
      expect(store.getHistory?.()?.length).toBe(0);
    });

    it("should reset undo/redo state", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      store.set(countAtom, 10);
      expect(store.canUndo?.()).toBe(true);

      store.clearHistory?.();
      expect(store.canUndo?.()).toBe(false);
    });
  });

  describe("getHistory", () => {
    it("should return all snapshots", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      for (let i = 0; i < 3; i++) {
        store.set(countAtom, i);
        store.captureSnapshot?.(`step ${i}`);
      }

      const history = store.getHistory?.();
      expect(history).toBeDefined();
      expect(history?.length).toBe(3);
    });

    it("should return empty array when no snapshots", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      
      const history = store.getHistory?.();
      expect(history).toEqual([]);
    });
  });

  describe("max history limit", () => {
    it("should respect maxHistory option", () => {
      const store = createEnhancedStore([], { 
        enableTimeTravel: true, 
        maxHistory: 3 
      });
      const countAtom = atom(0);

      for (let i = 0; i < 5; i++) {
        store.set(countAtom, i);
        store.captureSnapshot?.(`step ${i}`);
      }

      const history = store.getHistory?.();
      expect(history?.length).toBeLessThanOrEqual(3);
    });

    it("should remove oldest snapshots when limit exceeded", () => {
      const store = createEnhancedStore([], { 
        enableTimeTravel: true, 
        maxHistory: 2 
      });
      const countAtom = atom(0);

      store.set(countAtom, 1);
      store.captureSnapshot?.("step 1");
      
      store.set(countAtom, 2);
      store.captureSnapshot?.("step 2");
      
      store.set(countAtom, 3);
      store.captureSnapshot?.("step 3");

      const history = store.getHistory?.();
      expect(history?.length).toBe(2);
      
      // First snapshot should be gone
      expect(history?.[0]?.metadata.action).toBe("step 2");
    });
  });

  describe("undo/redo with multiple atoms", () => {
    it("should handle multiple atoms in undo", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const atom1 = atom(0);
      const atom2 = atom("test");

      store.set(atom1, 5);
      store.set(atom2, "value1");
      store.captureSnapshot?.("set both");

      store.set(atom1, 10);
      store.set(atom2, "value2");

      store.undo?.();
      expect(store.get(atom1)).toBe(5);
      expect(store.get(atom2)).toBe("value1");
    });
  });

  describe("time travel edge cases", () => {
    it("should handle capture with no atoms", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      
      const snapshot = store.captureSnapshot?.("empty state");
      expect(snapshot).toBeDefined();
      // Atom count may be 0 if registry is empty
      expect(snapshot?.metadata.atomCount).toBeGreaterThanOrEqual(0);
    });

    it("should handle undo after clearHistory", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      store.clearHistory?.();
      const result = store.undo?.();
      expect(result).toBe(false);
    });

    it("should handle rapid snapshots", () => {
      const store = createEnhancedStore([], { 
        enableTimeTravel: true, 
        maxHistory: 10 
      });
      const countAtom = atom(0);

      for (let i = 0; i < 15; i++) {
        store.set(countAtom, i);
        store.captureSnapshot?.(`step ${i}`);
      }

      const history = store.getHistory?.();
      expect(history?.length).toBeLessThanOrEqual(10);
    });

    it("should handle jumpTo at boundaries", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 1);
      store.captureSnapshot?.("step 1");
      
      store.set(countAtom, 2);
      store.captureSnapshot?.("step 2");

      // Jump to first
      store.jumpTo?.(0);
      expect(store.get(countAtom)).toBe(1);

      // Jump to last
      store.jumpTo?.(1);
      expect(store.get(countAtom)).toBe(2);
    });
  });
});
