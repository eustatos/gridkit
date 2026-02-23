import { describe, it, expect, vi } from "vitest";
import { atom, atomRegistry } from "../index";
import { StateSnapshotManager } from "./state-snapshot";

describe("StateSnapshotManager", () => {
  describe("constructor", () => {
    it("should create manager with default options", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      expect(manager).toBeDefined();
      expect(manager.getMaxHistoryLength()).toBe(50);
    });

    it("should create manager with custom options", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 10 });
      expect(manager).toBeDefined();
      expect(manager.getMaxHistoryLength()).toBe(10);
    });
  });

  describe("getMaxHistoryLength", () => {
    it("should return max history length", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 25 });
      expect(manager.getMaxHistoryLength()).toBe(25);
    });
  });

  describe("setMaxHistoryLength", () => {
    it("should set max history length", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 5 });
      manager.setMaxHistoryLength(10);
      expect(manager.getMaxHistoryLength()).toBe(10);
    });

    it("should trim snapshots when reducing limit", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 5 });
      
      for (let i = 0; i < 3; i++) {
        manager.createSnapshot(`snapshot-${i}`);
      }

      manager.setMaxHistoryLength(2);
      
      const snapshots = manager.getAllSnapshots();
      expect(snapshots.length).toBe(2);
    });
  });

  describe("createSnapshot", () => {
    it("should create snapshot", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      
      const snapshot = manager.createSnapshot("test action", "stack trace");
      
      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.state).toBeDefined();
      expect(snapshot.metadata).toBeDefined();
    });

    it("should include action name in metadata", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot("test action");

      expect(snapshot.metadata.actionName).toBe("test action");
    });

    it("should include stack trace if provided", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot("test", "custom stack trace");

      expect(snapshot.metadata.stackTrace).toBe("custom stack trace");
    });

    it("should include timestamp in metadata", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot();

      expect(snapshot.metadata.timestamp).toBeDefined();
      expect(snapshot.metadata.timestamp).toBeGreaterThan(0);
    });

    it("should include version in metadata", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot();

      expect(snapshot.metadata.version).toBe("1.0.0");
    });

    it("should generate unique snapshot IDs", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot1 = manager.createSnapshot();
      const snapshot2 = manager.createSnapshot();

      expect(snapshot1.id).not.toBe(snapshot2.id);
    });

    it("should handle empty registry", () => {
      atomRegistry.clear();
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot();

      expect(snapshot.state).toEqual({});
      expect(snapshot.computedValues).toEqual({});
    });
  });

  describe("snapshot management", () => {
    it("should get snapshot by ID", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot("test");

      const retrieved = manager.getSnapshotById(snapshot.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(snapshot.id);
    });

    it("should return undefined for non-existent snapshot", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.getSnapshotById("non-existent-id");
      
      expect(snapshot).toBeUndefined();
    });

    it("should get all snapshots", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      manager.createSnapshot("snapshot 1");
      manager.createSnapshot("snapshot 2");
      manager.createSnapshot("snapshot 3");

      const allSnapshots = manager.getAllSnapshots();
      expect(allSnapshots.length).toBe(3);
    });

    it("should clear all snapshots", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      manager.createSnapshot("snapshot 1");
      manager.createSnapshot("snapshot 2");

      expect(manager.getAllSnapshots().length).toBe(2);

      manager.clearSnapshots();
      expect(manager.getAllSnapshots().length).toBe(0);
    });
  });

  describe("max history limit", () => {
    it("should respect max history length", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 2 });
      manager.createSnapshot("snapshot 1");
      manager.createSnapshot("snapshot 2");
      manager.createSnapshot("snapshot 3");

      const allSnapshots = manager.getAllSnapshots();
      expect(allSnapshots.length).toBe(2);
    });

    it("should remove oldest snapshots when limit exceeded", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 2 });
      manager.createSnapshot("first");
      manager.createSnapshot("second");

      const allSnapshots = manager.getAllSnapshots();
      expect(allSnapshots[0]?.metadata.actionName).toBe("first");

      manager.createSnapshot("third");
      
      const allSnapshots2 = manager.getAllSnapshots();
      expect(allSnapshots2[0]?.metadata.actionName).toBe("second");
      expect(allSnapshots2[1]?.metadata.actionName).toBe("third");
    });

    it("should allow changing max history", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 3 });
      manager.createSnapshot("1");
      manager.createSnapshot("2");
      manager.createSnapshot("3");

      manager.setMaxHistoryLength(2);
      
      const allSnapshots = manager.getAllSnapshots();
      expect(allSnapshots.length).toBe(2);
    });
  });

  describe("edge cases", () => {
    it("should handle zero max history by keeping empty snapshots", () => {
      // Note: Even with zero max history, the current implementation
      // adds the snapshot before trimming, so we get 1 snapshot
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 0 });
      
      manager.createSnapshot("snapshot 1");
      
      // The snapshot is added before checking the limit
      const allSnapshots = manager.getAllSnapshots();
      // After adding, length becomes 1, which is > 0, so it should be trimmed
      // But the trim happens after push, so we get 0
      expect(allSnapshots.length).toBe(0);
    });

    it("should handle very large max history", () => {
      const manager = new StateSnapshotManager(atomRegistry, { maxHistoryLength: 1000 });
      
      for (let i = 0; i < 100; i++) {
        manager.createSnapshot(`snapshot ${i}`);
      }

      const allSnapshots = manager.getAllSnapshots();
      expect(allSnapshots.length).toBe(100);
    });

    it("should handle no action name", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot();

      expect(snapshot.metadata.actionName).toBeUndefined();
    });

    it("should handle no stack trace", () => {
      const manager = new StateSnapshotManager(atomRegistry);
      const snapshot = manager.createSnapshot();

      expect(snapshot.metadata.stackTrace).toBeUndefined();
    });
  });
});
