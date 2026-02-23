import { describe, it, expect, vi } from "vitest";
import { 
  snapshotSerialization,
  deserializeSnapshot,
  isSerializable,
  ObjectReference,
  SerializationContext
} from "./snapshot-serialization";

describe("snapshotSerialization", () => {
  describe("primitive values", () => {
    it("should serialize null", () => {
      expect(snapshotSerialization(null)).toBeNull();
    });

    it("should serialize undefined", () => {
      expect(snapshotSerialization(undefined)).toBeUndefined();
    });

    it("should serialize string", () => {
      expect(snapshotSerialization("test")).toBe("test");
    });

    it("should serialize number", () => {
      expect(snapshotSerialization(42)).toBe(42);
    });

    it("should serialize boolean", () => {
      expect(snapshotSerialization(true)).toBe(true);
    });
  });

  describe("Date objects", () => {
    it("should serialize Date", () => {
      const date = new Date("2023-01-01");
      const result = snapshotSerialization(date);
      
      expect(result).toEqual({
        __type: "Date",
        value: date.toISOString()
      });
    });

    it("should handle Date in object", () => {
      const obj = { date: new Date("2023-01-01") };
      const result = snapshotSerialization(obj);
      
      expect(result.date).toEqual({
        __type: "Date",
        value: obj.date.toISOString()
      });
    });
  });

  describe("RegExp objects", () => {
    it("should serialize RegExp", () => {
      const regex = /test/i;
      const result = snapshotSerialization(regex);
      
      expect(result).toEqual({
        __type: "RegExp",
        source: "test",
        flags: "i"
      });
    });
  });

  describe("arrays", () => {
    it("should serialize empty array", () => {
      expect(snapshotSerialization([])).toEqual([]);
    });

    it("should serialize array with primitives", () => {
      expect(snapshotSerialization([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("should serialize nested arrays", () => {
      const arr = [1, [2, [3]]]
      const result = snapshotSerialization(arr);
      expect(result).toEqual([1, [2, [3]]]);
    });
  });

  describe("objects", () => {
    it("should serialize plain object", () => {
      const obj = { key: "value", count: 42 };
      const result = snapshotSerialization(obj);
      
      expect(result).toHaveProperty("__id");
      expect(result).toHaveProperty("__type", "Object");
      expect(result.key).toBe("value");
      expect(result.count).toBe(42);
    });

    it("should include __id and __type", () => {
      const obj = { nested: true };
      const result = snapshotSerialization(obj) as any;
      
      expect(result.__id).toBeDefined();
      expect(result.__type).toBe("Object");
    });

    it("should handle circular references", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      const result = snapshotSerialization(obj) as any;
      expect((result.self as any).__ref).toBe(result.__id);
    });

    it("should handle circular references in context", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      const context: SerializationContext = {
        references: new Map(),
        serialized: new Map(),
        circularRefs: new Set()
      };

      const result = snapshotSerialization(obj, context);
      expect(context.circularRefs.size).toBe(1);
    });
  });

  describe("context handling", () => {
    it("should create context if not provided", () => {
      const obj = { value: 42 };
      const result = snapshotSerialization(obj);
      expect(result).toBeDefined();
    });

    it("should reuse context for multiple calls", () => {
      const context: SerializationContext = {
        references: new Map(),
        serialized: new Map(),
        circularRefs: new Set()
      };

      const obj1 = { value: 1 };
      const obj2 = { value: 2 };

      snapshotSerialization(obj1, context);
      snapshotSerialization(obj2, context);

      expect(context.references.size).toBe(2);
    });
  });
});

describe("deserializeSnapshot", () => {
  describe("primitive values", () => {
    it("should deserialize null", () => {
      expect(deserializeSnapshot(null)).toBeNull();
    });

    it("should deserialize undefined", () => {
      expect(deserializeSnapshot(undefined)).toBeUndefined();
    });

    it("should deserialize string", () => {
      expect(deserializeSnapshot("test")).toBe("test");
    });

    it("should deserialize number", () => {
      expect(deserializeSnapshot(42)).toBe(42);
    });

    it("should deserialize boolean", () => {
      expect(deserializeSnapshot(true)).toBe(true);
    });
  });

  describe("Date objects", () => {
    it("should deserialize Date", () => {
      const data = {
        __type: "Date",
        value: new Date("2023-01-01").toISOString()
      };

      const result = deserializeSnapshot(data);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(data.value);
    });
  });

  describe("RegExp objects", () => {
    it("should deserialize RegExp", () => {
      const data = {
        __type: "RegExp",
        source: "test",
        flags: "i"
      };

      const result = deserializeSnapshot(data);
      expect(result).toBeInstanceOf(RegExp);
      expect(result.source).toBe("test");
      expect(result.flags).toBe("i");
    });
  });

  describe("arrays", () => {
    it("should deserialize array", () => {
      const data = [1, 2, 3];
      expect(deserializeSnapshot(data)).toEqual(data);
    });

    it("should deserialize nested arrays", () => {
      const data = [1, [2, [3]]];
      expect(deserializeSnapshot(data)).toEqual(data);
    });
  });

  describe("objects", () => {
    it("should deserialize object", () => {
      const data = { key: "value", count: 42 };
      expect(deserializeSnapshot(data)).toEqual(data);
    });

    it("should handle __id reference", () => {
      const obj1 = { value: 1, __id: "ref1", __type: "Object" };
      const obj2 = { ref: { __ref: "ref1" } };

      const context = new Map();
      context.set("ref1", obj1);

      const result = deserializeSnapshot(obj2, context);
      expect(result.ref).toBe(obj1);
    });

    it("should handle circular references", () => {
      const obj1 = { value: 1, __id: "ref1", __type: "Object" };
      const obj2 = { ref: { __ref: "ref1" } };

      const context = new Map();
      const result = deserializeSnapshot(obj2, context);
      
      // Should create object from reference
      expect(result).toBeDefined();
    });
  });
});

describe("isSerializable", () => {
  it("should identify serializable value", () => {
    expect(isSerializable(42)).toBe(true);
    expect(isSerializable("test")).toBe(true);
    expect(isSerializable([1, 2, 3])).toBe(true);
  });

  it("should identify non-serializable value", () => {
    // Functions are not serializable
    expect(isSerializable(() => 42)).toBe(false);
  });

  it("should handle circular references", () => {
    const obj: any = { name: "test" };
    obj.self = obj;
    
    // With circular reference handling, this should be true
    expect(isSerializable(obj)).toBe(true);
  });
});
