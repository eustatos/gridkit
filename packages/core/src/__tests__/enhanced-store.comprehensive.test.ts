import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - comprehensive scenarios", () => {
  it("should work with multiple atoms and time travel", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });

    const counterAtom = atom(0, "counter");
    const textAtom = atom("hello", "text");

    store.set(counterAtom, 5);
    store.set(textAtom, "world");
    store.captureSnapshot?.("initial update");

    store.set(counterAtom, 10);
    store.set(textAtom, "updated");
    store.captureSnapshot?.("second update");

    store.undo?.();
    expect(store.get(counterAtom)).toBe(5);
    expect(store.get(textAtom)).toBe("world");

    store.redo?.();
    expect(store.get(counterAtom)).toBe(10);
    expect(store.get(textAtom)).toBe("updated");
  });

  it("should maintain history integrity across operations", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
      maxHistory: 3,
    });
    const counterAtom = atom(0);

    for (let i = 1; i <= 5; i++) {
      store.set(counterAtom, i);
      store.captureSnapshot?.(`step ${i}`);
    }

    const history = store.getHistory?.() ?? [];
    expect(history.length).toBe(3);
    expect(history[0].metadata.action).toBe("step 3");
    expect(history[2].metadata.action).toBe("step 5");

    store.jumpTo?.(0);
    expect(store.get(counterAtom)).toBe(3);

    store.undo?.();
    expect(store.get(counterAtom)).toBe(2);
  });

  it("should work with DevTools and time travel together", () => {
    const consoleSpy = vi.spyOn(console, "log");
    const store = createEnhancedStore([], {
      enableDevTools: true,
      enableTimeTravel: true,
      devToolsName: "TestStore",
    });

    store.connectDevTools?.();
    expect(consoleSpy).toHaveBeenCalled();

    const counterAtom = atom(0);
    store.set(counterAtom, 5);
    store.captureSnapshot?.("test");
    store.undo?.();

    consoleSpy.mockRestore();
  });
});
