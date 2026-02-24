import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("SimpleTimeTravel - Integration with Computed Atoms", () => {
  const toSnapshotEntry = (
    value: any,
    type: "primitive" | "computed" | "writable" = "primitive",
    name?: string,
  ) => ({
    value,
    type,
    name,
  });

  it("should work with computed atoms", () => {
    const store = createStore([]);

    const counterAtom = atom(0, "counter");
    const doubleAtom = atom((get) => get(counterAtom) * 2, "double");

    store.get(counterAtom);
    store.get(doubleAtom);

    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    store.set(counterAtom, 5);
    timeTravel.capture("set counter to 5");

    expect(store.get(doubleAtom)).toBe(10);

    const snapshot = timeTravel.capture("after computed");
    expect(snapshot?.state.counter).toEqual(
      toSnapshotEntry(5, "primitive", "counter"),
    );
    expect(snapshot?.state.double).toEqual(
      toSnapshotEntry(10, "computed", "double"),
    );

    timeTravel.undo();
    expect(store.get(counterAtom)).toBe(0);
    expect(store.get(doubleAtom)).toBe(0);
  });

  it("should work with writable atoms", () => {
    const store = createStore([]);

    const counterAtom = atom(0, "counter");
    const writableAtom = atom(
      (get) => `Count: ${get(counterAtom)}`,
      (get, set, value: number) => {
        set(counterAtom, value);
      },
      "writable",
    );

    store.get(counterAtom);
    store.get(writableAtom);

    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    store.set(writableAtom, 10);
    timeTravel.capture("set through writable");

    expect(store.get(counterAtom)).toBe(10);
    expect(store.get(writableAtom)).toBe("Count: 10");

    const snapshot = timeTravel.capture("after writable");
    expect(snapshot?.state.counter).toEqual(
      toSnapshotEntry(10, "primitive", "counter"),
    );
    expect(snapshot?.state.writable).toEqual(
      toSnapshotEntry("Count: 10", "writable", "writable"),
    );

    timeTravel.undo();
    expect(store.get(counterAtom)).toBe(0);
    expect(store.get(writableAtom)).toBe("Count: 0");
  });

  it("should handle chain of computed atoms", () => {
    const store = createStore([]);

    const counterAtom = atom(1, "counter");
    const doubleAtom = atom((get) => get(counterAtom) * 2, "double");
    const quadrupleAtom = atom((get) => get(doubleAtom) * 2, "quadruple");

    store.get(counterAtom);
    store.get(doubleAtom);
    store.get(quadrupleAtom);

    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    store.set(counterAtom, 3);
    timeTravel.capture("update counter");

    expect(store.get(doubleAtom)).toBe(6);
    expect(store.get(quadrupleAtom)).toBe(12);

    timeTravel.undo();
    expect(store.get(counterAtom)).toBe(1);
    expect(store.get(doubleAtom)).toBe(2);
    expect(store.get(quadrupleAtom)).toBe(4);
  });
});
