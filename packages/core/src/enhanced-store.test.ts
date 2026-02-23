import { describe, it, expect, vi, beforeEach } from "vitest";
import { atom, createEnhancedStore } from "./index";

describe("enhancedStore", () => {
  describe("createEnhancedStore", () => {
    it("should create an enhanced store without options", () => {
      const store = createEnhancedStore();
      expect(store).toBeDefined();
      expect(typeof store.get).toBe("function");
      expect(typeof store.set).toBe("function");
      expect(typeof store.subscribe).toBe("function");
      expect(typeof store.getState).toBe("function");
    });

    it("should create an enhanced store with empty plugins array", () => {
      const store = createEnhancedStore([]);
      expect(store).toBeDefined();
    });

    it("should create an enhanced store with plugins", () => {
      const plugin = vi.fn((store) => {
        store.applyPlugin = (p) => console.log("Plugin applied");
      });
      const store = createEnhancedStore([plugin]);
      expect(plugin).toHaveBeenCalled();
    });

    it("should enable DevTools by default", () => {
      const store = createEnhancedStore();
      expect(store).toBeDefined();
    });

    it("should support isolated registry mode", () => {
      const store = createEnhancedStore([], { registryMode: "isolated" });
      expect(store).toBeDefined();
    });
  });

  describe("enhanced store methods", () => {
    it("should have getState method", () => {
      const store = createEnhancedStore();
      const countAtom = atom(0);
      store.set(countAtom, 42);
      
      const state = store.getState();
      expect(state).toBeDefined();
    });

    it("should have serializeState method", () => {
      const store = createEnhancedStore();
      const countAtom = atom(42);
      
      const serialized = store.serializeState?.();
      expect(serialized).toBeDefined();
    });

    it("should have applyPlugin method", () => {
      const store = createEnhancedStore();
      const plugin = vi.fn((s) => {});
      
      store.applyPlugin?.(plugin);
      expect(plugin).toHaveBeenCalled();
    });

    it("should have getPlugins method", () => {
      const plugin = vi.fn((s) => {});
      const store = createEnhancedStore([plugin]);
      
      const plugins = store.getPlugins?.();
      expect(plugins).toBeDefined();
    });
  });

  describe("time travel API", () => {
    it("should have captureSnapshot method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.captureSnapshot).toBeDefined();
    });

    it("should have undo method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.undo).toBeDefined();
    });

    it("should have redo method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.redo).toBeDefined();
    });

    it("should have canUndo method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.canUndo).toBeDefined();
    });

    it("should have canRedo method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.canRedo).toBeDefined();
    });

    it("should have jumpTo method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.jumpTo).toBeDefined();
    });

    it("should have clearHistory method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.clearHistory).toBeDefined();
    });

    it("should have getHistory method", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      expect(store.getHistory).toBeDefined();
    });
  });

  describe("capture and undo", () => {
    it("should capture snapshot", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);
      store.set(countAtom, 5);

      const snapshot = store.captureSnapshot?.("set value");
      expect(snapshot).toBeDefined();
      expect(snapshot?.id).toBeDefined();
    });

    it("should undo to previous state", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      // Initial value
      expect(store.get(countAtom)).toBe(0);

      // Set and capture
      store.set(countAtom, 10);
      store.captureSnapshot?.("set to 10");

      // Change again
      store.set(countAtom, 20);

      // Undo
      store.undo?.();
      expect(store.get(countAtom)).toBe(10);
    });

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

    it("should check canUndo/canRedo", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      // No history yet
      expect(store.canUndo?.()).toBe(false);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      expect(store.canUndo?.()).toBe(true);
      expect(store.canRedo?.()).toBe(false);

      store.set(countAtom, 10);
      expect(store.canRedo?.()).toBe(false);

      store.undo?.();
      expect(store.canRedo?.()).toBe(true);
    });
  });

  describe("time travel with max history", () => {
    it("should respect maxHistory limit", () => {
      const store = createEnhancedStore([], { 
        enableTimeTravel: true, 
        maxHistory: 3 
      });
      const countAtom = atom(0);

      for (let i = 0; i < 5; i++) {
        store.set(countAtom, i);
        store.captureSnapshot?.(`step ${i}`);
      }

      const history = store.getHistory?.() ?? [];
      expect(history.length).toBeLessThanOrEqual(3);
    });
  });

  describe("time travel with auto capture", () => {
    it("should handle auto capture disabled", () => {
      const store = createEnhancedStore([], { 
        enableTimeTravel: true, 
        autoCapture: false 
      });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      const history = store.getHistory?.() ?? [];
      expect(history.length).toBe(0);
    });
  });

  describe("time travel edge cases", () => {
    it("should handle undo when no history", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      
      const result = store.undo?.();
      expect(result).toBe(false);
    });

    it("should handle redo when no forward history", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      store.undo?.();
      const result = store.redo?.();
      expect(result).toBe(true);

      const result2 = store.redo?.();
      expect(result2).toBe(false);
    });

    it("should handle jumpTo with invalid index", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      const result = store.jumpTo?.(100);
      expect(result).toBe(false);
    });

    it("should handle clearHistory", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");
      store.set(countAtom, 10);
      store.captureSnapshot?.("set to 10");

      expect(store.getHistory?.()?.length).toBe(2);

      store.clearHistory?.();
      expect(store.getHistory?.()?.length).toBe(0);
      expect(store.canUndo?.()).toBe(false);
    });
  });

  describe("DevTools connection", () => {
    it("should have connectDevTools method when enabled", () => {
      const store = createEnhancedStore([], { enableDevTools: true });
      expect(store.connectDevTools).toBeDefined();
    });

    it("should not have connectDevTools method when disabled", () => {
      const store = createEnhancedStore([], { enableDevTools: false });
      expect(store.connectDevTools).toBeUndefined();
    });

    it("should connect to DevTools without error", () => {
      const store = createEnhancedStore([], { enableDevTools: true, devToolsName: "Test Store" });
      
      expect(() => store.connectDevTools?.()).not.toThrow();
    });
  });

  describe("enhanced store with plugins", () => {
    it("should apply multiple plugins", () => {
      const plugin1 = vi.fn((store) => {});
      const plugin2 = vi.fn((store) => {});
      
      const store = createEnhancedStore([plugin1, plugin2]);
      
      expect(plugin1).toHaveBeenCalled();
      expect(plugin2).toHaveBeenCalled();
    });

    it("should pass same store instance to all plugins", () => {
      const storeInstances: any[] = [];
      
      const plugin1 = (store: any) => storeInstances.push(store);
      const plugin2 = (store: any) => storeInstances.push(store);
      
      const store = createEnhancedStore([plugin1, plugin2]);
      
      expect(storeInstances.length).toBe(2);
      expect(storeInstances[0]).toBe(storeInstances[1]);
    });
  });

  describe("enhanced store edge cases", () => {
    it("should handle empty atoms", () => {
      const store = createEnhancedStore();
      const state = store.getState();
      expect(state).toEqual({});
    });

    it("should handle atom deletion", () => {
      const store = createEnhancedStore();
      const countAtom = atom(0);
      
      store.set(countAtom, 5);
      expect(store.get(countAtom)).toBe(5);
    });

    it("should handle reset after time travel", () => {
      const store = createEnhancedStore([], { enableTimeTravel: true });
      const countAtom = atom(0);

      store.set(countAtom, 5);
      store.captureSnapshot?.("set to 5");

      store.set(countAtom, 10);
      store.undo?.();

      // Reset atom
      store.set(countAtom, 0);
      expect(store.get(countAtom)).toBe(0);
    });
  });
});
