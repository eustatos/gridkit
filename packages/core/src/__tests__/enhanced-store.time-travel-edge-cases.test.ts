import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - time travel edge cases", () => {
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

  it("should handle jumpTo with valid index", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    store.set(countAtom, 1);
    store.captureSnapshot?.("snap1");
    store.set(countAtom, 2);
    store.captureSnapshot?.("snap2");
    store.set(countAtom, 3);
    store.captureSnapshot?.("snap3");

    const result = store.jumpTo?.(1);
    expect(result).toBe(true);
    expect(store.get(countAtom)).toBe(2);
  });

  it("should handle jumpTo with invalid index", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    const result = store.jumpTo?.(100);
    expect(result).toBe(false);
    expect(store.get(countAtom)).toBe(5);
  });

  it("should handle jumpTo with negative index", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    const result = store.jumpTo?.(-1);
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
    expect(store.canRedo?.()).toBe(false);
  });

  it("should handle snapshot with no changes", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    store.captureSnapshot?.("snap1");
    const snapshot = store.captureSnapshot?.("snap2");
    expect(snapshot).toBeUndefined();
  });
});
