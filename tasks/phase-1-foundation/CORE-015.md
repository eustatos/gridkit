# CORE-015: Built-in Performance Monitoring System

## Task Card

```
task_id: CORE-015
priority: P1
complexity: Medium
estimated_tokens: ~12,000
ai_ready: yes
dependencies: [CORE-001, CORE-002, CORE-005A]
requires_review: true (performance-sensitive code)
```

## 🎯 **Core Objective**

Implement a zero-overhead performance monitoring system that validates performance budgets, detects regressions, and provides actionable insights for GridKit tables. The system must be completely disabled in production by default.

## 📋 **Implementation Scope**

### **1. Performance Monitor Core**

````typescript
/**
 * Zero-overhead performance monitor for GridKit tables.
 * Collects metrics only when explicitly enabled via debug mode.
 *
 * @example
 * ```typescript
 * const table = createTable({
 *   columns,
 *   data,
 *   debug: {
 *     performance: {
 *       enabled: true,
 *       budgets: { maxRenderTime: 16 }
 *     }
 *   }
 * });
 *
 * // Access metrics
 * const metrics = table.metrics;
 * console.log(metrics.getReport());
 * ```
 */
export interface PerformanceMonitor {
  // === Measurement ===

  /**
   * Start timing an operation with optional metadata.
   * Returns cleanup function that records duration.
   *
   * @example
   * ```typescript
   * const stop = monitor.start('render', { rows: 1000 });
   * try {
   *   // operation
   * } finally {
   *   stop(); // Records duration automatically
   * }
   * ```
   */
  start(operation: string, meta?: OperationMeta): () => void;

  /**
   * Measure memory usage delta for an operation.
   */
  measureMemory<T>(operation: () => T, context?: string): T;

  /**
   * Track async operation with Promise wrapper.
   */
  trackAsync<T>(promise: Promise<T>, operation: string): Promise<T>;

  // === Metrics Access ===

  /**
   * Get current performance metrics snapshot.
   */
  getMetrics(): PerformanceMetrics;

  /**
   * Get operation-specific statistics.
   */
  getOperationStats(operation: string): OperationStats;

  /**
   * Check if any performance budgets are violated.
   */
  checkBudgets(): BudgetViolation[];

  // === Configuration ===

  /**
   * Update performance budgets at runtime.
   */
  setBudgets(budgets: PerformanceBudgets): void;

  /**
   * Clear all collected metrics.
   */
  clear(): void;

  /**
   * Enable/disable monitoring at runtime.
   */
  setEnabled(enabled: boolean): void;

  // === Event System ===

  /**
   * Subscribe to performance events.
   */
  on(
    event: 'budgetViolation',
    handler: (violation: BudgetViolation) => void
  ): Unsubscribe;
  on(
    event: 'metricUpdate',
    handler: (metrics: PerformanceMetrics) => void
  ): Unsubscribe;
}

/**
 * Performance metrics collected by the monitor.
 */
export interface PerformanceMetrics {
  readonly operations: Record<string, OperationStats>;
  readonly memory: MemoryMetrics;
  readonly timings: TimingMetrics;
  readonly budgets: PerformanceBudgets;
  readonly violations: BudgetViolation[];
}

/**
 * Operation-specific statistics.
 */
export interface OperationStats {
  readonly count: number;
  readonly totalTime: number;
  readonly avgTime: number;
  readonly minTime: number;
  readonly maxTime: number;
  readonly p95Time: number;
  readonly errors: number;
  readonly lastExecuted: number;
}

/**
 * Memory usage metrics.
 */
export interface MemoryMetrics {
  readonly heapUsed: number;
  readonly heapTotal: number;
  readonly external: number;
  readonly arrayBuffers: number;
  readonly peakHeapUsed: number;
  readonly allocations: number;
  readonly deallocations: number;
  readonly leakedBytes: number;
}

/**
 * Timing metrics for critical paths.
 */
export interface TimingMetrics {
  readonly tableCreation: number;
  readonly stateUpdate: number;
  readonly rowModelBuild: number;
  readonly renderCycle: number;
  readonly eventProcessing: number;
}
````

### **2. Performance Budget System**

````typescript
/**
 * Performance budgets for GridKit tables.
 * All values are in milliseconds unless specified.
 *
 * @example
 * ```typescript
 * const budgets: PerformanceBudgets = {
 *   tableCreation: 100, // 100ms max
 *   stateUpdate: 5,     // 5ms max
 *   renderCycle: 16,    // 60fps budget
 *   memory: {
 *     baseOverhead: 5 * 1024 * 1024, // 5MB
 *     perRow: 1024,                  // 1KB per row
 *   }
 * };
 * ```
 */
export interface PerformanceBudgets {
  // === Timing Budgets ===

  /** Maximum table creation time */
  readonly tableCreation?: number;

  /** Maximum state update time */
  readonly stateUpdate?: number;

  /** Maximum render cycle time (for 60fps) */
  readonly renderCycle?: number;

  /** Maximum row model build time */
  readonly rowModelBuild?: number;

  /** Maximum event processing time */
  readonly eventProcessing?: number;

  // === Memory Budgets ===

  readonly memory?: MemoryBudgets;

  // === Custom Operation Budgets ===

  readonly operations?: Record<string, number>;

  // === Thresholds ===

  /** Warning threshold (percentage of budget) */
  readonly warningThreshold?: number; // default: 0.8 (80%)

  /** Critical threshold (percentage of budget) */
  readonly criticalThreshold?: number; // default: 0.95 (95%)
}

/**
 * Memory usage budgets in bytes.
 */
export interface MemoryBudgets {
  /** Base framework overhead */
  readonly baseOverhead: number;

  /** Memory per row (estimated) */
  readonly perRow: number;

  /** Maximum memory increase per update */
  readonly maxIncreasePerUpdate: number;

  /** Memory leak detection threshold */
  readonly leakThreshold: number; // percentage increase
}

/**
 * Detected budget violation.
 */
export interface BudgetViolation {
  readonly type: 'timing' | 'memory' | 'custom';
  readonly operation: string;
  readonly actual: number;
  readonly budget: number;
  readonly percentage: number;
  readonly severity: 'warning' | 'critical';
  readonly timestamp: number;
  readonly context: ViolationContext;
}

/**
 * Context for budget violations.
 */
export interface ViolationContext {
  readonly tableId?: GridId;
  readonly rowCount?: number;
  readonly columnCount?: number;
  readonly operationData?: Record<string, unknown>;
  readonly stackTrace?: string;
}
````

### **3. Memory Leak Detection**

```typescript
/**
 * Advanced memory leak detection with weak reference tracking.
 * Uses FinalizationRegistry for automatic cleanup detection.
 */
export interface MemoryLeakDetector {
  /**
   * Track object creation with optional category.
   */
  track(object: object, category?: string, meta?: object): void;

  /**
   * Mark object as intentionally retained.
   */
  retain(object: object, reason?: string): void;

  /**
   * Check for suspected leaks.
   */
  checkLeaks(): SuspectedLeak[];

  /**
   * Get memory leak statistics.
   */
  getStats(): LeakDetectionStats;

  /**
   * Clear tracking data.
   */
  clear(): void;
}

/**
 * Suspected memory leak detection.
 */
export interface SuspectedLeak {
  readonly category: string;
  readonly count: number;
  readonly expectedCount?: number;
  readonly growthRate: number;
  readonly firstSeen: number;
  readonly lastSeen: number;
  readonly sampleObjects: WeakRef<object>[];
}

/**
 * Leak detection statistics.
 */
export interface LeakDetectionStats {
  readonly trackedObjects: number;
  readonly collectedObjects: number;
  readonly retainedObjects: number;
  readonly suspectedLeaks: number;
  readonly categories: Record<string, CategoryStats>;
}

/**
 * Category-specific leak stats.
 */
export interface CategoryStats {
  readonly current: number;
  readonly peak: number;
  readonly collected: number;
  readonly growthRate: number;
}
```

### **4. Performance Monitor Factory**

```typescript
/**
 * Creates a performance monitor instance.
 * Zero-cost when disabled - all methods become no-ops.
 */
export function createPerformanceMonitor(
  config: PerformanceConfig = {}
): PerformanceMonitor {
  const enabled = config.enabled ?? false;

  if (!enabled) {
    // Return no-op implementation
    return createNoopMonitor();
  }

  // Create enabled monitor with actual implementation
  return new PerformanceMonitorImpl(config);
}

/**
 * Performance monitor configuration.
 */
export interface PerformanceConfig {
  /** Enable/disable monitoring */
  readonly enabled?: boolean;

  /** Performance budgets */
  readonly budgets?: PerformanceBudgets;

  /** Enable memory leak detection */
  readonly detectMemoryLeaks?: boolean;

  /** Sampling rate (0-1) for high-frequency operations */
  readonly samplingRate?: number;

  /** Maximum number of stored samples per operation */
  readonly maxSamples?: number;

  /** Callback for budget violations */
  readonly onViolation?: (violation: BudgetViolation) => void;

  /** Custom metrics collectors */
  readonly collectors?: PerformanceCollector[];
}

/**
 * Custom performance metric collector.
 */
export interface PerformanceCollector {
  readonly name: string;
  collect(): Promise<MetricData> | MetricData;
}

/**
 * No-op implementation for production.
 */
function createNoopMonitor(): PerformanceMonitor {
  return {
    start: () => () => {},
    measureMemory: (fn) => fn(),
    trackAsync: (promise) => promise,
    getMetrics: () => EMPTY_METRICS,
    getOperationStats: () => EMPTY_STATS,
    checkBudgets: () => [],
    setBudgets: () => {},
    clear: () => {},
    setEnabled: () => {},
    on: () => () => {},
  };
}

/**
 * Actual implementation (only created when enabled).
 */
class PerformanceMonitorImpl implements PerformanceMonitor {
  private measurements = new Map<string, Measurement[]>();
  private budgets: PerformanceBudgets;
  private memoryTracker?: MemoryLeakDetector;
  private listeners = new Map<string, Set<Function>>();

  constructor(private config: Required<PerformanceConfig>) {
    this.budgets = config.budgets ?? DEFAULT_BUDGETS;

    if (config.detectMemoryLeaks) {
      this.memoryTracker = createMemoryLeakDetector();
    }
  }

  start(operation: string, meta?: OperationMeta): () => void {
    // Apply sampling for high-frequency operations
    if (this.shouldSample(operation)) {
      return () => {}; // Skip measurement
    }

    const startTime = performance.now();
    const startMemory = this.measureMemoryUsage();

    return () => {
      const duration = performance.now() - startTime;
      const memoryDelta = this.measureMemoryUsage() - startMemory;

      this.recordMeasurement(operation, duration, memoryDelta, meta);
      this.checkOperationBudget(operation, duration, memoryDelta, meta);
    };
  }

  private shouldSample(operation: string): boolean {
    const rate = this.config.samplingRate;
    if (rate === undefined || rate >= 1) return false;

    // Simple deterministic sampling based on operation hash
    const hash = this.hashString(operation);
    return (hash % 100) / 100 >= rate;
  }

  private recordMeasurement(
    operation: string,
    duration: number,
    memoryDelta: number,
    meta?: OperationMeta
  ): void {
    const measurement: Measurement = {
      duration,
      memoryDelta,
      timestamp: performance.now(),
      meta,
    };

    let measurements = this.measurements.get(operation);
    if (!measurements) {
      measurements = [];
      this.measurements.set(operation, measurements);
    }

    measurements.push(measurement);

    // Enforce max samples limit
    if (measurements.length > this.config.maxSamples) {
      measurements.shift();
    }

    // Notify listeners
    this.emit('metricUpdate', this.getMetrics());
  }

  private checkOperationBudget(
    operation: string,
    duration: number,
    memoryDelta: number,
    meta?: OperationMeta
  ): void {
    const budget = this.getBudgetForOperation(operation);
    if (!budget) return;

    const percentage = duration / budget;
    const warningThreshold = this.budgets.warningThreshold ?? 0.8;
    const criticalThreshold = this.budgets.criticalThreshold ?? 0.95;

    let severity: 'warning' | 'critical' | null = null;
    if (percentage >= criticalThreshold) {
      severity = 'critical';
    } else if (percentage >= warningThreshold) {
      severity = 'warning';
    }

    if (severity) {
      const violation: BudgetViolation = {
        type: 'timing',
        operation,
        actual: duration,
        budget,
        percentage,
        severity,
        timestamp: Date.now(),
        context: {
          tableId: meta?.tableId,
          rowCount: meta?.rowCount,
          operationData: meta,
        },
      };

      this.config.onViolation?.(violation);
      this.emit('budgetViolation', violation);
    }
  }
}
```

### **5. Integration with Table Factory**

```typescript
/**
 * Integrates performance monitoring into table creation.
 */
export function withPerformanceMonitoring<TData extends RowData>(
  table: Table<TData>,
  config?: PerformanceConfig
): Table<TData> {
  const monitor = createPerformanceMonitor(config);

  if (!config?.enabled) {
    return table;
  }

  // Wrap critical table methods
  const wrappedTable: Table<TData> = {
    ...table,

    // Monitor state updates
    setState: (updater) => {
      const stop = monitor.start('stateUpdate', {
        tableId: table.id,
        operation: typeof updater === 'function' ? 'function' : 'direct',
      });

      try {
        table.setState(updater);
      } finally {
        stop();
      }
    },

    // Monitor row model access
    getRowModel: () => {
      const stop = monitor.start('rowModelBuild', {
        tableId: table.id,
        rowCount: table.getState().data.length,
      });

      try {
        return table.getRowModel();
      } finally {
        stop();
      }
    },

    // Expose metrics
    metrics: monitor.getMetrics(),

    // Cleanup on destroy
    destroy: () => {
      monitor.clear();
      table.destroy();
    },
  };

  return wrappedTable;
}
```

## 🚫 **DO NOT IMPLEMENT**

- ❌ No UI components or visualizations
- ❌ No complex statistical analysis libraries
- ❌ No persistent storage or database integration
- ❌ No network request monitoring
- ❌ No framework-specific integrations
- ❌ No automatic performance optimization algorithms

## 📁 **File Structure**

```
packages/core/src/performance/
├── monitor/
│   ├── PerformanceMonitor.ts     # Main interface
│   ├── PerformanceMonitorImpl.ts # Actual implementation
│   ├── NoopMonitor.ts           # Zero-cost implementation
│   └── factory.ts               # Creation utilities
├── budgets/
│   ├── PerformanceBudgets.ts    # Budget definitions
│   ├── BudgetValidator.ts       # Budget checking
│   └── defaults.ts             # Default budgets
├── memory/
│   ├── MemoryLeakDetector.ts   # Leak detection
│   ├── MemoryTracker.ts        # Memory usage tracking
│   └── WeakRefTracker.ts       # Weak reference utilities
├── metrics/
│   ├── PerformanceMetrics.ts   # Metrics collection
│   ├── OperationStats.ts       # Statistics calculation
│   └── reporters.ts           # Metric reporting
├── integration/
│   ├── TableIntegration.ts    # Table wrapper
│   └── EventIntegration.ts    # Event system hooks
└── index.ts                   # Public exports
```

## 🧪 **Test Requirements (Critical)**

```typescript
describe('Performance Monitor', () => {
  test('No overhead when disabled', () => {
    const monitor = createPerformanceMonitor({ enabled: false });

    // Should return immediately with no measurement
    const start = performance.now();
    const stop = monitor.start('test');
    stop();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(0.1); // < 0.1ms overhead
  });

  test('Accurately measures operations', async () => {
    const monitor = createPerformanceMonitor({ enabled: true });

    const stop = monitor.start('testOperation');
    await delay(10); // 10ms delay
    stop();

    const stats = monitor.getOperationStats('testOperation');
    expect(stats.count).toBe(1);
    expect(stats.avgTime).toBeGreaterThan(9);
    expect(stats.avgTime).toBeLessThan(11);
  });

  test('Detects budget violations', () => {
    const monitor = createPerformanceMonitor({
      enabled: true,
      budgets: { testOperation: 5 }, // 5ms budget
    });

    const violations: BudgetViolation[] = [];
    monitor.on('budgetViolation', (v) => violations.push(v));

    const stop = monitor.start('testOperation');
    busyWait(10); // 10ms busy work
    stop();

    expect(violations).toHaveLength(1);
    expect(violations[0].severity).toBe('critical');
    expect(violations[0].actual).toBeGreaterThan(10);
  });

  test('Memory leak detection works', () => {
    const monitor = createPerformanceMonitor({
      enabled: true,
      detectMemoryLeaks: true,
    });

    const objects: any[] = [];

    // Create objects without cleaning up
    for (let i = 0; i < 100; i++) {
      const obj = { id: i };
      monitor.track(obj, 'testObjects');
      objects.push(obj); // Prevent GC
    }

    // After cleanup, check for leaks
    objects.length = 0;
    global.gc?.();

    const leaks = monitor.checkLeaks();
    expect(leaks.some((l) => l.category === 'testObjects')).toBe(true);
  });
});
```

## 💡 **Critical Design Principles**

```typescript
// 1. Zero-cost when disabled
const NOOP = Object.freeze({
  start: () => () => {},
  // ... all other methods are no-ops
});

// 2. Sampling for high-frequency operations
function shouldSample(operation: string, rate: number): boolean {
  // Deterministic sampling based on operation hash
  return (hash(operation) % 1000) / 1000 > rate;
}

// 3. Weak references for memory safety
class SafeTracker {
  private refs = new WeakRef() < object > [];
  track(obj: object) {
    this.refs.push(new WeakRef(obj));
  }
}
```

## 📊 **Success Metrics**

- ✅ Zero runtime overhead when disabled (< 0.01ms per call)
- ✅ Accurate measurements (±1% error margin)
- ✅ Memory leak detection with < 1% false positive rate
- ✅ Budget violation detection within 1ms of occurrence
- ✅ No memory leaks in monitor itself
- ✅ 100% test coverage for critical paths

## 🎯 **AI Implementation Instructions**

1. **Start with no-op implementation** - ensure zero overhead
2. **Implement measurement core** - accurate timing and memory
3. **Add budget system** - violation detection and reporting
4. **Implement memory leak detection** - weak reference tracking
5. **Create integration utilities** - table and event wrappers
6. **Write comprehensive tests** - focus on accuracy and performance

**Critical:** Performance monitoring must not affect the performance it's measuring. All measurements must be accurate and non-intrusive.

---

**Status:** Ready for implementation. Performance-sensitive code requires careful optimization.
