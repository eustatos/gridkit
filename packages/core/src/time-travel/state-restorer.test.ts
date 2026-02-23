import { describe, it, expect, vi } from "vitest";
import { atom, atomRegistry } from "../index";
import { StateSnapshotManager } from "./state-snapshot";
import { StateRestorer } from "./state-restorer";

describe("StateRestorer", () => {
  let manager: StateSnapshotManager;
  let restorer: StateRestorer;

  beforeEach(() => {
    atomRegistry.clear();
    manager = new StateSnapshotManager(atomRegistry);
    restorer = new StateRestorer(atomRegistry);
  });

  describe("constructor", () => {
    it("should create restorer with registry", () => {
      const restorer = new StateRestorer(atomRegistry);
      expect(restorer).toBeDefined();
    });
  });

  describe("deserializeValue", () => {
    it("should deserialize primitive values", () => {
      const result = (restorer as any).deserializeValue(42);
      expect(result).toBe(42);
    });

    it("should deserialize string values", () => {
      const result = (restorer as any).deserializeValue("test");
      expect(result).toBe("test");
    });

    it("should handle __serialized__ format", () => {
      const serialized = "__serialized__{\"key\":\"value\"}";
      const result = (restorer as any).deserializeValue(serialized);
      expect(result).toEqual({ key: "value" });
    });

    it("should return original value if deserialization fails", () => {
      const result = (restorer as any).deserializeValue("__serialized__invalid json");
      expect(result).toBe("__serialized__invalid json");
    });
  });

  describe("handleVersionMismatch", () => {
    it("should handle version mismatch gracefully", () => {
      const snapshot = manager.createSnapshot("test");
      snapshot.metadata.version = "0.9.0"; // Different version

      const result = restorer.handleVersionMismatch(snapshot);
      expect(result).toBe(true);
    });

    it("should handle same version", () => {
      const snapshot = manager.createSnapshot("test");

      const result = restorer.handleVersionMismatch(snapshot);
      expect(result).toBe(true);
    });
  });

  describe("validateSnapshot", () => {
    it("should validate snapshot with all fields", () => {
      const snapshot = manager.createSnapshot("test");
      const isValid = (restorer as any).validateSnapshot(snapshot);
      expect(isValid).toBe(true);
    });

    it("should invalidate snapshot without id", () => {
      const invalidSnapshot = {
        state: {},
        metadata: { timestamp: 0 }
      } as any;

      const isValid = (restorer as any).validateSnapshot(invalidSnapshot);
      expect(isValid).toBe(false);
    });

    it("should invalidate snapshot without state", () => {
      const invalidSnapshot = {
        id: "test",
        metadata: { timestamp: 0 }
      } as any;

      const isValid = (restorer as any).validateSnapshot(invalidSnapshot);
      expect(isValid).toBe(false);
    });

    it("should invalidate snapshot without metadata", () => {
      const invalidSnapshot = {
        id: "test",
        state: {}
      } as any;

      const isValid = (restorer as any).validateSnapshot(invalidSnapshot);
      expect(isValid).toBe(false);
    });
  });

  describe("restoreFromSnapshot", () => {
    it("should return false for invalid snapshot", () => {
      const invalidSnapshot = {
        id: "invalid",
        state: null,
        metadata: { timestamp: 0, version: "1.0.0" }
      } as any;

      const result = restorer.restoreFromSnapshot(invalidSnapshot);
      expect(result).toBe(false);
    });

    it("should return false for snapshot missing required fields", () => {
      const incompleteSnapshot = {
        id: "incomplete"
      } as any;

      const result = restorer.restoreFromSnapshot(incompleteSnapshot);
      expect(result).toBe(false);
    });

    it("should handle null snapshot", () => {
      const result = restorer.restoreFromSnapshot(null as any);
      expect(result).toBe(false);
    });

    it("should handle snapshot with missing atoms", () => {
      const snapshot = {
        id: "missing",
        state: {
          "nonexistent-id": { value: 42, type: "primitive" }
        },
        metadata: { timestamp: Date.now(), version: "1.0.0" }
      };

      // Note: This may return false because the snapshot validation requires
      // the state to have atom IDs that exist in the registry
      const result = restorer.restoreFromSnapshot(snapshot);
      expect(result).toBe(false); // Expected behavior
    });
  });

  describe("validateRestoredState", () => {
    it("should validate empty state", () => {
      const result = (restorer as any).validateRestoredState();
      expect(result).toBe(true);
    });
  });

  describe("recomputeDerivedAtoms", () => {
    it("should handle empty registry", () => {
      // Just verify it doesn't throw
      expect(() => (restorer as any).recomputeDerivedAtoms()).not.toThrow();
    });
  });

  describe("restoreAtomValues", () => {
    it("should handle empty state", () => {
      // Just verify it doesn't throw
      expect(() => (restorer as any).restoreAtomValues({})).not.toThrow();
    });
  });

  describe("restoreComputedAtomValues", () => {
    it("should handle empty state", () => {
      // Just verify it doesn't throw
      expect(() => (restorer as any).restoreComputedAtomValues({})).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined value", () => {
      const result = (restorer as any).deserializeValue(undefined);
      expect(result).toBeUndefined();
    });

    it("should handle null value", () => {
      const result = (restorer as any).deserializeValue(null);
      expect(result).toBeNull();
    });
  });
});
