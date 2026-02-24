import { describe, it, expect } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - time travel options", () => {
  it("should respect maxHistory limit", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
      maxHistory: 3,
    });
    const countAtom = atom(0);

    for (let i = 0; i < 5; i++) {
      store.set(countAtom, i);
      store.captureSnapshot?.(`step ${i}`);
    }

    const history = store.getHistory?.() ?? [];
    expect(history.length).toBe(3);
    expect(history[0].metadata.action).toBe("step 2");
    expect(history[2].metadata.action).toBe("step 4");
  });

  it("should handle auto capture disabled", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
      autoCapture: false,
    });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    const history = store.getHistory?.() ?? [];
    expect(history.length).toBe(0);

    store.captureSnapshot?.("manual capture");
    const history2 = store.getHistory?.() ?? [];
    expect(history2.length).toBe(1);
  });

  it("should handle auto capture enabled by default", () => {
    const store = createEnhancedStore([], {
      enableTimeTravel: true,
    });
    const countAtom = atom(0);

    store.set(countAtom, 5);
    const history = store.getHistory?.() ?? [];
    expect(history.length).toBeGreaterThan(0);
  });

  it("should use default maxHistory when not specified", () => {
    const store = createEnhancedStore([], { enableTimeTravel: true });
    const countAtom = atom(0);

    for (let i = 0; i < 100; i++) {
      store.set(countAtom, i);
      store.captureSnapshot?.(`step ${i}`);
    }

    const history = store.getHistory?.() ?? [];
    expect(history.length).toBe(50); // Default maxHistory is 50
  });
});
