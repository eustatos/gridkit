import { describe, it, expect } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";

describe("SimpleTimeTravel - Constructor", () => {
  // Helper to create a test store with time travel
  const createTimeTravelStore = (maxHistory = 10, autoCapture = true) => {
    const store = createStore([]);

    const counterAtom = atom(0, "counter");
    const textAtom = atom("hello", "text");

    store.get(counterAtom);
    store.get(textAtom);

    const timeTravel = new SimpleTimeTravel(store, { maxHistory, autoCapture });

    (timeTravel as any).atoms = { counterAtom, textAtom };

    return { store, timeTravel };
  };

  // Helper to convert atom values to SnapshotStateEntry format
  const toSnapshotEntry = (
    value: any,
    type: "primitive" | "computed" | "writable" = "primitive",
    name?: string,
  ) => ({
    value,
    type,
    name,
  });

  it("should capture initial state when autoCapture is true", () => {
    const { timeTravel } = createTimeTravelStore(10, true);

    const history = timeTravel.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].metadata).toMatchObject({
      action: "initial state",
      atomCount: 2,
    });
    expect(history[0].state).toEqual({
      counter: toSnapshotEntry(0, "primitive", "counter"),
      text: toSnapshotEntry("hello", "primitive", "text"),
    });
  });

  it("should not capture initial state when autoCapture is false", () => {
    const { timeTravel } = createTimeTravelStore(10, false);

    const history = timeTravel.getHistory();
    expect(history.length).toBe(0);
  });

  it("should wrap store.set for auto-capture", () => {
    const { store, timeTravel } = createTimeTravelStore(10, true);
    const { counterAtom } = (timeTravel as any).atoms;

    timeTravel.clearHistory();

    store.set(counterAtom, 5);

    const history = timeTravel.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].metadata.action).toBe("set counter");
    expect(history[0].state.counter).toEqual(
      toSnapshotEntry(5, "primitive", "counter"),
    );
    expect(history[0].state.text).toEqual(
      toSnapshotEntry("hello", "primitive", "text"),
    );
  });

  it("should not capture during time travel operations", () => {
    const { store, timeTravel } = createTimeTravelStore(10, true);
    const { counterAtom } = (timeTravel as any).atoms;

    timeTravel.clearHistory();

    store.set(counterAtom, 5);
    expect(timeTravel.getHistory().length).toBe(1);

    timeTravel.undo();

    expect(timeTravel.getHistory().length).toBe(1);
  });
});
