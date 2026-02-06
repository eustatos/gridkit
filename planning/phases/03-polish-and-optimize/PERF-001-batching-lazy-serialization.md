# PERF-001: Implement Batched Updates and Lazy Serialization

## 🎯 Objective

Optimize performance for large-scale applications by implementing batched updates to reduce render cycles and lazy serialization to minimize DevTools overhead.

## 📋 Requirements

### Functional Requirements:

- [ ] Batch rapid state changes within a single frame (16ms)
- [ ] Smart batching: group related atom updates
- [ ] Lazy state serialization: only serialize changed portions
- [ ] Structural sharing to avoid redundant serialization
- [ ] Configurable batch window and strategies
- [ ] Support for synchronous and asynchronous batching
- [ ] Integration with existing store and DevTools
- [ ] Fallback to immediate updates when batching disabled

### Non-Functional Requirements:

- [ ] Reduce DevTools overhead by 70%+
- [ ] Batch processing overhead < 1ms per batch
- [ ] Memory usage reduction for large state trees
- [ ] Zero impact on existing API
- [ ] Tree-shakable optimization modules
- [ ] Works with SSR (server-side rendering)

## 🔧 Technical Details

### Files to Create/Modify:

1. `packages/core/src/optimization/update-batcher.ts` - Batching logic
2. `packages/core/src/optimization/lazy-serializer.ts` - Lazy serialization
3. `packages/core/src/optimization/structural-sharing.ts` - Structural sharing
4. `packages/core/src/enhanced-store.ts` - Integration
5. `packages/devtools/src/devtools-plugin.ts` - Optimized DevTools integration
6. `packages/core/src/types.ts` - Optimization types

### Expected Architecture:

#### 1. UpdateBatcher Class:

```typescript
export class UpdateBatcher {
  private queue: Map<
    symbol,
    { atom: Atom<any>; value: any; timestamp: number }
  > = new Map();
  private batchWindow: number = 16; // Default to 60fps
  private batchTimer: any = null;
  private isBatching: boolean = false;
  private callbacks: Array<() => void> = [];

  constructor(options: BatchOptions = {}) {
    this.batchWindow = options.window ?? 16;
  }

  // Add update to batch
  scheduleUpdate(atom: Atom<any>, value: any): void {
    const now = performance.now();

    // Group updates by atom type or relationship
    const groupKey = this.getGroupKey(atom);

    this.queue.set(groupKey, { atom, value, timestamp: now });

    // Start batch timer if not already running
    if (!this.batchTimer && !this.isBatching) {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (typeof requestAnimationFrame !== "undefined") {
      // Use rAF for browser environments
      requestAnimationFrame(() => this.flush());
    } else {
      // Fallback for Node.js/SSR
      this.batchTimer = setTimeout(() => this.flush(), this.batchWindow);
    }
  }

  private flush(): void {
    this.isBatching = true;

    try {
      if (this.queue.size === 0) return;

      // Process all queued updates
      const updates = Array.from(this.queue.values());
      this.queue.clear();

      // Group related updates
      const grouped = this.groupUpdates(updates);

      // Execute updates
      grouped.forEach((group) => {
        this.executeBatch(group);
      });

      // Notify listeners
      this.callbacks.forEach((callback) => callback());
    } finally {
      this.isBatching = false;
      this.batchTimer = null;
    }
  }

  private groupUpdates(
    updates: Array<{ atom: Atom<any>; value: any }>,
  ): Array<Array<{ atom: Atom<any>; value: any }>> {
    // Smart grouping based on atom relationships
    const groups: Map<
      string,
      Array<{ atom: Atom<any>; value: any }>
    > = new Map();

    updates.forEach((update) => {
      const groupId = this.getUpdateGroup(update.atom);
      if (!groups.has(groupId)) {
        groups.set(groupId, []);
      }
      groups.get(groupId)!.push(update);
    });

    return Array.from(groups.values());
  }
}
```

#### 2. LazySerializer Class:

```typescript
export class LazySerializer {
  private cache: WeakMap<object, { serialized: any; timestamp: number }> =
    new WeakMap();
  private lastFullSerialization: any = null;
  private changeDetectionThreshold: number = 100; // ms

  // Serialize only changed parts of state
  serializeDelta(currentState: any, previousState: any): SerializationDelta {
    if (!previousState || this.shouldFullSerialize()) {
      return this.fullSerialize(currentState);
    }

    const delta: SerializationDelta = {
      type: "delta",
      changes: this.findChanges(currentState, previousState),
      timestamp: Date.now(),
    };

    // If delta is too large, fall back to full serialization
    if (this.isDeltaTooLarge(delta, currentState)) {
      return this.fullSerialize(currentState);
    }

    return delta;
  }

  private findChanges(
    current: any,
    previous: any,
    path: string[] = [],
  ): Change[] {
    const changes: Change[] = [];

    if (current === previous) {
      return changes; // No change
    }

    if (
      typeof current !== typeof previous ||
      Array.isArray(current) !== Array.isArray(previous)
    ) {
      // Type changed, full replacement
      changes.push({ path, operation: "replace", value: current });
      return changes;
    }

    if (typeof current === "object" && current !== null && previous !== null) {
      // Compare objects recursively
      const allKeys = new Set([
        ...Object.keys(current),
        ...Object.keys(previous),
      ]);

      for (const key of allKeys) {
        const currentVal = current[key];
        const previousVal = previous[key];
        const newPath = [...path, key];

        if (currentVal !== previousVal) {
          if (
            typeof currentVal === "object" &&
            typeof previousVal === "object" &&
            currentVal !== null &&
            previousVal !== null
          ) {
            // Recursive comparison for nested objects
            changes.push(...this.findChanges(currentVal, previousVal, newPath));
          } else {
            // Primitive or different type
            changes.push({
              path: newPath,
              operation: currentVal === undefined ? "delete" : "set",
              value: currentVal,
            });
          }
        }
      }
    } else {
      // Primitive values
      changes.push({ path, operation: "replace", value: current });
    }

    return changes;
  }

  private fullSerialize(state: any): SerializationDelta {
    const serialized = this.deepSerialize(state);
    this.lastFullSerialization = serialized;
    return {
      type: "full",
      state: serialized,
      timestamp: Date.now(),
    };
  }
}
```

#### 3. Structural Sharing Implementation:

```typescript
export class StructuralSharing {
  // Reuse unchanged parts of objects to reduce memory and serialization cost
  static merge<T extends object>(current: T, updates: Partial<T>): T {
    if (this.isEmptyUpdate(updates)) {
      return current;
    }

    // Check if we can reuse the current object
    let needsNewObject = false;

    for (const key in updates) {
      if (updates[key] !== current[key]) {
        needsNewObject = true;
        break;
      }
    }

    if (!needsNewObject) {
      return current;
    }

    // Create new object with shared references for unchanged properties
    const result: any = Array.isArray(current) ? [] : {};

    for (const key in current) {
      if (key in updates) {
        // Updated property
        const newValue = updates[key];
        const oldValue = current[key];

        if (
          typeof newValue === "object" &&
          newValue !== null &&
          typeof oldValue === "object" &&
          oldValue !== null
        ) {
          // Recursive merge for nested objects
          result[key] = this.merge(oldValue, newValue);
        } else {
          result[key] = newValue;
        }
      } else {
        // Unchanged property - share reference
        result[key] = current[key];
      }
    }

    // Add new properties not in current
    for (const key in updates) {
      if (!(key in current)) {
        result[key] = updates[key];
      }
    }

    return result as T;
  }

  static cloneWithStructuralSharing<T extends object>(
    obj: T,
    path: string[] = [],
  ): T {
    // Only clone objects that are likely to be modified
    if (this.isImmutablePath(path)) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) =>
        typeof item === "object" && item !== null
          ? this.cloneWithStructuralSharing(item, [...path, index.toString()])
          : item,
      ) as any;
    }

    const clone: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        clone[key] = this.cloneWithStructuralSharing(value, [...path, key]);
      } else {
        clone[key] = value;
      }
    }

    return clone;
  }
}
```

#### 4. Store Integration:

```typescript
export function createEnhancedStore(
  plugins: Plugin[] = [],
  options: EnhancedStoreOptions = {},
): EnhancedStore {
  const store = createStore(plugins) as EnhancedStore;

  // Add optimization features if enabled
  if (options.enableOptimizations !== false) {
    const batcher = new UpdateBatcher({
      window: options.batchWindow ?? 16,
      strategy: options.batchingStrategy ?? "smart",
    });

    const serializer = new LazySerializer({
      useStructuralSharing: true,
      deltaThreshold: 0.3, // Use delta if < 30% changed
    });

    // Wrap store.set with batching
    const originalSet = store.set;
    store.set = function (atom: Atom<any>, update: any) {
      if (options.disableBatching) {
        return originalSet.call(this, atom, update);
      }

      // Calculate new value
      const newValue =
        typeof update === "function" ? update(store.get(atom)) : update;

      // Schedule batched update
      batcher.scheduleUpdate(atom, newValue);

      // Return a promise that resolves when batch is processed
      return new Promise<void>((resolve) => {
        batcher.onFlush(() => resolve());
      });
    };

    // Optimize DevTools serialization
    if (store.serializeState) {
      const originalSerialize = store.serializeState;
      let lastSerializedState: any = null;

      store.serializeState = function () {
        const currentState = store.getState();
        const delta = serializer.serializeDelta(
          currentState,
          lastSerializedState,
        );
        lastSerializedState = currentState;

        return {
          state: currentState,
          delta,
          optimized: true,
        };
      };
    }
  }

  return store;
}
```

## 🚀 Implementation Steps

### Step 1: Implement UpdateBatcher (3-4 hours)

1. Create batching queue with timestamp tracking
2. Implement smart grouping based on atom relationships
3. Add rAF-based and timeout-based scheduling
4. Create batch execution with error recovery
5. Add batch lifecycle events and hooks

### Step 2: Build LazySerializer (3-4 hours)

1. Implement delta serialization algorithm
2. Create change detection for nested objects
3. Add caching with WeakMap for efficiency
4. Implement fallback to full serialization
5. Add serialization size estimation

### Step 3: Implement Structural Sharing (2-3 hours)

1. Create object merging with reference sharing
2. Implement path-based immutability detection
3. Add cloning with structural sharing
4. Create benchmarks to validate efficiency

### Step 4: Integrate with Store (2 hours)

1. Modify enhanced-store to use optimizations
2. Add configuration options for optimization features
3. Ensure backward compatibility
4. Add feature detection and fallbacks

### Step 5: Optimize DevTools Integration (2 hours)

1. Modify DevTools plugin to use lazy serialization
2. Add batch-aware action reporting
3. Implement delta application in DevTools
4. Add performance monitoring

### Step 6: Write Performance Tests (3 hours)

1. Benchmark batching efficiency
2. Measure serialization performance
3. Test memory usage with/without optimizations
4. Create load tests for large state trees

## 🧪 Testing Requirements

### Unit Tests:

- [ ] UpdateBatcher groups updates correctly
- [ ] LazySerializer detects changes accurately
- [ ] Structural sharing reduces object creation
- [ ] Batch timing respects configured window
- [ ] Error recovery within batches

### Integration Tests:

- [ ] Batched updates don't break reactivity
- [ ] Lazy serialization works with DevTools
- [ ] Structural sharing works with nested objects
- [ ] Optimization features work together
- [ ] SSR compatibility maintained

### Performance Tests:

- [ ] Batching reduces render cycles by 70%+
- [ ] Lazy serialization reduces DevTools overhead by 50%+
- [ ] Structural sharing reduces memory by 30%+
- [ ] Optimization overhead < 5% of total runtime

### Stress Tests:

- [ ] 1000+ atom updates within single batch
- [ ] Deeply nested object changes
- [ ] Rapid successive updates
- [ ] Memory leak detection under load

## ✅ Acceptance Criteria

### Code Quality:

- [ ] TypeScript strict mode compliance
- [ ] 90%+ test coverage for optimization code
- [ ] No memory leaks (test with WeakRef)
- [ ] Comprehensive JSDoc with performance notes

### Functional:

- [ ] Batching works without breaking existing functionality
- [ ] Lazy serialization reduces payload size significantly
- [ ] Structural sharing reduces memory allocations
- [ ] All optimizations are configurable and optional
- [ ] Fallback paths work when optimizations disabled

### Performance:

- [ ] DevTools overhead reduced by 70%+
- [ ] Batch processing overhead < 1ms
- [ ] Serialization time reduced by 50%+
- [ ] Memory usage reduced by 30%+ for large states
- [ ] Bundle size increase < 2KB for optimization features

## 📝 Notes for AI

### Critical Implementation Details:

1. **Smart Batching Strategy:**

```typescript
private getUpdateGroup(atom: Atom<any>): string {
  // Group by atom type and likely update frequency
  const metadata = atomRegistry.getMetadata(atom);
  if (!metadata) return 'default';

  // UI atoms update frequently, group separately
  if (metadata.name?.includes('ui.') || metadata.name?.includes('view.')) {
    return 'ui';
  }

  // Data atoms can be batched together
  if (metadata.name?.includes('data.') || metadata.name?.includes('api.')) {
    return 'data';
  }

  // Computed atoms based on their dependencies
  if (metadata.type === 'computed') {
    const deps = this.getDependencies(atom);
    return `computed:${deps.sort().join(',')}`;
  }

  return 'default';
}
```

2. **Delta Serialization with Size Estimation:**

```typescript
private isDeltaTooLarge(delta: SerializationDelta, fullState: any): boolean {
  if (delta.type !== 'delta') return false;

  // Estimate delta size vs full state size
  const deltaSize = this.estimateSize(delta.changes);
  const fullSize = this.estimateSize(fullState);

  // If delta is more than 30% of full size, use full serialization
  const ratio = deltaSize / fullSize;
  return ratio > this.config.deltaThreshold;
}

private estimateSize(obj: any): number {
  // Fast size estimation without actual serialization
  if (obj === null || obj === undefined) return 0;
  if (typeof obj === 'string') return obj.length * 2; // UTF-16
  if (typeof obj === 'number') return 8;
  if (typeof obj === 'boolean') return 1;

  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + this.estimateSize(item), 0);
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((sum, key) => {
      return sum + this.estimateSize(obj[key]) + key.length * 2;
    }, 0);
  }

  return 0;
}
```

3. **Performance Monitoring Integration:**

```typescript
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    batchCount: 0,
    averageBatchSize: 0,
    serializationTime: 0,
    memorySavings: 0,
    renderCyclesSaved: 0,
  };

  recordBatch(size: number, duration: number): void {
    this.metrics.batchCount++;
    this.metrics.averageBatchSize =
      (this.metrics.averageBatchSize * (this.metrics.batchCount - 1) + size) /
      this.metrics.batchCount;

    // Calculate render cycles saved (assuming 60fps)
    const potentialRenders = Math.ceil(duration / 16);
    this.metrics.renderCyclesSaved += Math.max(0, potentialRenders - 1);

    // Log in development
    if (
      process.env.NODE_ENV !== "production" &&
      this.metrics.batchCount % 10 === 0
    ) {
      console.log(
        `Performance: ${this.metrics.renderCyclesSaved} render cycles saved`,
      );
    }
  }

  getReport(): PerformanceReport {
    return {
      ...this.metrics,
      efficiency: this.calculateEfficiency(),
    };
  }
}
```

### Configuration Examples:

```typescript
// Optimized store configuration
const store = createEnhancedStore([], {
  enableOptimizations: true,
  batchWindow: 16, // Align with 60fps
  batchingStrategy: "smart", // or 'time', 'immediate'
  lazySerialization: {
    enabled: true,
    deltaThreshold: 0.3,
    useStructuralSharing: true,
    cacheDuration: 5000, // ms
  },
  performanceMonitoring: true,
});

// Disable optimizations for debugging
const debugStore = createEnhancedStore([], {
  enableOptimizations: false,
  // All updates immediate, full serialization
});
```

## 🔄 Related Tasks

- **Depends on**: CORE-003, DEV-001, DEV-002
- **Blocks**: TEST-001 (Comprehensive testing)
- **Related**: Future performance monitoring tasks

## 🚨 Risk Assessment

| Risk                       | Probability | Impact | Mitigation                                |
| -------------------------- | ----------- | ------ | ----------------------------------------- |
| Batching breaks reactivity | Medium      | High   | Thorough testing, immediate mode fallback |
| Delta serialization errors | Medium      | Medium | Validation, full serialization fallback   |
| Memory leaks in caches     | Low         | High   | WeakMap usage, cleanup intervals          |
| Performance regression     | Medium      | High   | Benchmark comparison, gradual rollout     |

---

_Task ID: PERF-001_  
_Estimated Time: 14-16 hours_  
_Priority: 🟡 Medium_  
_Status: Not Started_  
_Assigned To: AI Developer_
