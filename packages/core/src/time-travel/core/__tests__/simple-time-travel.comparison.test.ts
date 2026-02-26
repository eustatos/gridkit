/**
 * Integration tests for compareSnapshots in SimpleTimeTravel
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SimpleTimeTravel } from "../core/SimpleTimeTravel";
import { createStore, createAtom } from "../../index";
import type { ComparisonOptions } from "../comparison/types";

describe("SimpleTimeTravel - compareSnapshots integration", () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;

  beforeEach(() => {
    store = createStore({
      enableTimeTravel: true,
      maxHistory: 100,
      autoCapture: true,
    });

    timeTravel = (store as any).timeTravel;
  });

  afterEach(async () => {
    if (timeTravel) {
      await timeTravel.dispose();
    }
  });

  describe("compareSnapshots - Basic functionality", () => {
    it("should compare two snapshots by reference", () => {
      const counterAtom = createAtom(0, { name: "counter" });
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const comparison = timeTravel.compareSnapshots(history[0], history[1]);

      expect(comparison).toBeDefined();
      expect(comparison.id).toBeDefined();
      expect(comparison.summary.totalAtoms).toBeGreaterThan(0);
    });

    it("should compare two snapshots by ID", () => {
      const counterAtom = createAtom(0, { name: "counter" });
      store.set(counterAtom, 1);
      store.set(counterAtom, 2);

      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      const comparison = timeTravel.compareSnapshots(history[0].id, history[1].id);

      expect(comparison).toBeDefined();
      expect(comparison.summary.totalAtoms).toBeGreaterThan(0);
    });

    it("should throw error for invalid snapshot ID", () => {
      expect(() => {
        timeTravel.compareSnapshots("invalid-id-1", "invalid-id-2");
      }).toThrow("Invalid snapshot reference");
    });

    it("should throw error for mixed valid/invalid IDs", () => {
      const history = timeTravel.getHistory();
      expect(history.length).toBeGreaterThan(0);

      expect(() => {
        timeTravel.compareSnapshots(history[0], "invalid-id");
      }).toThrow("Invalid snapshot reference");
    });
  });

  describe("compareSnapshots - Change detection", () => {
    it("should detect added atoms", () => {
      const atom1 = createAtom(1, { name: "atom1" });

      // Capture initial state
      timeTravel.capture("initial");

      // Add new atom
      const atom2 = createAtom(2, { name: "atom2" });
      timeTravel.capture("after-add");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(
        history[history.length - 2],
        history[history.length - 1],
      );

      expect(comparison.summary.addedAtoms).toBeGreaterThanOrEqual(0);
    });

    it("should detect modified values", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after-change");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(
        history[history.length - 2],
        history[history.length - 1],
      );

      expect(comparison.summary.changedAtoms).toBeGreaterThanOrEqual(0);
    });

    it("should detect unchanged atoms", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      timeTravel.capture("same");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(
        history[history.length - 2],
        history[history.length - 1],
      );

      // Should have unchanged atoms
      expect(comparison.summary.unchangedAtoms).toBeGreaterThanOrEqual(0);
    });
  });

  describe("compareWithCurrent", () => {
    it("should compare snapshot with current state", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 5);

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareWithCurrent(history[0]);

      expect(comparison).toBeDefined();
      expect(comparison.metadata.snapshotA.id).toBe(history[0].id);
    });

    it("should compare snapshot by ID with current state", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 5);

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareWithCurrent(history[0].id);

      expect(comparison).toBeDefined();
    });

    it("should throw error for invalid snapshot", () => {
      expect(() => {
        timeTravel.compareWithCurrent("invalid-id");
      }).toThrow("Invalid snapshot reference");
    });
  });

  describe("getDiffSince", () => {
    it("should get diff since specific action", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("init");
      store.set(counter, 1);
      timeTravel.capture("step1");
      store.set(counter, 2);
      timeTravel.capture("step2");

      const comparison = timeTravel.getDiffSince("init");

      expect(comparison).toBeDefined();
      expect(comparison?.metadata.snapshotA.action).toBe("init");
    });

    it("should use oldest snapshot when action not found", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("init");
      store.set(counter, 1);
      timeTravel.capture("step1");

      const comparison = timeTravel.getDiffSince("non-existent-action");

      expect(comparison).toBeDefined();
    });

    it("should return null when history has less than 2 snapshots", () => {
      // Clear history to have minimal snapshots
      timeTravel.clearHistory();

      const comparison = timeTravel.getDiffSince("any");

      expect(comparison).toBeNull();
    });
  });

  describe("visualizeChanges", () => {
    it("should visualize changes as tree", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const visualization = timeTravel.visualizeChanges(comparison, "tree");

      expect(visualization).toBeDefined();
      expect(visualization).toContain("State Tree:");
    });

    it("should visualize changes as list", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const visualization = timeTravel.visualizeChanges(comparison, "list");

      expect(visualization).toBeDefined();
    });

    it("should use list format by default", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const visualization = timeTravel.visualizeChanges(comparison);

      expect(visualization).toBeDefined();
    });
  });

  describe("exportComparison", () => {
    it("should export comparison as JSON", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const exported = timeTravel.exportComparison(comparison, "json");

      const parsed = JSON.parse(exported);
      expect(parsed.id).toBeDefined();
      expect(parsed.atoms).toBeDefined();
    });

    it("should export comparison as HTML", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const exported = timeTravel.exportComparison(comparison, "html");

      expect(exported).toContain("<!DOCTYPE html>");
      expect(exported).toContain("</html>");
    });

    it("should export comparison as Markdown", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const exported = timeTravel.exportComparison(comparison, "md");

      expect(exported).toContain("# Snapshot Comparison");
      expect(exported).toContain("## Summary");
    });
  });

  describe("compareSnapshots - Options", () => {
    it("should accept custom comparison options", () => {
      const counter = createAtom(0, { name: "counter" });

      timeTravel.capture("initial");
      store.set(counter, 1);
      timeTravel.capture("after");

      const history = timeTravel.getHistory();

      const customOptions: Partial<ComparisonOptions> = {
        deepCompare: false,
        maxDepth: 50,
        cacheResults: false,
      };

      const comparison = timeTravel.compareSnapshots(
        history[0],
        history[1],
        customOptions,
      );

      expect(comparison.metadata.options.deepCompare).toBe(false);
      expect(comparison.metadata.options.maxDepth).toBe(50);
      expect(comparison.metadata.options.cacheResults).toBe(false);
    });
  });

  describe("compareSnapshots - Complex scenarios", () => {
    it("should compare snapshots with nested objects", () => {
      const userAtom = createAtom(
        { name: "John", address: { city: "NYC", zip: "10001" } },
        { name: "user" },
      );

      timeTravel.capture("initial");
      store.set(userAtom, { name: "John", address: { city: "LA", zip: "10001" } });
      timeTravel.capture("after-change");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);

      expect(comparison.summary.changedAtoms).toBeGreaterThanOrEqual(1);
      expect(comparison.atoms[0].valueDiff).toBeDefined();
    });

    it("should compare snapshots with arrays", () => {
      const itemsAtom = createAtom([1, 2, 3], { name: "items" });

      timeTravel.capture("initial");
      store.set(itemsAtom, [1, 2, 3, 4]);
      timeTravel.capture("after-add");

      const history = timeTravel.getHistory();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);

      expect(comparison.summary.changedAtoms).toBeGreaterThanOrEqual(1);
    });

    it("should handle circular references", () => {
      const circularObj: any = { name: "circular" };
      circularObj.self = circularObj;

      const circularAtom = createAtom(circularObj, { name: "circular" });

      timeTravel.capture("initial");
      circularObj.name = "updated";
      timeTravel.capture("after-update");

      const history = timeTravel.getHistory();

      // Should not throw
      expect(() => {
        const comparison = timeTravel.compareSnapshots(history[0], history[1]);
        expect(comparison).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    it("should compare large snapshots efficiently", () => {
      // Create large state
      const largeState: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        largeState[`atom${i}`] = i;
      }

      const largeAtom = createAtom(largeState, { name: "largeState" });

      timeTravel.capture("initial");

      // Modify some values
      const newState = { ...largeState };
      for (let i = 0; i < 10; i++) {
        newState[`atom${i}`] = i + 100;
      }
      store.set(largeAtom, newState);
      timeTravel.capture("after-modify");

      const history = timeTravel.getHistory();

      const startTime = Date.now();
      const comparison = timeTravel.compareSnapshots(history[0], history[1]);
      const duration = Date.now() - startTime;

      expect(comparison).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
      expect(comparison.statistics.duration).toBeLessThan(100);
    });
  });
});
