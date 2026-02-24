import { describe, it, expect, beforeEach } from "vitest";
import { createEnhancedStore, atom } from "../index";

describe("enhancedStore - capture and undo", () => {
  let store: any;
  let countAtom: any;

  beforeEach(() => {
    store = createEnhancedStore([], { enableTimeTravel: true });
    countAtom = atom(0);
  });

  it("should capture snapshot", () => {
    store.set(countAtom, 5);

    const snapshot = store.captureSnapshot?.("set value");
    expect(snapshot).toBeDefined();
    expect(snapshot?.id).toBeDefined();
    expect(snapshot?.metadata.action).toBe("set value");
  });

  it("should undo to previous state", () => {
    expect(store.get(countAtom)).toBe(0);

    store.set(countAtom, 10);
    store.captureSnapshot?.("set to 10");

    store.set(countAtom, 20);

    store.undo?.();
    expect(store.get(countAtom)).toBe(10);
  });

  it("should redo after undo", () => {
    store.set(countAtom, 5);
    store.captureSnapshot?.("set to 5");

    store.set(countAtom, 10);
    store.undo?.();
    expect(store.get(countAtom)).toBe(5);

    store.redo?.();
    expect(store.get(countAtom)).toBe(10);
  });

  it("should check canUndo/canRedo", () => {
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

  it("should handle multiple undos", () => {
    store.set(countAtom, 1);
    store.captureSnapshot?.("snap1");
    store.set(countAtom, 2);
    store.captureSnapshot?.("snap2");
    store.set(countAtom, 3);
    store.captureSnapshot?.("snap3");

    store.undo?.();
    expect(store.get(countAtom)).toBe(2);

    store.undo?.();
    expect(store.get(countAtom)).toBe(1);

    store.undo?.();
    expect(store.get(countAtom)).toBe(0);
  });

  it("should handle multiple redos", () => {
    store.set(countAtom, 1);
    store.captureSnapshot?.("snap1");
    store.set(countAtom, 2);
    store.captureSnapshot?.("snap2");
    store.set(countAtom, 3);
    store.captureSnapshot?.("snap3");

    store.undo?.();
    store.undo?.();
    expect(store.get(countAtom)).toBe(1);

    store.redo?.();
    expect(store.get(countAtom)).toBe(2);

    store.redo?.();
    expect(store.get(countAtom)).toBe(3);
  });
});
