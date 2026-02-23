/**
 * Deep clone with circular reference handling.
 */
export function deepClone<T>(obj: T): T {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  // Handle special objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as T;
  }

  if (obj instanceof Map) {
    const clonedMap = new Map();
    for (const [key, value] of obj) {
      clonedMap.set(deepClone(key), deepClone(value));
    }
    return clonedMap as T;
  }

  if (obj instanceof Set) {
    const clonedSet = new Set();
    for (const value of obj) {
      clonedSet.add(deepClone(value));
    }
    return clonedSet as T;
  }

  // Handle regular objects
  const cloned: Record<string | number | symbol, any> = {};
  const seen = new WeakMap<object, object>();

  // Stack entry type for circular reference tracking
  interface StackEntry {
    original: Record<string | number | symbol, any>;
    cloned: Record<string | number | symbol, any>;
  }

  const stack: StackEntry[] = [{ original: obj, cloned }];

  while (stack.length > 0) {
    const { original, cloned } = stack.pop() as StackEntry | undefined;

    if (!original || !cloned) continue;

    // Track visited objects for circular references
    seen.set(original, cloned);

    for (const key in original) {
      if (Object.prototype.hasOwnProperty.call(original, key)) {
        const value = original[key];

        // Handle circular references
        if (value && typeof value === 'object') {
          if (seen.has(value)) {
            const cached = seen.get(value);
            if (cached) {
              cloned[key] = cached;
            }
            continue;
          }

          // Create new object/array
          let newValue: any;
          if (Array.isArray(value)) {
            newValue = [];
          } else if (value instanceof Date) {
            newValue = new Date(value.getTime());
          } else if (value instanceof RegExp) {
            newValue = new RegExp(value.source, value.flags);
          } else if (value instanceof Map) {
            newValue = new Map();
            for (const [k, v] of value) {
              newValue.set(deepClone(k), deepClone(v));
            }
          } else if (value instanceof Set) {
            newValue = new Set();
            for (const v of value) {
              newValue.add(deepClone(v));
            }
          } else {
            newValue = {};
          }

          cloned[key] = newValue;
          stack.push({ original: value, cloned: newValue as object });
        } else {
          // Primitive value
          cloned[key] = value;
        }
      }
    }
  }

  // Only freeze the top-level object for immutability
  // Deep freezing can cause issues with nested updates
  Object.freeze(cloned);

  return cloned as T;
}