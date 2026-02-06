# CORE-001: Fix Atom Registry Store Integration

## 🎯 Objective

Make the Atom Registry store-aware to enable proper DevTools integration and time travel functionality while maintaining backward compatibility.

## 📋 Requirements

### Functional Requirements:

- [ ] Registry can track which store owns which atoms
- [ ] Support both global (default) and per-store registry modes
- [ ] Retrieve atom values through store reference
- [ ] Get atom display names for DevTools
- [ ] Handle multiple stores without conflicts
- [ ] Thread-safe for SSR environments

### Non-Functional Requirements:

- [ ] O(1) lookup for atom metadata
- [ ] Memory efficient (weak references where appropriate)
- [ ] No breaking changes to public API
- [ ] Bundle size increase < 0.5KB

## 🔧 Technical Details

### Files to Modify:

1. `packages/core/src/atom-registry.ts` - Main implementation
2. `packages/core/src/store.ts` - Integration points
3. `packages/core/src/types.ts` - Type updates
4. `packages/core/src/enhanced-store.ts` - Enhanced integration

### Expected Changes:

#### 1. Updated AtomRegistry Class:

```typescript
interface StoreRegistry {
  store: Store;
  atoms: Set<symbol>;
}

class AtomRegistry {
  private stores: WeakMap<Store, StoreRegistry> = new WeakMap();
  private globalRegistry: Map<symbol, Atom<any>> = new Map();
  private metadata: Map<symbol, AtomMetadata> = new Map();

  // New methods
  attachStore(store: Store, mode: "global" | "isolated" = "global"): void;
  getStoreForAtom(atomId: symbol): Store | undefined;
  getAtomsForStore(store: Store): symbol[];
  getAtomValue(atomId: symbol): any | undefined;
}
```

#### 2. Store Integration in store.ts:

```typescript
export function createStore(plugins: Plugin[] = []): Store {
  const store = {
    /* ... existing code ... */
  };

  // Auto-attach to registry in global mode
  if (typeof atomRegistry.attachStore === "function") {
    atomRegistry.attachStore(store, "global");
  }

  return store;
}
```

#### 3. Enhanced Store with Isolation:

```typescript
export function createEnhancedStore(
  plugins: Plugin[] = [],
  options: { registryMode?: "global" | "isolated" } = {},
): EnhancedStore {
  const store = createStore(plugins) as EnhancedStore;

  if (options.registryMode === "isolated") {
    atomRegistry.attachStore(store, "isolated");
  }

  return store;
}
```

## 🚀 Implementation Steps

### Step 1: Update Types (1 hour)

- Add `StoreRegistry` interface
- Add registry mode type: `'global' | 'isolated'`
- Export new types from main module

### Step 2: Modify AtomRegistry Class (2-3 hours)

1. Add `stores` WeakMap to track store relationships
2. Implement `attachStore()` method
3. Add store-aware lookup methods
4. Update `register()` to track store ownership

### Step 3: Integrate with Store Creation (1 hour)

1. Modify `createStore()` to auto-attach to registry
2. Add optional configuration for registry mode
3. Ensure backward compatibility

### Step 4: Add Utility Methods (1 hour)

1. `getAtomValue()` - get value through store
2. `getStoreForAtom()` - find owner store
3. `getAtomsForStore()` - list all atoms for a store

### Step 5: Write Tests (2 hours)

1. Unit tests for new registry functionality
2. Integration tests with multiple stores
3. SSR compatibility tests
4. Performance tests for large registries

## 🧪 Testing Requirements

### Unit Tests:

- [ ] `attachStore()` with both modes
- [ ] `getStoreForAtom()` returns correct store
- [ ] `getAtomValue()` retrieves through store
- [ ] Thread safety for concurrent access
- [ ] Memory leaks detection

### Integration Tests:

- [ ] Multiple stores with isolated registries
- [ ] Global registry mode (default)
- [ ] DevTools integration via atom names
- [ ] Time travel snapshot restoration

### Performance Tests:

- [ ] O(1) lookup for 10,000 atoms
- [ ] Memory usage < 1MB per 1000 atoms
- [ ] No significant overhead for store operations

## ✅ Acceptance Criteria

### Code Quality:

- [ ] TypeScript strict mode compliance
- [ ] No `any` types without eslint disable
- [ ] JSDoc comments for all public methods
- [ ] 90%+ test coverage for new code

### Functional:

- [ ] Global mode works as before (backward compatible)
- [ ] Isolated mode prevents cross-store contamination
- [ ] Atom values retrievable through registry
- [ ] Store detachment cleans up references

### Performance:

- [ ] No significant performance regression
- [ ] Memory usage within acceptable limits
- [ ] Bundle size increase < 0.5KB gzipped

## 📝 Notes for AI

### Important Constraints:

1. **Backward Compatibility**: Existing code must work without changes
2. **Weak References**: Use `WeakMap` for store references to avoid memory leaks
3. **Thread Safety**: Consider SSR environments with concurrent access
4. **Tree Shaking**: Ensure unused code can be eliminated

### Implementation Tips:

- Use optional chaining (`?.`) for backward compatibility
- Add feature detection for registry methods
- Export new types but don't break existing ones
- Consider adding a `__DEV__` check for verbose warnings

### Example Migration Path:

```typescript
// Old code still works
const store = createStore();
const atom = atom(0);
// atom is automatically registered globally

// New code can use isolation
const isolatedStore = createEnhancedStore([], {
  registryMode: "isolated",
});
// Atoms created through this store are isolated
```

## 🔄 Related Tasks

- **Depends on**: None (this is a foundation task)
- **Blocks**: CORE-002, CORE-003, all DevTools tasks
- **Related**: DEV-001 (DevTools plugin refactor)

## 🚨 Risk Assessment

| Risk                   | Probability | Impact | Mitigation                        |
| ---------------------- | ----------- | ------ | --------------------------------- |
| Breaking existing code | Low         | High   | Extensive testing, feature flags  |
| Performance regression | Medium      | Medium | Benchmark tests, optimization     |
| Memory leaks           | Medium      | High   | Weak references, cleanup hooks    |
| Complex API            | Low         | Medium | Simple defaults, gradual adoption |

---

_Task ID: CORE-001_  
_Estimated Time: 6-8 hours_  
_Priority: 🔴 High_  
_Status: Not Started_  
_Assigned To: AI Developer_
