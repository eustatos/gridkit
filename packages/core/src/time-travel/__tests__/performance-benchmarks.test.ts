/**
 * Performance Benchmarks Test
 * Measures performance metrics for time travel operations
 */

import { describe, it, expect, beforeAll } from "vitest";
import { SimpleTimeTravel } from "../core/SimpleTimeTravel";
import { TestHelper, calculateMetrics } from "./utils/test-helpers";
import type { Store, Atom } from "../../types";
import { atomRegistry } from "../../atom-registry";

interface BenchmarkMetrics {
  capture: { avg: number; p95: number; max: number };
  undo: { avg: number; p95: number; max: number };
  redo: { avg: number; p95: number; max: number };
  jumpTo: { avg: number; p95: number; max: number };
}

describe("Performance Benchmarks", () => {
  const BENCHMARK_CONFIG = {
    iterations: 1000,
    atomCounts: [10, 100, 1000, 10000] as const,
    operations: ["capture", "undo", "redo", "jumpTo"] as const,
  };

  async function runBenchmark(atomCount: number): Promise<BenchmarkMetrics> {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Create atoms
    for (let i = 0; i < atomCount; i++) {
      const atom = TestHelper.generateAtom(`atom-${i}`);
      atomRegistry.register(atom, `atom-${i}`);
      store.set(atom, { index: i, value: "x".repeat(10) });
    }

    const metrics: BenchmarkMetrics = {
      capture: { avg: 0, p95: 0, max: 0 },
      undo: { avg: 0, p95: 0, max: 0 },
      redo: { avg: 0, p95: 0, max: 0 },
      jumpTo: { avg: 0, p95: 0, max: 0 },
    };

    // Measure capture
    const captureTimes: number[] = [];
    for (let i = 0; i < BENCHMARK_CONFIG.iterations; i++) {
      const start = Date.now();
      timeTravel.capture(`bench-${i}`);
      captureTimes.push(Date.now() - start);
    }

    metrics.capture = calculateMetrics(captureTimes);

    // Measure undo
    const undoTimes: number[] = [];
    for (let i = 0; i < Math.min(100, timeTravel.getHistory().length - 1); i++) {
      const start = Date.now();
      timeTravel.undo();
      undoTimes.push(Date.now() - start);
    }

    if (undoTimes.length > 0) {
      metrics.undo = calculateMetrics(undoTimes);
    }

    // Measure redo
    const redoTimes: number[] = [];
    for (let i = 0; i < Math.min(100, timeTravel.getHistory().length - 1); i++) {
      const start = Date.now();
      timeTravel.redo();
      redoTimes.push(Date.now() - start);
    }

    if (redoTimes.length > 0) {
      metrics.redo = calculateMetrics(redoTimes);
    }

    // Measure jumpTo
    const jumpToTimes: number[] = [];
    const historyLength = timeTravel.getHistory().length;
    for (let i = 0; i < Math.min(100, historyLength); i++) {
      const targetIndex = Math.floor(Math.random() * historyLength);
      const start = Date.now();
      timeTravel.jumpTo(targetIndex);
      jumpToTimes.push(Date.now() - start);
    }

    if (jumpToTimes.length > 0) {
      metrics.jumpTo = calculateMetrics(jumpToTimes);
    }

    // Cleanup
    await timeTravel.dispose();
    atomRegistry.clear();

    return metrics;
  }

  BENCHMARK_CONFIG.atomCounts.forEach((count) => {
    it(`should perform well with ${count} atoms`, async () => {
      const metrics = await runBenchmark(count);

      // Performance thresholds (may need adjustment based on actual performance)
      expect(metrics.capture.avg).toBeLessThan(50);
      expect(metrics.undo.avg).toBeLessThan(20);
      expect(metrics.redo.avg).toBeLessThan(20);
      expect(metrics.jumpTo.avg).toBeLessThan(30);

      console.log(`Benchmark for ${count} atoms:`, metrics);
    }, 60000); // 60 second timeout for large atom counts
  });

  it("should measure capture performance scaling", async () => {
    const results: { atomCount: number; captureAvg: number }[] = [];

    for (const count of BENCHMARK_CONFIG.atomCounts.slice(0, 3)) {
      const store = TestHelper.createTestStore();
      const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

      for (let i = 0; i < count; i++) {
        const atom = TestHelper.generateAtom(`scale-${i}`);
        atomRegistry.register(atom, `scale-${i}`);
        store.set(atom, { index: i, value: "x".repeat(10) });
      }

      const captureTimes: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        timeTravel.capture(`scale-${i}`);
        captureTimes.push(Date.now() - start);
      }

      const avg = captureTimes.reduce((a, b) => a + b, 0) / captureTimes.length;
      results.push({ atomCount: count, captureAvg: avg });

      await timeTravel.dispose();
      atomRegistry.clear();
    }

    // Verify that performance scales reasonably
    // Each step should not be more than 10x slower than the previous
    for (let i = 1; i < results.length; i++) {
      const ratio = results[i].captureAvg / results[i - 1].captureAvg;
      expect(ratio).toBeLessThan(10);
    }

    console.log("Capture performance scaling:", results);
  }, 60000);

  it("should measure memory usage during operations", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 50,
      autoCapture: true,
    });

    const atoms: Atom<unknown>[] = [];
    for (let i = 0; i < 100; i++) {
      const atom = TestHelper.generateAtom(`mem-${i}`);
      atomRegistry.register(atom, `mem-${i}`);
      store.set(atom, { index: i, data: "x".repeat(100) });
      atoms.push(atom);
    }

    const memoryBefore = process.memoryUsage();

    // Perform operations
    for (let i = 0; i < 100; i++) {
      atoms.forEach((atom) => {
        store.set(atom, { index: i, data: "x".repeat(100) });
      });
    }

    const memoryAfter = process.memoryUsage();

    const memoryGrowth = {
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
      heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
      rss: memoryAfter.rss - memoryBefore.rss,
    };

    // Memory growth should be reasonable
    expect(memoryGrowth.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB

    console.log("Memory growth:", memoryGrowth);

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);

  it("should measure undo/redo chain performance", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: true,
    });

    const counterAtom = TestHelper.generateAtom("counter", "writable");
    atomRegistry.register(counterAtom, "counter");

    // Create history chain
    for (let i = 0; i < 100; i++) {
      store.set(counterAtom, i);
    }

    const times: { undo: number[]; redo: number[] } = {
      undo: [],
      redo: [],
    };

    // Measure full undo chain
    while (timeTravel.canUndo()) {
      const start = Date.now();
      timeTravel.undo();
      times.undo.push(Date.now() - start);
    }

    // Measure full redo chain
    while (timeTravel.canRedo()) {
      const start = Date.now();
      timeTravel.redo();
      times.redo.push(Date.now() - start);
    }

    const undoMetrics = calculateMetrics(times.undo);
    const redoMetrics = calculateMetrics(times.redo);

    // Performance should be consistent
    expect(undoMetrics.avg).toBeLessThan(5);
    expect(redoMetrics.avg).toBeLessThan(5);

    console.log("Undo/redo chain performance:", {
      undo: undoMetrics,
      redo: redoMetrics,
    });

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);

  it("should measure jumpTo performance at different indices", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: true,
    });

    const counterAtom = TestHelper.generateAtom("counter", "writable");
    atomRegistry.register(counterAtom, "counter");

    // Create history
    for (let i = 0; i < 100; i++) {
      store.set(counterAtom, i);
    }

    const times: number[] = [];
    const indices = [0, 25, 50, 75, 99];

    // Measure jumpTo at different positions
    for (const index of indices) {
      const start = Date.now();
      timeTravel.jumpTo(index);
      times.push(Date.now() - start);
    }

    const metrics = calculateMetrics(times);

    // JumpTo should be fast regardless of position
    expect(metrics.max).toBeLessThan(10);

    console.log("JumpTo performance at different indices:", {
      indices,
      times,
      metrics,
    });

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);

  it("should measure snapshot comparison performance", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Create initial state
    for (let i = 0; i < 100; i++) {
      const atom = TestHelper.generateAtom(`compare-${i}`);
      atomRegistry.register(atom, `compare-${i}`);
      store.set(atom, { index: i, value: "initial" });
    }

    timeTravel.capture("initial");

    // Make changes
    for (let i = 0; i < 100; i++) {
      const atom = TestHelper.generateAtom(`compare-${i}`);
      store.set(atom, { index: i, value: "changed" });
    }

    timeTravel.capture("changed");

    const history = timeTravel.getHistory();

    // Measure comparison
    const compareTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      timeTravel.compareSnapshots(history[0], history[1]);
      compareTimes.push(Date.now() - start);
    }

    const metrics = calculateMetrics(compareTimes);

    expect(metrics.avg).toBeLessThan(50);

    console.log("Snapshot comparison performance:", metrics);

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);

  it("should measure visualization performance", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Create state with many changes
    for (let i = 0; i < 50; i++) {
      const atom = TestHelper.generateAtom(`viz-${i}`);
      atomRegistry.register(atom, `viz-${i}`);
      store.set(atom, { index: i, value: "before" });
    }

    timeTravel.capture("before");

    for (let i = 0; i < 50; i++) {
      const atom = TestHelper.generateAtom(`viz-${i}`);
      store.set(atom, { index: i, value: "after" });
    }

    timeTravel.capture("after");

    const history = timeTravel.getHistory();
    const comparison = timeTravel.compareSnapshots(history[0], history[1]);

    // Measure visualization
    const vizTimes: { tree: number[]; list: number[] } = {
      tree: [],
      list: [],
    };

    for (let i = 0; i < 10; i++) {
      let start = Date.now();
      timeTravel.visualizeChanges(comparison, "tree");
      vizTimes.tree.push(Date.now() - start);

      start = Date.now();
      timeTravel.visualizeChanges(comparison, "list");
      vizTimes.list.push(Date.now() - start);
    }

    const treeMetrics = calculateMetrics(vizTimes.tree);
    const listMetrics = calculateMetrics(vizTimes.list);

    expect(treeMetrics.avg).toBeLessThan(50);
    expect(listMetrics.avg).toBeLessThan(50);

    console.log("Visualization performance:", {
      tree: treeMetrics,
      list: listMetrics,
    });

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);

  it("should measure export performance", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Create state
    for (let i = 0; i < 50; i++) {
      const atom = TestHelper.generateAtom(`export-${i}`);
      atomRegistry.register(atom, `export-${i}`);
      store.set(atom, { index: i, value: "data" });
    }

    timeTravel.capture("before");

    for (let i = 0; i < 50; i++) {
      const atom = TestHelper.generateAtom(`export-${i}`);
      store.set(atom, { index: i, value: "changed" });
    }

    timeTravel.capture("after");

    const history = timeTravel.getHistory();
    const comparison = timeTravel.compareSnapshots(history[0], history[1]);

    // Measure export
    const exportTimes: { json: number[]; md: number[] } = {
      json: [],
      md: [],
    };

    for (let i = 0; i < 10; i++) {
      let start = Date.now();
      timeTravel.exportComparison(comparison, "json");
      exportTimes.json.push(Date.now() - start);

      start = Date.now();
      timeTravel.exportComparison(comparison, "md");
      exportTimes.md.push(Date.now() - start);
    }

    const jsonMetrics = calculateMetrics(exportTimes.json);
    const mdMetrics = calculateMetrics(exportTimes.md);

    expect(jsonMetrics.avg).toBeLessThan(50);
    expect(mdMetrics.avg).toBeLessThan(50);

    console.log("Export performance:", {
      json: jsonMetrics,
      md: mdMetrics,
    });

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);

  it("should measure transactional restoration performance", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Create state
    for (let i = 0; i < 100; i++) {
      const atom = TestHelper.generateAtom(`trans-${i}`);
      atomRegistry.register(atom, `trans-${i}`);
      store.set(atom, { index: i, value: "initial" });
    }

    timeTravel.capture("initial");

    for (let i = 0; i < 100; i++) {
      const atom = TestHelper.generateAtom(`trans-${i}`);
      store.set(atom, { index: i, value: "changed" });
    }

    timeTravel.capture("changed");

    const history = timeTravel.getHistory();

    // Measure transactional restoration
    const restoreTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await timeTravel.restoreWithTransaction(history[0].id);
      restoreTimes.push(Date.now() - start);
    }

    const metrics = calculateMetrics(restoreTimes);

    expect(metrics.avg).toBeLessThan(100);

    console.log("Transactional restoration performance:", metrics);

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);

  it("should measure cleanup performance", async () => {
    const store = TestHelper.createTestStore();
    const timeTravel = new SimpleTimeTravel(store, {
      autoCapture: false,
      atomTTL: 100, // Short TTL for testing
      gcInterval: 50,
    });

    // Create and track many atoms
    for (let i = 0; i < 100; i++) {
      const atom = TestHelper.generateAtom(`cleanup-${i}`);
      atomRegistry.register(atom, `cleanup-${i}`);
      store.set(atom, { index: i });
    }

    // Wait for atoms to become stale
    await TestHelper.wait(200);

    // Measure cleanup
    const start = Date.now();
    await timeTravel.cleanupAtoms(10);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000);

    console.log("Cleanup performance:", { duration });

    await timeTravel.dispose();
    atomRegistry.clear();
  }, 60000);
});
