/**
 * Shallow equality check for state comparison.
 * Optimized for common state shapes.
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  // Same reference
  if (a === b) return true;

  // Different types or null
  if (typeof a !== typeof b || a === null || b === null) {
    return false;
  }

  // Compare object keys
  if (typeof a === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if ((a as any)[key] !== (b as any)[key]) {
        return false;
      }
    }

    return true;
  }

  // Primitives
  return a === b;
}