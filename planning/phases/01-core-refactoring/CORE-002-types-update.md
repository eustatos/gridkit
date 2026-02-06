# CORE-002: Update TypeScript Interfaces

## 🎯 Objective

Align TypeScript interfaces with actual implementations to eliminate type inconsistencies, improve developer experience, and enable proper type inference for computed atoms.

## 📋 Requirements

### Functional Requirements:

- [ ] Unified `Atom<Value>` type hierarchy
- [ ] Proper generics for computed atom functions
- [ ] Explicit distinction between primitive/computed/writable atoms
- [ ] Complete type safety for store methods
- [ ] Export all public types from main module
- [ ] JSDoc comments for all public APIs

### Non-Functional Requirements:

- [ ] TypeScript strict mode compliance
- [ ] No breaking changes to existing type definitions
- [ ] Improved type inference for common patterns
- [ ] Better IDE autocomplete and documentation

## 🔧 Technical Details

### Files to Modify:

1. `packages/core/src/types.ts` - Main type definitions
2. `packages/core/src/atom.ts` - Atom creation function types
3. `packages/core/src/store.ts` - Store method signatures
4. `packages/core/src/index.ts` - Type exports
5. `packages/core/package.json` - TypeScript configuration

### Expected Changes:

#### 1. Unified Atom Type Hierarchy:

```typescript
// Current (inconsistent):
export interface Atom<Value> {
  readonly id: symbol;
  read: (get: Getter) => Value;
  write?: (get: Getter, set: Setter, value: Value) => void;
}

// New (hierarchical):
export interface BaseAtom<Value> {
  readonly id: symbol;
  readonly type: "primitive" | "computed" | "writable";
  readonly name?: string;
}

export interface PrimitiveAtom<Value> extends BaseAtom<Value> {
  type: "primitive";
  read: () => Value;
}

export interface ComputedAtom<Value> extends BaseAtom<Value> {
  type: "computed";
  read: (get: Getter) => Value;
}

export interface WritableAtom<Value> extends BaseAtom<Value> {
  type: "writable";
  read: (get: Getter) => Value;
  write: (get: Getter, set: Setter, value: Value) => void;
}

export type Atom<Value> =
  | PrimitiveAtom<Value>
  | ComputedAtom<Value>
  | WritableAtom<Value>;
```

#### 2. Improved Store Method Types:

```typescript
// Better type inference for set() method
export interface Store {
  get: <Value>(atom: Atom<Value>) => Value;

  set: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;

  // Type guard for writable atoms
  set: <Value>(
    atom: WritableAtom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;

  subscribe: <Value>(
    atom: Atom<Value>,
    listener: (value: Value) => void,
  ) => () => void;
}
```

#### 3. Enhanced Atom Creation Function:

```typescript
// Overload signatures for better inference
export function atom<Value>(
  initialValue: Value,
  name?: string,
): PrimitiveAtom<Value>;
export function atom<Value>(
  read: (get: Getter) => Value,
  name?: string,
): ComputedAtom<Value>;
export function atom<Value>(
  read: (get: Getter) => Value,
  write: (get: Getter, set: Setter, value: Value) => void,
  name?: string,
): WritableAtom<Value>;
```

## 🚀 Implementation Steps

### Step 1: Backup Current Types (30 minutes)

1. Create backup of current `types.ts`
2. Document any breaking changes needed
3. Plan migration strategy

### Step 2: Update `types.ts` (2-3 hours)

1. Implement new hierarchical atom types
2. Add proper generics for all interfaces
3. Include JSDoc comments for all types
4. Add utility types for common patterns:
   ```typescript
   export type AtomValue<A> = A extends Atom<infer V> ? V : never;
   export type AnyAtom = Atom<any>;
   ```

### Step 3: Update `atom.ts` Function (1 hour)

1. Implement overload signatures
2. Ensure proper return types based on parameters
3. Maintain backward compatibility
4. Add runtime type checking in development mode

### Step 4: Update `store.ts` Signatures (1 hour)

1. Align method signatures with new types
2. Add type guards where appropriate
3. Ensure type safety for computed atom evaluation

### Step 5: Update Exports in `index.ts` (30 minutes)

1. Export all new types
2. Re-export existing types for compatibility
3. Update type documentation

### Step 6: Add Type Tests (2 hours)

1. Create `test/types.test.ts` with TypeScript compiler tests
2. Test type inference for common patterns
3. Verify no breaking changes
4. Test IDE autocomplete scenarios

## 🧪 Testing Requirements

### TypeScript Compiler Tests:

- [ ] All existing code compiles without errors
- [ ] Type inference works for computed atoms
- [ ] Generic constraints are properly enforced
- [ ] No implicit `any` types

### Runtime Tests:

- [ ] Atom creation returns correct types
- [ ] Store methods accept correct atom types
- [ ] Type guards work in development mode
- [ ] Backward compatibility maintained

### Integration Tests:

- [ ] React/Vue/Svelte adapters work with new types
- [ ] DevTools plugin types align
- [ ] Time travel system compatible

## ✅ Acceptance Criteria

### Code Quality:

- [ ] TypeScript strict mode passes
- [ ] No `any` types in public API
- [ ] Complete JSDoc coverage
- [ ] 100% type safety for exported API

### Functional:

- [ ] All existing tests pass with new types
- [ ] Type inference works for common patterns:

  ```typescript
  // Should infer PrimitiveAtom<number>
  const count = atom(0);

  // Should infer ComputedAtom<number>
  const double = atom((get) => get(count) * 2);

  // Should infer WritableAtom<User>
  const user = atom(
    () => initialState,
    (get, set, update) => set(userAtom, update),
  );
  ```

### Developer Experience:

- [ ] IDE autocomplete shows correct types
- [ ] Hover documentation displays JSDoc
- [ ] Type errors are clear and actionable
- [ ] Migration path documented

## 📝 Notes for AI

### Important Constraints:

1. **Zero Breaking Changes**: Existing code must compile without modification
2. **Gradual Adoption**: New types should be optional improvements
3. **Runtime Compatibility**: Types must match runtime behavior
4. **Bundle Size**: Type-only changes shouldn't affect bundle size

### Implementation Strategy:

1. Use type aliases for backward compatibility
2. Add `@deprecated` JSDoc for old patterns
3. Use conditional types for advanced inference
4. Add `__DEV__` checks for type warnings

### Common Patterns to Support:

```typescript
// 1. Primitive atom with initial value
const count = atom(0);

// 2. Computed atom with getter
const doubled = atom((get) => get(count) * 2);

// 3. Writable atom with read/write
const user = atom(
  () => ({ name: "", age: 0 }),
  (get, set, update) => set(userAtom, { ...get(userAtom), ...update }),
);

// 4. Type inference in store methods
store.get(count); // Should infer number
store.set(count, 5); // Should accept number
store.set(count, (prev) => prev + 1); // Should accept function
```

### Migration Helpers:

```typescript
// Type guard utilities
export function isPrimitiveAtom<Value>(
  atom: Atom<Value>,
): atom is PrimitiveAtom<Value> {
  return atom.type === "primitive";
}

// Type assertion for development
export function assertWritableAtom<Value>(
  atom: Atom<Value>,
): asserts atom is WritableAtom<Value> {
  if (atom.type !== "writable") {
    throw new Error(`Atom is not writable: ${atom.toString()}`);
  }
}
```

## 🔄 Related Tasks

- **Depends on**: CORE-001 (Atom Registry Fix)
- **Blocks**: CORE-003 (Time Travel), all DevTools tasks
- **Related**: All adapter packages need type updates

## 🚨 Risk Assessment

| Risk                    | Probability | Impact | Mitigation                              |
| ----------------------- | ----------- | ------ | --------------------------------------- |
| Breaking type inference | Medium      | High   | Extensive type testing, gradual rollout |
| Complex type errors     | Low         | Medium | Clear error messages, documentation     |
| Performance impact      | Low         | Low    | Type-only changes, no runtime overhead  |
| Adoption friction       | Low         | Low    | Backward compatibility, migration guide |

---

_Task ID: CORE-002_  
_Estimated Time: 6-8 hours_  
_Priority: 🟡 Medium_  
_Status: Not Started_  
_Assigned To: AI Developer_
