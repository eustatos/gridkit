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

  // Handle dates
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle regular objects
  const cloned: any = {};
  const seen = new WeakMap();

  const stack = [{ original: obj, cloned }];

  while (stack.length > 0) {
    const { original, cloned } = stack.pop()!;

    // Track visited objects for circular references
    seen.set(original, cloned);

    for (const key in original) {
      if (Object.prototype.hasOwnProperty.call(original, key)) {
        const value = original[key];

        // Handle circular references
        if (value && typeof value === 'object') {
          if (seen.has(value)) {
            cloned[key] = seen.get(value);
            continue;
          }

          // Create new object/array
          let newValue: any;
          if (Array.isArray(value)) {
            newValue = [];
          } else if (value instanceof Date) {
            newValue = new Date(value.getTime());
          } else {
            newValue = {};
          }

          cloned[key] = newValue;
          stack.push({ original: value, cloned: newValue });
        } else {
          // Primitive value
          cloned[key] = value;
        }
      }
    }
  }

  return cloned as T;
}