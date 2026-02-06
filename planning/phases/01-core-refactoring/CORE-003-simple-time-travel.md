# CORE-003: Implement Simple Time Travel Core

## 🎯 Objective

Replace the current complex time travel implementation with a simplified, integrated version that provides undo/redo functionality and works seamlessly with the enhanced store architecture.

## 📋 Requirements

### Functional Requirements:

- [ ] Basic undo/redo functionality for store state
- [ ] Configurable history limit (default: 50 snapshots)
- [ ] Automatic snapshot capture on store changes
- [ ] Manual snapshot capture capability
- [ ] Restoration of both primitive and computed atoms
- [ ] Integration with enhanced store API
- [ ] State change detection (skip duplicate snapshots)

### Non-Functional Requirements:

- [ ] Memory efficient (structural sharing where possible)
- [ ] Fast restoration (< 50ms for 100 atoms)
- [ ] Bundle size increase < 2KB
- [ ] No breaking changes to existing API
- [ ] Tree-shakable (optional feature)

## 🔧 Technical Details

### Files to Create/Modify:

1. `packages/core/src/time-travel/simple-time-travel.ts` - New simplified implementation
2. `packages/core/src/time-travel/index.ts` - Main exports
3. `packages/core/src/enhanced-store.ts` - Integration
4. `packages/core/src/types.ts` - Time travel types
5. `packages/core/src/store.ts` - Optional integration hooks

### Expected Architecture:

#### 1. SimpleTimeTravel Class:

```typescript
export class SimpleTimeTravel {
  private history: Snapshot[] = [];
  private pointer: number = -1;
  private maxHistory: number;
  private store: Store;
  private atomRegistry: AtomRegistry;

  constructor(store: Store, options: TimeTravelOptions = {}) {
    this.store = store;
    this.atomRegistry = atomRegistry;
    this.maxHistory = options.maxHistory ?? 50;

    // Auto-attach to atom registry if available
    if (atomRegistry.attachStore) {
      atomRegistry.attachStore(store);
    }
  }

  // Core API
  capture(action?: string): Snapshot;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  jumpTo(index: number): boolean;
  clearHistory(): void;

  // Utility methods
  private createSnapshot(action?: string): Snapshot;
  private restoreSnapshot(snapshot: Snapshot): void;
  private areStatesEqual(a: State, b: State): boolean;
}
```

#### 2. Snapshot Structure:

```typescript
interface Snapshot {
  id: string;
  state: Record<string, any>;
  metadata: {
    timestamp: number;
    action?: string;
    atomCount: number;
  };
}

interface State {
  [atomId: string]: {
    value: any;
    type: "primitive" | "computed" | "writable";
  };
}
```

#### 3. Enhanced Store Integration:

```typescript
export function createEnhancedStore(
  plugins: Plugin[] = [],
  options: EnhancedStoreOptions = {},
): EnhancedStore {
  const store = createStore(plugins) as EnhancedStore;

  // Add time travel if enabled
  if (options.enableTimeTravel !== false) {
    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: options.maxHistory,
      autoCapture: options.autoCapture ?? true,
    });

    // Add methods to store
    store.captureSnapshot = (action?: string) => timeTravel.capture(action);
    store.undo = () => timeTravel.undo();
    store.redo = () => timeTravel.redo();
    store.canUndo = () => timeTravel.canUndo();
    store.canRedo = () => timeTravel.canRedo();
    store.getHistory = () => timeTravel.getHistory();

    // Auto-capture on store changes
    if (options.autoCapture ?? true) {
      const originalSet = store.set;
      store.set = function (...args) {
        const result = originalSet.apply(this, args);
        timeTravel.capture(`SET_${args[0].toString()}`);
        return result;
      };
    }
  }

  return store;
}
```

## 🚀 Implementation Steps

### Step 1: Create SimpleTimeTravel Class (3-4 hours)

1. Implement core history management (array with pointer)
2. Add snapshot creation with efficient serialization
3. Implement state restoration logic
4. Add duplicate detection to skip unchanged states
5. Include memory optimization (structural sharing)

### Step 2: Implement Snapshot Serialization (2 hours)

1. Efficient serialization of atom values
2. Support for special types (Date, Map, Set, etc.)
3. Circular reference handling
4. Computed atom value caching/restoration

### Step 3: Integrate with EnhancedStore (1 hour)

1. Add time travel options to EnhancedStoreOptions
2. Attach time travel instance to store
3. Add public API methods to store
4. Configure auto-capture behavior

### Step 4: Add Atom Registry Integration (1 hour)

1. Use atom registry for atom identification
2. Leverage store-aware registry from CORE-001
3. Add atom metadata to snapshots
4. Ensure computed atoms work correctly

### Step 5: Write Comprehensive Tests (2-3 hours)

1. Unit tests for SimpleTimeTravel class
2. Integration tests with store
3. Performance tests for large histories
4. Edge case tests (empty store, single atom, etc.)

## 🧪 Testing Requirements

### Unit Tests:

- [ ] `capture()` creates valid snapshots
- [ ] `undo()`/`redo()` move pointer correctly
- [ ] `canUndo()`/`canRedo()` return correct values
- [ ] Duplicate state detection works
- [ ] History limit enforcement

### Integration Tests:

- [ ] Works with primitive atoms
- [ ] Works with computed atoms
- [ ] Works with writable atoms
- [ ] Multiple stores with isolated time travel
- [ ] Auto-capture on store.set()

### Performance Tests:

- [ ] Snapshot creation < 10ms for 100 atoms
- [ ] Restoration < 50ms for 100 atoms
- [ ] Memory usage < 5MB for 50 snapshots
- [ ] No memory leaks after clearHistory()

### Edge Cases:

- [ ] Empty store
- [ ] Single atom changes
- [ ] Large objects (1MB+ values)
- [ ] Circular references in values
- [ ] Concurrent modifications

## ✅ Acceptance Criteria

### Code Quality:

- [ ] TypeScript strict mode compliance
- [ ] No memory leaks (test with WeakRef)
- [ ] 90%+ test coverage
- [ ] JSDoc for all public methods

### Functional:

- [ ] Basic undo/redo works correctly
- [ ] History limit respected
- [ ] Duplicate states skipped
- [ ] Computed atoms restore correctly
- [ ] Works with enhanced store API

### Performance:

- [ ] Snapshot creation O(n) where n = changed atoms
- [ ] Restoration O(n) where n = atoms
- [ ] Memory usage scales linearly with history size
- [ ] No significant impact on store performance

## 📝 Notes for AI

### Important Implementation Details:

1. **Structural Sharing for Efficiency:**

```typescript
private createSnapshot(action?: string): Snapshot {
  const state: State = {};
  let hasChanges = false;

  // Only capture changed atoms
  const lastSnapshot = this.history[this.pointer];

  if (!lastSnapshot) {
    // First snapshot - capture everything
    hasChanges = true;
  } else {
    // Compare with last snapshot
    hasChanges = this.detectStateChanges(lastSnapshot.state);
  }

  if (!hasChanges) {
    // Skip duplicate snapshot
    return lastSnapshot!;
  }

  // ... create new snapshot
}
```

2. **Efficient State Comparison:**

```typescript
private detectStateChanges(previousState: State): boolean {
  // Quick check: different number of atoms
  if (Object.keys(previousState).length !== this.atomRegistry.size()) {
    return true;
  }

  // Compare atom values (reference equality for objects)
  for (const [atomId, prevValue] of Object.entries(previousState)) {
    const currentValue = this.getAtomValue(atomId);
    if (!Object.is(prevValue.value, currentValue)) {
      return true;
    }
  }

  return false;
}
```

3. **Computed Atom Handling:**

```typescript
private restoreSnapshot(snapshot: Snapshot): void {
  // First restore all primitive atoms
  Object.entries(snapshot.state).forEach(([atomId, atomData]) => {
    if (atomData.type === 'primitive' || atomData.type === 'writable') {
      this.restoreAtom(atomId, atomData.value);
    }
  });

  // Computed atoms will be recalculated on next access
  // This is acceptable as they're derived from primitive atoms
}
```

### Configuration Options:

```typescript
interface TimeTravelOptions {
  maxHistory?: number; // Default: 50
  autoCapture?: boolean; // Default: true
  captureFilter?: (atom: Atom<any>, value: any) => boolean;
  serialize?: (value: any) => any;
  deserialize?: (value: any) => any;
}
```

### Integration Example:

```typescript
// Basic usage
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 100,
  autoCapture: true,
});

// Manual control
store.captureSnapshot("user login");
store.set(userAtom, { name: "John", loggedIn: true });
store.undo(); // Back to before login

// Check availability
if (store.canUndo()) {
  store.undo();
}
```

## 🔄 Related Tasks

- **Depends on**: CORE-001, CORE-002
- **Blocks**: DEV-002 (Time Travel Commands), all Phase 2 tasks
- **Related**: PERF-001 (Performance optimizations)

## 🚨 Risk Assessment

| Risk                        | Probability | Impact | Mitigation                              |
| --------------------------- | ----------- | ------ | --------------------------------------- |
| Memory leaks from snapshots | Medium      | High   | Use WeakRef, limit history, add cleanup |
| Performance degradation     | Medium      | Medium | Optimize serialization, skip duplicates |
| Computed atom restoration   | High        | Medium | Document limitation, provide workaround |
| Complex integration bugs    | Low         | High   | Extensive testing, gradual rollout      |

---

_Task ID: CORE-003_  
_Estimated Time: 8-10 hours_  
_Priority: 🔴 High_  
_Status: Not Started_  
_Assigned To: AI Developer_
