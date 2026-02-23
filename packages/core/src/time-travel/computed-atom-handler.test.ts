import { describe, it, expect, vi } from "vitest";
import { atom, atomRegistry } from "../index";
import { ComputedAtomHandler } from "./computed-atom-handler";

describe("ComputedAtomHandler", () => {
  let handler: ComputedAtomHandler;

  beforeEach(() => {
    atomRegistry.clear();
    handler = new ComputedAtomHandler(atomRegistry);
  });

  describe("saveComputedAtomValues", () => {
    it("should save computed atom values", () => {
      const baseAtom = atom(10, "base");
      const computedAtom = atom((get) => get(baseAtom) * 2, "computed");

      const values = handler.saveComputedAtomValues();
      
      expect(values).toBeDefined();
    });

    it("should handle empty registry", () => {
      atomRegistry.clear();
      const values = handler.saveComputedAtomValues();
      
      expect(values).toEqual({});
    });

    it("should handle computed atom errors", () => {
      const errorAtom = atom(() => {
        throw new Error("Compute error");
      }, "error");

      const values = handler.saveComputedAtomValues();
      expect(values).toBeDefined();
    });
  });

  describe("needsRecomputation", () => {
    it("should return false for non-existent atom", () => {
      const result = handler.needsRecomputation("non-existent");
      expect(result).toBe(false);
    });

    it("should return true when no cached info", () => {
      const baseAtom = atom(10, "base");
      const computedAtom = atom((get) => get(baseAtom) * 2, "computed");

      const result = handler.needsRecomputation(computedAtom.id.toString());
      expect(result).toBe(true);
    });

    it("should handle valid cached info", () => {
      const baseAtom = atom(10, "base");
      const computedAtom = atom((get) => get(baseAtom) * 2, "computed");

      // First call populates cache
      handler.needsRecomputation(computedAtom.id.toString());

      // Second call should use cache
      const result = handler.needsRecomputation(computedAtom.id.toString());
      expect(typeof result).toBe("boolean");
    });
  });

  describe("handleCircularDependencies", () => {
    it("should handle empty array", () => {
      const result = handler.handleCircularDependencies([]);
      expect(result).toBe(true);
    });

    it("should handle single atom", () => {
      const result = handler.handleCircularDependencies(["atom1"]);
      expect(result).toBe(true);
    });

    it("should handle multiple atoms", () => {
      const result = handler.handleCircularDependencies(["atom1", "atom2", "atom3"]);
      expect(result).toBe(true);
    });
  });

  describe("validateComputedAtoms", () => {
    it("should validate all computed atoms", () => {
      const baseAtom = atom(10, "base");
      const computedAtom = atom((get) => get(baseAtom) * 2, "computed");

      const result = handler.validateComputedAtoms();
      expect(result).toBe(true);
    });

    it("should handle empty registry", () => {
      atomRegistry.clear();
      const result = handler.validateComputedAtoms();
      expect(result).toBe(true);
    });

    it("should handle invalid computed atoms", () => {
      const errorAtom = atom(() => {
        throw new Error("Compute error");
      }, "error");

      const result = handler.validateComputedAtoms();
      expect(result).toBe(false);
    });
  });

  describe("serializeValue", () => {
    it("should serialize primitive values", () => {
      const result = (handler as any).serializeValue(42);
      expect(result).toBe(42);
    });

    it("should serialize string values", () => {
      const result = (handler as any).serializeValue("test");
      expect(result).toBe("test");
    });

    it("should serialize object values", () => {
      const result = (handler as any).serializeValue({ key: "value" });
      expect(result).toBe("__serialized__{\"key\":\"value\"}");
    });

    it("should handle serialization errors", () => {
      const circular: any = {};
      circular.self = circular;

      const result = (handler as any).serializeValue(circular);
      expect(result).toBe(circular); // Returns original on error
    });
  });

  describe("deserializeValue", () => {
    it("should deserialize primitive values", () => {
      const result = (handler as any).deserializeValue(42);
      expect(result).toBe(42);
    });

    it("should deserialize __serialized__ format", () => {
      const result = (handler as any).deserializeValue("__serialized__{\"key\":\"value\"}");
      expect(result).toEqual({ key: "value" });
    });

    it("should return original on parse error", () => {
      const result = (handler as any).deserializeValue("__serialized__invalid");
      expect(result).toBe("__serialized__invalid");
    });
  });

  describe("updateComputedAtomCache", () => {
    it("should update cache with values", () => {
      const baseAtom = atom(10, "base");
      const computedAtom = atom((get) => get(baseAtom) * 2, "computed");

      const computedValues = {
        [computedAtom.id.toString()]: "__serialized__20"
      };

      handler.updateComputedAtomCache(computedValues);
      
      const info = handler.getComputedAtomInfo(computedAtom.id.toString());
      expect(info).toBeDefined();
    });

    it("should clear cache before updating", () => {
      const baseAtom = atom(10, "base");
      const computedAtom = atom((get) => get(baseAtom) * 2, "computed");

      const computedValues = {
        [computedAtom.id.toString()]: "__serialized__20"
      };

      handler.updateComputedAtomCache(computedValues);
      handler.updateComputedAtomCache({});

      const info = handler.getComputedAtomInfo(computedAtom.id.toString());
      expect(info).toBeUndefined();
    });
  });

  describe("clearCache", () => {
    it("should clear computed atom cache", () => {
      const baseAtom = atom(10, "base");
      const computedAtom = atom((get) => get(baseAtom) * 2, "computed");

      const computedValues = {
        [computedAtom.id.toString()]: "__serialized__20"
      };

      handler.updateComputedAtomCache(computedValues);
      expect(handler.getComputedAtomInfo(computedAtom.id.toString())).toBeDefined();

      handler.clearCache();
      expect(handler.getComputedAtomInfo(computedAtom.id.toString())).toBeUndefined();
    });
  });

  describe("getComputedAtomInfo", () => {
    it("should return undefined for non-existent atom", () => {
      const info = handler.getComputedAtomInfo("non-existent");
      expect(info).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle null values", () => {
      const result = (handler as any).serializeValue(null);
      expect(result).toBeNull();
    });

    it("should handle undefined values", () => {
      const result = (handler as any).serializeValue(undefined);
      expect(result).toBeUndefined();
    });

    it("should handle function values", () => {
      const func = () => 42;
      const result = (handler as any).serializeValue(func);
      expect(result).toContain("Function");
    });
  });
});
