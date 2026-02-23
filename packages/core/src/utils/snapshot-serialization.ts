/**
 * Snapshot serialization utilities for state persistence and time travel
 * Provides safe serialization and deserialization of complex state objects
 */

export type SerializableValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined 
  | SerializableValue[] 
  | { [key: string]: SerializableValue }
  | Date
  | RegExp;

export interface ObjectReference {
  id: string;
  type: string;
  path: string;
}

export interface SerializationContext {
  references: Map<any, ObjectReference>;
  serialized: Map<string, any>;
  circularRefs: Set<string>;
}

/**
 * Safely serialize complex objects for state snapshots
 * Handles circular references, functions, and special objects
 * @param obj - Object to serialize
 * @param context - Serialization context for handling references
 * @param depth - Current depth to prevent infinite recursion (internal use)
 * @returns Serializable representation of the object
 */
export function snapshotSerialization(obj: any, context?: SerializationContext, depth = 0): SerializableValue {
  const maxDepth = 50;
  if (depth > maxDepth) {
    return { __type: 'MaxDepthExceeded', __value: `Max depth ${maxDepth} reached` };
  }
  
  const ctx = context || {
    references: new Map(),
    serialized: new Map(),
    circularRefs: new Set()
  };
  
  // Handle primitive types
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'boolean' || typeof obj === 'number' || typeof obj === 'string') {
    return obj;
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return {
      __type: 'Date',
      value: obj.toISOString()
    };
  }
  
  // Handle RegExp objects
  if (obj instanceof RegExp) {
    return {
      __type: 'RegExp',
      source: obj.source,
      flags: obj.flags
    };
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => snapshotSerialization(item, ctx, depth + 1)) as SerializableValue[];
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    // Check for circular reference
    if (ctx.references.has(obj)) {
      const ref = ctx.references.get(obj)!;
      ctx.circularRefs.add(ref.id);
      return {
        __ref: ref.id
      };
    }
    
    // Create reference for this object
    const refId = generateObjectId(obj);
    const ref: ObjectReference = {
      id: refId,
      type: obj.constructor?.name || 'Object',
      path: ''
    };
    
    ctx.references.set(obj, ref);
    
    // Serialize object properties
    const result: Record<string, SerializableValue> = {
      __id: refId,
      __type: ref.type
    };
    
    for (const [key, value] of Object.entries(obj)) {
      try {
        result[key] = snapshotSerialization(value, ctx, depth + 1);
      } catch (error) {
        // Handle unserializable properties
        result[key] = {
          __error: 'Unserializable value',
          __type: typeof value
        };
      }
    }
    
    return result;
  }
  
  // Handle functions and other non-serializable types
  return {
    __type: typeof obj,
    __value: typeof obj === 'function' ? obj.toString() : String(obj)
  };
}

/**
 * Deserialize snapshot data back to objects
 * @param data - Serialized data
 * @param context - Deserialization context
 * @returns Deserialized object
 */
export function deserializeSnapshot(data: SerializableValue, context?: Map<string, any>): any {
  const ctx = context || new Map();
  
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'boolean' || typeof data === 'number' || typeof data === 'string') {
    return data;
  }
  
  // Handle special objects
  if (typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, any>;
    
    // Handle Date
    if (obj.__type === 'Date' && obj.value) {
      return new Date(obj.value);
    }
    
    // Handle RegExp
    if (obj.__type === 'RegExp' && obj.source) {
      return new RegExp(obj.source, obj.flags);
    }
    
    // Handle references
    if (obj.__ref && ctx.has(obj.__ref)) {
      return ctx.get(obj.__ref);
    }
    
    // Handle regular objects
    if (obj.__id) {
      // Check if already deserialized
      if (ctx.has(obj.__id)) {
        return ctx.get(obj.__id);
      }
      
      // Create new object
      const result: Record<string, any> = {};
      ctx.set(obj.__id, result);
      
      // Deserialize properties
      for (const [key, value] of Object.entries(obj)) {
        if (!key.startsWith('__')) {
          result[key] = deserializeSnapshot(value, ctx);
        }
      }
      
      return result;
    }
    
    // Handle regular object without ID
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deserializeSnapshot(value, ctx);
    }
    return result;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => deserializeSnapshot(item, ctx));
  }
  
  return data;
}

/**
 * Generate unique ID for objects
 * Uses simple random ID generation to avoid infinite loops
 * @param obj - Object to generate ID for
 * @returns Unique ID string
 */
function generateObjectId(obj: any): string {
  // Use simple random ID to avoid any potential infinite loops with JSON.stringify
  return `obj_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
}

/**
 * Check if value is serializable
 * Uses lightweight check without full serialization to avoid infinite loops
 * @param value - Value to check
 * @param depth - Current depth to prevent infinite recursion (internal use)
 * @param seen - Set of already seen objects to detect circular references
 * @returns True if value is serializable
 */
export function isSerializable(value: any, depth = 0, seen = new WeakSet<object>()): boolean {
  const maxDepth = 50;
  if (depth > maxDepth) {
    return false;
  }
  
  // Quick primitive checks
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return true;
  }
  
  // Date and RegExp are serializable
  if (value instanceof Date || value instanceof RegExp) {
    return true;
  }
  
  // Handle objects
  if (typeof value === 'object') {
    // Check for circular reference
    if (seen.has(value)) {
      // Circular reference detected - treat as serializable (handled by snapshotSerialization)
      return true;
    }
    
    // Mark this object as seen
    seen.add(value);
    
    // Arrays are serializable if their contents are
    if (Array.isArray(value)) {
      const result = value.every(item => isSerializable(item, depth + 1, seen));
      seen.delete(value); // Clean up
      return result;
    }
    
    // For plain objects, check if they have simple structure
    try {
      const keys = Object.keys(value);
      // Check if all keys are valid and values are primitives
      for (const key of keys.slice(0, 50)) { // Limit to first 50 keys
        const v = value[key];
        if (v === null || v === undefined) continue;
        if (typeof v === 'function') {
          seen.delete(value); // Clean up
          return false;
        }
        if (typeof v === 'object') {
          if (!isSerializable(v, depth + 1, seen)) {
            seen.delete(value); // Clean up
            return false;
          }
        }
      }
      seen.delete(value); // Clean up
      return true;
    } catch {
      seen.delete(value); // Clean up
      return false;
    }
  }
  
  // Functions are not serializable
  if (typeof value === 'function') {
    return false;
  }
  
  return false;
}