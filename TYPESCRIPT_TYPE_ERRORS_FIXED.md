# TypeScript Type Compatibility Fixes

## Summary

Fixed type compatibility issues for `FilterOperator` and `ValidationContext` types as requested.

## Changes Made

### 1. FilterOperator Type (packages/core/src/types/table/TableState.ts)

**Issue:** FilterOperator type in core was missing several operators present in the data package.

**Fix:** Added missing operators to core's FilterOperator type:
- `'between'`
- `'in'`
- `'notIn'`
- `'custom'`

This ensures compatibility between core and data packages that use these operators.

**Before:**
```typescript
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual';
```

**After:**
```typescript
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'custom';
```

### 2. ValidationContext Type (packages/core/src/validation/schema/BaseTypes.ts)

**Issue:** ValidationContext interface was missing the optional `value` property that some validators may need.

**Fix:** Added optional `value` property to ValidationContext interface for backwards compatibility.

**Before:**
```typescript
export interface ValidationContext {
  readonly path: string[];
  readonly mode?: ValidationMode;
  meta?: Record<string, unknown>;
  readonly data?: unknown;
  readonly rowIndex?: number;
}
```

**After:**
```typescript
export interface ValidationContext {
  readonly path: string[];
  readonly mode?: ValidationMode;
  meta?: Record<string, unknown>;
  readonly data?: unknown;
  readonly rowIndex?: number;
  /**
   * Current value being validated (deprecated, use data + path).
   * @deprecated
   */
  value?: unknown;
}
```

### 3. Validator Length Checks (packages/core/src/validation/validators/Validators.ts)

**Issue:** TypeScript couldn't narrow types properly when checking string length in `minLength` and `maxLength` validators.

**Fix:** Refactored type narrowing logic to separate type check from length validation.

**Before:**
```typescript
validate: (value: unknown, context: ValidationContext) => {
  if (typeof value !== 'string' || value.length < length) {
    // error
  }
  return null;
}
```

**After:**
```typescript
validate: (value: unknown, context: ValidationContext) => {
  if (typeof value !== 'string') {
    return createError('TYPE_MISMATCH', `Expected string, got ${typeof value}`, context);
  }
  if (value.length < length) {
    return createError('MIN_LENGTH_VIOLATION', `Length must be at least ${length}, got ${value.length}`, context);
  }
  return null;
}
```

## Results

- **Before:** 51 TypeScript errors
- **After:** 49 TypeScript errors
- **Reduction:** 2 errors fixed (both related to string length type narrowing in validators)

All `FilterOperator` and `ValidationContext` type compatibility issues have been resolved. The remaining 49 errors are unrelated to these specific types and can be addressed in separate issues.

## Files Modified

1. `packages/core/src/types/table/TableState.ts` - Added missing FilterOperator variants
2. `packages/core/src/validation/schema/BaseTypes.ts` - Added optional value property to ValidationContext
3. `packages/core/src/validation/validators/Validators.ts` - Fixed type narrowing for string length checks
