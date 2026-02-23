# ENT-PERF-001: Performance Monitoring Infrastructure

**Status**: 🟢 Ready  
**Priority**: P0 - Critical  
**Estimated Effort**: 2 weeks  
**Phase**: 1 - Core Enhancement  
**Dependencies**: ENT-EVT-001 (Event System)

---

## Objective

Implement built-in performance monitoring with real-time metrics, budgets, alerts, and integration with popular monitoring services (Sentry, DataDog, New Relic).

---

## Current State (TanStack Table)

```typescript
// ❌ No performance monitoring
// Manual implementation required
const start = performance.now()
const model = table.getRowModel()
console.log(performance.now() - start)
```

---

## Target State (GridKit Enhanced)

```typescript
// ✅ Built-in monitoring
const table = useGridEnhancedTable({
  data,
  columns,
  features: {
    performance: {
      enabled: true,
      budgets: {
        rowModelBuild: 16,  // 1 frame @ 60fps
        sorting: 50,
        filtering: 100
      },
      alerts: {
        enabled: true,
        destinations: ['console', 'sentry']
      }
    }
  }
})

// Real-time access to metrics
const { metrics } = table
console.log(metrics.getOperationStats('getRowModel'))

// Automatic alerts
table.on('performance:budgetViolation', (event) => {
  console.error(`Budget violated: ${event.payload.operation}`)
})
```

---

## Technical Requirements

### 1. Performance Metrics Types

**File**: `packages/core/src/performance/types/metrics.ts`

```typescript
export interface OperationMetrics {
  operation: string
  count: number
  avgTime: number
  minTime: number
  maxTime: number
  totalTime: number
  p50: number
  p95: number
  p99: number
  lastExecuted: number
}

export interface MemoryMetrics {
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  leakedRows: number
  leakedColumns: number
}

export interface PerformanceBudget {
  operation: string
  budgetMs: number
  enabled: boolean
  severity: 'warning' | 'error' | 'critical'
}

export interface BudgetViolation {
  operation: string
  actual: number
  budget: number
  severity: 'warning' | 'error' | 'critical'
  timestamp: number
  impact: 'userVisible' | 'background'
}
```

### 2. Enhanced Performance Monitor

**File**: `packages/core/src/performance/monitor/EnhancedPerformanceMonitor.ts`

```typescript
export class EnhancedPerformanceMonitor extends PerformanceMonitor {
  private metrics: Map<string, OperationMetrics> = new Map()
  private budgets: Map<string, PerformanceBudget> = new Map()
  private alertDestinations: AlertDestination[] = []
  
  // Metrics tracking
  trackOperation(operation: string, durationMs: number): void
  getOperationStats(operation: string): OperationMetrics | undefined
  getAllStats(): OperationMetrics[]
  
  // Budget management
  setBudget(budget: PerformanceBudget): void
  getBudget(operation: string): PerformanceBudget | undefined
  checkBudget(operation: string, durationMs: number): BudgetViolation | null
  
  // Memory tracking
  trackMemoryUsage(): void
  getMemoryMetrics(): MemoryMetrics
  detectMemoryLeaks(): MemoryLeak[]
  
  // Alerts
  addAlertDestination(destination: AlertDestination): void
  removeAlertDestination(id: string): void
  sendAlert(violation: BudgetViolation): void
  
  // Reports
  generateReport(options?: ReportOptions): PerformanceReport
  exportMetrics(format: 'json' | 'csv'): string
}
```

### 3. Alert Destinations

**File**: `packages/core/src/performance/alerts/index.ts`

```typescript
export interface AlertDestination {
  id: string
  type: 'console' | 'sentry' | 'datadog' | 'newrelic' | 'custom'
  send(violation: BudgetViolation): Promise<void>
}

export class ConsoleAlertDestination implements AlertDestination {
  id = 'console'
  type = 'console' as const
  
  async send(violation: BudgetViolation): Promise<void> {
    console.error(`[Performance] Budget violated:`, violation)
  }
}

export class SentryAlertDestination implements AlertDestination {
  id = 'sentry'
  type = 'sentry' as const
  
  constructor(private options: SentryOptions) {}
  
  async send(violation: BudgetViolation): Promise<void> {
    Sentry.captureMessage('Performance budget violation', {
      level: violation.severity === 'critical' ? 'error' : 'warning',
      tags: {
        operation: violation.operation,
        impact: violation.impact
      },
      extra: violation
    })
  }
}

export class DataDogAlertDestination implements AlertDestination {
  id = 'datadog'
  type = 'datadog' as const
  
  constructor(private options: DataDogOptions) {}
  
  async send(violation: BudgetViolation): Promise<void> {
    // DataDog integration
  }
}
```

### 4. Performance Budgets Configuration

**File**: `packages/core/src/performance/budgets/presets.ts`

```typescript
export const PERFORMANCE_BUDGETS = {
  // Frame budget (60fps = 16ms)
  FRAME_BUDGET: 16,
  
  // Interactive budgets
  INTERACTIVE: {
    rowModelBuild: 16,
    sorting: 50,
    filtering: 100,
    pagination: 10,
    selection: 5
  },
  
  // Rendering budgets
  RENDERING: {
    cellRender: 1,
    rowRender: 5,
    tableRender: 100
  },
  
  // Background budgets
  BACKGROUND: {
    dataFetch: 1000,
    stateSync: 100,
    cacheUpdate: 50
  }
} as const

export function createBudgetPreset(
  type: 'strict' | 'normal' | 'relaxed'
): PerformanceBudget[] {
  // Return appropriate budgets
}
```

### 5. Integration with Table

**File**: `packages/core/src/performance/integration/TablePerformanceIntegration.ts`

```typescript
export class TablePerformanceIntegration {
  constructor(
    private table: TableInstance,
    private monitor: EnhancedPerformanceMonitor
  ) {}
  
  // Automatic tracking
  trackRowModelBuild(): void
  trackSorting(): void
  trackFiltering(): void
  trackPagination(): void
  
  // Lifecycle integration
  initialize(): void
  destroy(): void
  
  // Event integration
  private setupEventListeners(): void
  private handleBudgetViolation(violation: BudgetViolation): void
}
```

---

## Implementation Plan

### Step 1: Core Metrics System
- [ ] Define metrics types
- [ ] Implement OperationMetrics tracking
- [ ] Add percentile calculations (p50, p95, p99)
- [ ] Implement MemoryMetrics tracking
- [ ] Write unit tests

### Step 2: Budget Management
- [ ] Define budget types and presets
- [ ] Implement budget checking
- [ ] Add violation detection
- [ ] Create budget configuration API
- [ ] Write tests

### Step 3: Alert System
- [ ] Create alert destination interface
- [ ] Implement console destination
- [ ] Implement Sentry destination
- [ ] Implement DataDog destination
- [ ] Add custom destination support
- [ ] Write tests

### Step 4: Enhanced Monitor
- [ ] Extend existing PerformanceMonitor
- [ ] Add metrics tracking methods
- [ ] Add budget management
- [ ] Add alert integration
- [ ] Add report generation
- [ ] Write tests

### Step 5: Table Integration
- [ ] Create integration layer
- [ ] Add automatic operation tracking
- [ ] Integrate with event system
- [ ] Add configuration options
- [ ] Write integration tests

### Step 6: Memory Leak Detection
- [ ] Implement row leak detection
- [ ] Implement column leak detection
- [ ] Add cleanup tracking
- [ ] Create leak reports
- [ ] Write tests

### Step 7: Documentation
- [ ] API documentation
- [ ] Configuration guide
- [ ] Integration examples
- [ ] Best practices
- [ ] Troubleshooting guide

---

## Testing Strategy

### Unit Tests

```typescript
describe('EnhancedPerformanceMonitor', () => {
  it('should track operation metrics', () => {
    const monitor = new EnhancedPerformanceMonitor()
    
    monitor.trackOperation('getRowModel', 10)
    monitor.trackOperation('getRowModel', 20)
    monitor.trackOperation('getRowModel', 15)
    
    const stats = monitor.getOperationStats('getRowModel')
    
    expect(stats).toMatchObject({
      operation: 'getRowModel',
      count: 3,
      avgTime: 15,
      minTime: 10,
      maxTime: 20
    })
  })
  
  it('should detect budget violations', () => {
    const monitor = new EnhancedPerformanceMonitor()
    
    monitor.setBudget({
      operation: 'getRowModel',
      budgetMs: 16,
      enabled: true,
      severity: 'error'
    })
    
    const violation = monitor.checkBudget('getRowModel', 25)
    
    expect(violation).toMatchObject({
      operation: 'getRowModel',
      actual: 25,
      budget: 16,
      severity: 'error'
    })
  })
})
```

### Integration Tests

```typescript
describe('Performance Monitoring Integration', () => {
  it('should track table operations automatically', async () => {
    const table = createTable({
      data: generateData(10000),
      columns,
      features: {
        performance: {
          enabled: true,
          budgets: {
            rowModelBuild: 16
          }
        }
      }
    })
    
    const violations: BudgetViolation[] = []
    table.on('performance:budgetViolation', (event) => {
      violations.push(event.payload)
    })
    
    // Trigger expensive operation
    table.setSorting([{ id: 'name', desc: false }])
    
    await waitFor(() => {
      expect(table.metrics.getOperationStats('sorting')).toBeDefined()
    })
  })
})
```

---

## Performance Requirements

- **Metrics tracking overhead**: < 0.1ms per operation
- **Memory overhead**: < 100KB for 1000 operations tracked
- **Budget check**: < 0.05ms
- **Alert send**: < 5ms (async)
- **Report generation**: < 50ms for 1000 operations

---

## Success Criteria

- ✅ All metrics tracked accurately
- ✅ Budget violations detected reliably
- ✅ Alerts sent to all destinations
- ✅ Memory leak detection working
- ✅ Integration with table seamless
- ✅ Performance overhead minimal
- ✅ All tests passing (>95% coverage)
- ✅ Documentation complete

---

## Configuration Examples

### Basic Setup
```typescript
const table = createTable({
  data,
  columns,
  features: {
    performance: {
      enabled: true
    }
  }
})
```

### With Budgets
```typescript
const table = createTable({
  data,
  columns,
  features: {
    performance: {
      enabled: true,
      budgets: createBudgetPreset('strict')
    }
  }
})
```

### With Alerts
```typescript
const table = createTable({
  data,
  columns,
  features: {
    performance: {
      enabled: true,
      budgets: PERFORMANCE_BUDGETS.INTERACTIVE,
      alerts: {
        enabled: true,
        destinations: [
          new SentryAlertDestination({ dsn: '...' }),
          new DataDogAlertDestination({ apiKey: '...' })
        ]
      }
    }
  }
})
```

---

## Files to Create/Modify

### New Files
- `packages/core/src/performance/types/metrics.ts`
- `packages/core/src/performance/monitor/EnhancedPerformanceMonitor.ts`
- `packages/core/src/performance/alerts/index.ts`
- `packages/core/src/performance/alerts/console.ts`
- `packages/core/src/performance/alerts/sentry.ts`
- `packages/core/src/performance/alerts/datadog.ts`
- `packages/core/src/performance/budgets/presets.ts`
- `packages/core/src/performance/integration/TablePerformanceIntegration.ts`
- `packages/core/src/performance/__tests__/enhanced-monitor.test.ts`

### Modified Files
- `packages/core/src/performance/index.ts` (exports)
- `packages/core/src/table/factory/create-table.ts` (integration)
- `packages/core/src/table/instance/TableInstance.ts` (metrics access)

---

## References

- [Performance Monitoring Documentation](../../packages/core/src/performance/README.md)
- [Complementary Benefits](../../docs/COMPLEMENTARY_SOLUTION_BENEFITS.md)
- [Performance Quick Start](../../PERFORMANCE_MONITORING_QUICK_START.md)

---

**Author**: GridKit Team  
**Created**: 2026-02-23  
**Last Updated**: 2026-02-23
