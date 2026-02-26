/**
 * HistoryManager Edge Cases Test
 * Tests edge cases, boundary conditions, and error scenarios for HistoryManager
 */

import { describe, it, expect, beforeEach } from "vitest";
import { HistoryManager } from "../core/HistoryManager";
import { TestHelper } from "./utils/test-helpers";
import type { Snapshot } from "../../types";

describe("HistoryManager Edge Cases", () => {
  let historyManager: HistoryManager;

  beforeEach(() => {
    historyManager = new HistoryManager(5); // Small limit for testing
  });

  it("should handle maxHistory = 0", () => {
    historyManager = new HistoryManager(0);

    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    expect(historyManager.getAll().length).toBe(0);
    expect(historyManager.canUndo()).toBe(false);
  });

  it("should handle maxHistory = 1 correctly", () => {
    historyManager = new HistoryManager(1);

    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    expect(historyManager.getCurrent()?.id).toBe("1");

    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    expect(historyManager.getCurrent()?.id).toBe("2");

    // Access private past array for testing
    const past = (historyManager as unknown as { past: Snapshot[] }).past;
    expect(past.length).toBe(0);
  });

  it("should handle adding same snapshot multiple times", () => {
    const snapshot = TestHelper.generateSnapshot("same", { a: 1 });

    historyManager.add(snapshot);
    historyManager.add(snapshot);

    expect(historyManager.getAll().length).toBe(2);
    expect(historyManager.getCurrent()).toBe(snapshot);
  });

  it("should handle undo/redo with empty history", () => {
    expect(historyManager.undo()).toBeNull();
    expect(historyManager.redo()).toBeNull();
    expect(historyManager.canUndo()).toBe(false);
    expect(historyManager.canRedo()).toBe(false);
  });

  it("should handle jumpTo with invalid indices", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    expect(historyManager.jumpTo(-1)).toBeNull();
    expect(historyManager.jumpTo(999)).toBeNull();
    expect(historyManager.getCurrent()?.id).toBe("2");
  });

  it("should handle clear during undo/redo", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    historyManager.undo();
    historyManager.clear();

    expect(historyManager.canRedo()).toBe(false);
    expect(historyManager.getCurrent()).toBeNull();
  });

  it("should maintain consistency with rapid add/undo/redo", () => {
    for (let i = 0; i < 10; i++) {
      historyManager.add(TestHelper.generateSnapshot(`${i}`, { value: i }));
    }

    for (let i = 0; i < 5; i++) {
      historyManager.undo();
      historyManager.redo();
    }

    expect(historyManager.getCurrent()?.id).toBe("9");

    const past = (historyManager as unknown as { past: Snapshot[] }).past;
    const future = (historyManager as unknown as { future: Snapshot[] }).future;
    expect(past.length + future.length).toBe(9);
  });

  it("should handle adding snapshots beyond maxHistory", () => {
    for (let i = 0; i < 10; i++) {
      historyManager.add(TestHelper.generateSnapshot(`${i}`, { value: i }));
    }

    expect(historyManager.getAll().length).toBe(5); // Only last 5
    expect(historyManager.getCurrent()?.id).toBe("9");
  });

  it("should preserve order after multiple undos and redos", () => {
    for (let i = 0; i < 5; i++) {
      historyManager.add(TestHelper.generateSnapshot(`${i}`, { value: i }));
    }

    historyManager.undo(); // at 3
    historyManager.undo(); // at 2
    historyManager.redo(); // at 3
    historyManager.undo(); // at 2

    expect(historyManager.getCurrent()?.metadata.action).toBe("test-2");
  });

  it("should handle jumpTo at boundaries", () => {
    for (let i = 0; i < 5; i++) {
      historyManager.add(TestHelper.generateSnapshot(`${i}`, { value: i }));
    }

    // Jump to first
    expect(historyManager.jumpTo(0)).toBeDefined();
    expect(historyManager.getCurrent()?.id).toBe("0");
    expect(historyManager.canUndo()).toBe(false);

    // Jump to last
    expect(historyManager.jumpTo(4)).toBeDefined();
    expect(historyManager.getCurrent()?.id).toBe("4");
    expect(historyManager.canRedo()).toBe(false);
  });

  it("should handle undo at beginning of history", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));

    expect(historyManager.undo()).toBeNull();
    expect(historyManager.getCurrent()?.id).toBe("1");
  });

  it("should handle redo at end of history", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));
    historyManager.undo();

    expect(historyManager.redo()).toBeDefined();
    expect(historyManager.redo()).toBeNull(); // Already at end
  });

  it("should handle new snapshot after undo (clears future)", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));
    historyManager.add(TestHelper.generateSnapshot("3", { a: 3 }));

    historyManager.undo(); // Back to 2
    historyManager.undo(); // Back to 1

    // Add new snapshot - should clear future (2 and 3)
    historyManager.add(TestHelper.generateSnapshot("new", { a: "new" }));

    expect(historyManager.canRedo()).toBe(false);
    expect(historyManager.getCurrent()?.id).toBe("new");
  });

  it("should handle getById with non-existent ID", () => {
    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));

    expect(historyManager.getById("non-existent")).toBeNull();
  });

  it("should handle getStats with empty history", () => {
    const stats = historyManager.getStats();

    expect(stats.totalSnapshots).toBe(0);
    expect(stats.pastCount).toBe(0);
    expect(stats.futureCount).toBe(0);
    expect(stats.hasCurrent).toBe(false);
  });

  it("should handle subscribe and unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = historyManager.subscribe(listener);

    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));

    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();

    historyManager.add(TestHelper.generateSnapshot("2", { a: 2 }));

    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle clear with listeners", () => {
    const listener = vi.fn();
    historyManager.subscribe(listener);

    historyManager.add(TestHelper.generateSnapshot("1", { a: 1 }));
    historyManager.clear();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "change",
        operation: expect.objectContaining({ type: "clear" }),
      }),
    );
  });
});
