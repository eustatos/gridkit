# DEV-001: Refactor DevTools Plugin for New Architecture

## 🎯 Objective

Refactor the existing DevTools plugin to work with the new core architecture (from Phase 1), integrate with the atom registry for better debugging, and provide a clean, maintainable API.

## 📋 Requirements

### Functional Requirements:

- [ ] Works with enhanced store from Phase 1
- [ ] Uses atom registry for atom identification and naming
- [ ] Supports both global and isolated store modes
- [ ] Graceful degradation when Redux DevTools not available
- [ ] Configurable update batching and throttling
- [ ] Proper error handling and recovery
- [ ] SSR compatibility (no window object)
- [ ] Plugin lifecycle management (init/teardown)

### Non-Functional Requirements:

- [ ] Bundle size < 3KB gzipped
- [ ] Performance overhead < 5ms per update
- [ ] Memory efficient (no leaks)
- [ ] Tree-shakable (optional feature)
- [ ] TypeScript strict mode compliance

## 🔧 Technical Details

### Files to Modify:

1. `packages/devtools/src/devtools-plugin.ts` - Main plugin implementation
2. `packages/devtools/src/types.ts` - Plugin types and interfaces
3. `packages/devtools/src/index.ts` - Public API exports
4. `packages/core/src/enhanced-store.ts` - Integration points
5. `packages/devtools/package.json` - Dependencies and exports

### Expected Architecture:

#### 1. Refactored DevToolsPlugin Class:

```typescript
export class DevToolsPlugin implements Plugin {
  private connection: DevToolsConnection | null = null;
  private store: EnhancedStore | null = null;
  private config: Required<DevToolsConfig>;
  private updateQueue: Array<{ action: any; state: any }> = [];
  private isProcessingQueue = false;

  constructor(config: DevToolsConfig = {}) {
    this.config = {
      name: config.name ?? "nexus-state",
      trace: config.trace ?? false,
      latency: config.latency ?? 100,
      maxAge: config.maxAge ?? 50,
      autoConnect: config.autoConnect ?? true,
      batchUpdates: config.batchUpdates ?? true,
      // New options from Phase 1
      useAtomNames: config.useAtomNames ?? true,
      showComputedAtoms: config.showComputedAtoms ?? false,
    };
  }

  apply(store: EnhancedStore): void {
    this.store = store;

    // Check if we can connect to DevTools
    if (this.config.autoConnect && this.canConnect()) {
      this.connect();
    }

    // Setup state monitoring
    this.setupStateMonitoring(store);
  }

  private setupStateMonitoring(store: EnhancedStore): void {
    // Use enhanced store API instead of overriding methods
    if (store.onStateChange) {
      store.onStateChange((state, action) => {
        this.handleStateChange(state, action);
      });
    } else {
      // Fallback to method interception
      this.setupFallbackMonitoring(store);
    }
  }

  private handleStateChange(state: any, action: any): void {
    if (!this.connection || !this.isTracking) return;

    // Enhance action with atom names if available
    const enhancedAction = this.enhanceAction(action);

    // Queue update for batching
    this.queueUpdate(enhancedAction, state);
  }
}
```

#### 2. Enhanced Action Format Using Atom Registry:

```typescript
private enhanceAction(action: any): any {
  // If action involves an atom, add its name
  if (action.atomId && this.config.useAtomNames) {
    try {
      const atomName = atomRegistry.getNameBySymbol(action.atomId);
      return {
        ...action,
        type: `${action.type} (${atomName})`,
        meta: {
          ...action.meta,
          atomName,
          atomType: atomRegistry.getMetadata(action.atomId)?.type,
        }
      };
    } catch (error) {
      // Fall back to original action
      return action;
    }
  }
  return action;
}
```

#### 3. Batch Update System:

```typescript
private queueUpdate(action: any, state: any): void {
  this.updateQueue.push({ action, state });

  if (this.config.batchUpdates) {
    this.scheduleBatchProcessing();
  } else {
    this.processQueueImmediately();
  }
}

private scheduleBatchProcessing(): void {
  if (this.isProcessingQueue || !this.updateQueue.length) return;

  this.isProcessingQueue = true;

  setTimeout(() => {
    this.processBatch();
    this.isProcessingQueue = false;
  }, this.config.latency);
}

private processBatch(): void {
  if (!this.updateQueue.length || !this.connection) return;

  const batch = this.updateQueue.slice();
  this.updateQueue = [];

  if (batch.length === 1) {
    // Single update
    this.connection.send(batch[0].action, batch[0].state);
  } else {
    // Batched update
    const batchedAction = {
      type: 'BATCH_UPDATE',
      payload: {
        count: batch.length,
        actions: batch.map(item => item.action),
        timestamp: Date.now(),
      }
    };
    const latestState = batch[batch.length - 1].state;
    this.connection.send(batchedAction, latestState);
  }
}
```

## 🚀 Implementation Steps

### Step 1: Analyze Current Plugin (1 hour)

1. Review existing `devtools-plugin.ts`
2. Identify integration points with new architecture
3. Document breaking changes needed
4. Plan migration strategy

### Step 2: Update Types and Interfaces (2 hours)

1. Add new configuration options from requirements
2. Define enhanced action format with atom metadata
3. Update plugin interface for new store API
4. Add TypeScript generics for better type safety

### Step 3: Refactor Core Plugin Class (3-4 hours)

1. Replace method overriding with event-based monitoring
2. Implement batch update system
3. Add atom registry integration for naming
4. Improve error handling and recovery

### Step 4: Implement Connection Management (2 hours)

1. Enhanced DevTools detection and connection
2. Connection state management (connected/disconnected/reconnecting)
3. Graceful degradation strategies
4. SSR compatibility checks

### Step 5: Add Performance Optimizations (2 hours)

1. Lazy state serialization
2. Update throttling based on frame rate
3. Memory leak prevention
4. Production mode optimizations

### Step 6: Write Comprehensive Tests (3 hours)

1. Unit tests for new functionality
2. Integration tests with enhanced store
3. Performance tests for batch system
4. Error recovery tests

## 🧪 Testing Requirements

### Unit Tests:

- [ ] Plugin initialization with various configs
- [ ] Action enhancement with atom names
- [ ] Batch update system functionality
- [ ] Connection state management
- [ ] Error handling and recovery

### Integration Tests:

- [ ] Works with enhanced store from Phase 1
- [ ] Integrates with atom registry
- [ ] SSR compatibility (no window)
- [ ] Time travel command handling (DEV-002)

### Performance Tests:

- [ ] Update latency < 5ms per action
- [ ] Memory usage < 2MB for 1000 updates
- [ ] Batch system reduces DevTools overhead by 50%+
- [ ] No frame drops during rapid updates

### Browser Compatibility:

- [ ] Chrome with Redux DevTools extension
- [ ] Firefox with Redux DevTools extension
- [ ] Safari (limited DevTools support)
- [ ] Edge (Chromium)

## ✅ Acceptance Criteria

### Code Quality:

- [ ] TypeScript strict mode passes
- [ ] No `any` types in public API
- [ ] 90%+ test coverage
- [ ] JSDoc for all public methods

### Functional:

- [ ] Plugin works with enhanced store
- [ ] Atom names displayed in DevTools when enabled
- [ ] Batch updates reduce DevTools spam
- [ ] Graceful degradation without extension
- [ ] SSR compatibility (no errors without window)

### Performance:

- [ ] Bundle size < 3KB gzipped
- [ ] Update overhead < 5ms
- [ ] Memory efficient (no leaks after disconnect)
- [ ] Batch system effective for rapid updates

## 📝 Notes for AI

### Important Integration Points:

1. **Enhanced Store API Usage:**

```typescript
// Instead of overriding store.set(), use:
if (store.onStateChange) {
  store.onStateChange((state, action) => {
    // Handle state change
  });
}

// If enhanced store doesn't have events, provide polyfill:
private setupFallbackMonitoring(store: Store): void {
  const originalSet = store.set;
  store.set = function(...args) {
    const result = originalSet.apply(this, args);
    const action = { type: 'SET', atomId: args[0].id };
    const state = store.getState();
    this.handleStateChange(state, action);
    return result;
  };
}
```

2. **Atom Registry Integration:**

```typescript
// Get atom name for DevTools display
private getAtomDisplayName(atomId: symbol): string {
  try {
    return atomRegistry.getNameBySymbol(atomId);
  } catch {
    // Fallback for unregistered atoms
    return atomId.toString();
  }
}

// Check if atom should be shown in DevTools
private shouldShowAtom(atomId: symbol): boolean {
  const metadata = atomRegistry.getMetadata(atomId);
  if (!metadata) return true;

  // Hide computed atoms if configured
  if (metadata.type === 'computed' && !this.config.showComputedAtoms) {
    return false;
  }

  return true;
}
```

3. **Production Optimizations:**

```typescript
// Tree-shaking friendly
if (process.env.NODE_ENV === "production") {
  // Minimal implementation for production
  export class DevToolsPlugin {
    apply() {
      // No-op in production unless explicitly enabled
      if (!this.config.enableInProduction) return;
      // Minimal implementation...
    }
  }
} else {
  // Full implementation for development
  export class DevToolsPlugin {
    // Full implementation...
  }
}
```

### Configuration Examples:

```typescript
// Basic usage
const store = createEnhancedStore([], {
  plugins: [
    new DevToolsPlugin({
      name: "MyApp Store",
      trace: true, // Stack traces
      latency: 50, // 50ms batching
    }),
  ],
});

// Advanced configuration
const store = createEnhancedStore([], {
  plugins: [
    new DevToolsPlugin({
      name: "User Session",
      useAtomNames: true,
      showComputedAtoms: false,
      batchUpdates: true,
      maxAge: 100, // Keep 100 actions in history
      actionSanitizer: (action) => {
        // Remove sensitive data
        if (action.type.includes("PASSWORD")) {
          return { ...action, payload: "[REDACTED]" };
        }
        return action;
      },
    }),
  ],
});
```

## 🔄 Related Tasks

- **Depends on**: CORE-001, CORE-002, CORE-003
- **Blocks**: DEV-002, DEV-003
- **Related**: PERF-001 (Performance optimizations)

## 🚨 Risk Assessment

| Risk                          | Probability | Impact | Mitigation                                   |
| ----------------------------- | ----------- | ------ | -------------------------------------------- |
| Breaking existing plugin API  | Medium      | High   | Provide compatibility layer, migration guide |
| Performance regression        | Medium      | Medium | Benchmark tests, gradual optimization        |
| DevTools compatibility issues | Low         | High   | Feature detection, fallback modes            |
| Memory leaks in batch system  | Medium      | High   | Weak references, cleanup hooks               |

---

_Task ID: DEV-001_  
_Estimated Time: 10-12 hours_  
_Priority: 🔴 High_  
_Status: Not Started_  
_Assigned To: AI Developer_
