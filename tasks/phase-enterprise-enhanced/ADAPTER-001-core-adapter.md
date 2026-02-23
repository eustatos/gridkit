# ADAPTER-001: Core TanStack Adapter Implementation

**Status**: 🟢 Ready  
**Priority**: P0 - Critical  
**Estimated Effort**: 2 weeks  
**Phase**: 1 - Core Enhancement  
**Dependencies**: ENT-EVT-001, ENT-PERF-001, ENT-VAL-001

---

## Objective

Create core adapter that integrates GridKit Enhanced features with TanStack Table without breaking existing API.

---

## Architecture

```
TanStack Table Instance
        ↓
   Adapter Layer (enrichment)
        ↓
GridKit Enhanced Table
(TanStack API + GridKit features)
```

---

## Technical Requirements

### 1. Core Adapter Function

**File**: `packages/tanstack-adapter/src/core/createEnhancedTable.ts`

```typescript
import type { Table } from '@tanstack/react-table'
import type { EnhancedTableFeatures } from './types'

export function createEnhancedTable<TData>(
  tanstackTable: Table<TData>,
  features?: EnhancedTableFeatures
): EnhancedTable<TData> {
  // Create GridKit event bus
  const eventBus = new EnhancedEventBus(features?.events)
  
  // Create performance monitor
  const monitor = features?.performance 
    ? new EnhancedPerformanceMonitor(features.performance)
    : undefined
  
  // Create validation manager
  const validator = features?.validation
    ? new ValidationManager(features.validation)
    : undefined
  
  // Wrap TanStack table with GridKit features
  return {
    // Preserve all TanStack methods
    ...tanstackTable,
    
    // Add GridKit features
    on: eventBus.on.bind(eventBus),
    off: eventBus.off.bind(eventBus),
    emit: eventBus.emit.bind(eventBus),
    
    metrics: monitor,
    validator,
    
    // Enhanced methods that trigger events
    setSorting: (updater) => {
      const before = tanstackTable.getState().sorting
      tanstackTable.setSorting(updater)
      const after = tanstackTable.getState().sorting
      
      eventBus.emit({
        type: 'sorting:change',
        payload: { before, after }
      })
    },
    
    // ... other enhanced methods
  }
}
```

### 2. HOC Pattern for Gradual Adoption

**File**: `packages/tanstack-adapter/src/enhancers/index.ts`

```typescript
export function withEvents<TData>(
  table: Table<TData>,
  config?: EventConfig
): Table<TData> & EventFeatures {
  const eventBus = new EnhancedEventBus(config)
  
  return {
    ...table,
    on: eventBus.on.bind(eventBus),
    off: eventBus.off.bind(eventBus),
    emit: eventBus.emit.bind(eventBus)
  }
}

export function withPerformanceMonitoring<TData>(
  table: Table<TData>,
  config?: PerformanceConfig
): Table<TData> & PerformanceFeatures {
  const monitor = new EnhancedPerformanceMonitor(config)
  
  // Wrap methods to track performance
  const wrappedTable = { ...table }
  
  const methodsToTrack = [
    'getRowModel',
    'getSortedRowModel',
    'getFilteredRowModel'
  ]
  
  methodsToTrack.forEach(method => {
    const original = table[method]
    wrappedTable[method] = (...args) => {
      return monitor.track(method, () => original(...args))
    }
  })
  
  return {
    ...wrappedTable,
    metrics: monitor
  }
}

export function withValidation<TData>(
  table: Table<TData>,
  config?: ValidationConfig
): Table<TData> & ValidationFeatures {
  const validator = new ValidationManager(config)
  
  return {
    ...table,
    validateRow: (row, index) => validator.validateRow(row, table.options.columns, index),
    validateAll: () => validator.validateAll(table.getRowModel().rows, table.options.columns),
    validator
  }
}

export function withPlugins<TData>(
  table: Table<TData>,
  plugins: Plugin[]
): Table<TData> & PluginFeatures {
  const manager = new PluginManager(plugins)
  
  manager.initialize({ table })
  
  return {
    ...table,
    registerPlugin: manager.register.bind(manager),
    unregisterPlugin: manager.unregister.bind(manager),
    getPlugin: manager.get.bind(manager)
  }
}
```

### 3. Type Definitions

**File**: `packages/tanstack-adapter/src/types/enhanced.ts`

```typescript
import type { Table } from '@tanstack/react-table'
import type { 
  EventBus, 
  PerformanceMonitor, 
  ValidationManager 
} from '@gridkit/core'

export interface EnhancedTable<TData> extends Table<TData> {
  // Event features
  on: EventBus['on']
  off: EventBus['off']
  emit: EventBus['emit']
  
  // Performance features
  metrics?: PerformanceMonitor
  
  // Validation features
  validator?: ValidationManager
  validateRow?: (row: TData, index: number) => Promise<ValidationResult>
  validateAll?: () => Promise<ValidationReport>
  
  // Plugin features
  registerPlugin?: (plugin: Plugin) => void
  unregisterPlugin?: (pluginId: string) => void
  getPlugin?: (pluginId: string) => Plugin | undefined
}

export interface EnhancedTableFeatures {
  events?: EventConfig | boolean
  performance?: PerformanceConfig | boolean
  validation?: ValidationConfig | boolean
  plugins?: Plugin[]
  debug?: DebugConfig | boolean
}

export interface EventFeatures {
  on: EventBus['on']
  off: EventBus['off']
  emit: EventBus['emit']
}

export interface PerformanceFeatures {
  metrics: PerformanceMonitor
}

export interface ValidationFeatures {
  validator: ValidationManager
  validateRow: (row: any, index: number) => Promise<ValidationResult>
  validateAll: () => Promise<ValidationReport>
}

export interface PluginFeatures {
  registerPlugin: (plugin: Plugin) => void
  unregisterPlugin: (pluginId: string) => void
  getPlugin: (pluginId: string) => Plugin | undefined
}
```

### 4. Method Interception

**File**: `packages/tanstack-adapter/src/core/methodInterceptor.ts`

```typescript
export class MethodInterceptor<TData> {
  constructor(
    private table: Table<TData>,
    private eventBus: EventBus,
    private monitor?: PerformanceMonitor
  ) {}
  
  intercept<K extends keyof Table<TData>>(
    methodName: K,
    hooks?: InterceptHooks<TData, K>
  ): Table<TData>[K] {
    const original = this.table[methodName]
    
    return ((...args: any[]) => {
      // Before hook
      hooks?.before?.(args)
      
      // Event: method:start
      this.eventBus.emit({
        type: `${String(methodName)}:start`,
        payload: { args }
      })
      
      // Performance tracking
      const result = this.monitor
        ? this.monitor.track(String(methodName), () => original(...args))
        : original(...args)
      
      // After hook
      hooks?.after?.(result)
      
      // Event: method:complete
      this.eventBus.emit({
        type: `${String(methodName)}:complete`,
        payload: { result }
      })
      
      return result
    }) as Table<TData>[K]
  }
}

interface InterceptHooks<TData, K extends keyof Table<TData>> {
  before?: (args: any[]) => void
  after?: (result: ReturnType<Table<TData>[K]>) => void
}
```

---

## Implementation Plan

### Week 1: Core Adapter
- [ ] Create package structure
- [ ] Implement `createEnhancedTable()`
- [ ] Add method interception
- [ ] Implement event integration
- [ ] Write unit tests

### Week 2: HOC Enhancers
- [ ] Implement `withEvents()`
- [ ] Implement `withPerformanceMonitoring()`
- [ ] Implement `withValidation()`
- [ ] Implement `withPlugins()`
- [ ] Integration tests
- [ ] Documentation

---

## Usage Examples

### Full Integration

```typescript
import { useReactTable } from '@tanstack/react-table'
import { createEnhancedTable } from '@gridkit/tanstack-adapter'

const tanstackTable = useReactTable({ data, columns })

const table = createEnhancedTable(tanstackTable, {
  events: true,
  performance: {
    budgets: { rowModelBuild: 16 }
  },
  validation: {
    mode: 'strict'
  }
})

// Use TanStack API
const rows = table.getRowModel().rows

// Use GridKit features
table.on('sorting:change', handleSort)
const metrics = table.metrics.getOperationStats('getRowModel')
```

### Gradual Adoption

```typescript
import { useReactTable } from '@tanstack/react-table'
import { withEvents, withPerformanceMonitoring } from '@gridkit/tanstack-adapter'

let table = useReactTable({ data, columns })

// Add events
table = withEvents(table)

// Add performance monitoring
table = withPerformanceMonitoring(table, {
  budgets: { sorting: 50 }
})

// Now use both APIs
table.on('row:select', handler)
console.log(table.metrics.getStats())
```

---

## Testing Strategy

```typescript
describe('createEnhancedTable', () => {
  it('preserves TanStack API', () => {
    const tanstackTable = useReactTable({ data, columns })
    const enhanced = createEnhancedTable(tanstackTable)
    
    // All TanStack methods still work
    expect(enhanced.getRowModel).toBeDefined()
    expect(enhanced.setSorting).toBeDefined()
  })
  
  it('adds GridKit features', () => {
    const enhanced = createEnhancedTable(tanstackTable, {
      events: true,
      performance: true
    })
    
    expect(enhanced.on).toBeDefined()
    expect(enhanced.metrics).toBeDefined()
  })
  
  it('emits events on method calls', () => {
    const enhanced = createEnhancedTable(tanstackTable, { events: true })
    
    const handler = vi.fn()
    enhanced.on('sorting:change', handler)
    
    enhanced.setSorting([{ id: 'name', desc: false }])
    
    expect(handler).toHaveBeenCalled()
  })
})
```

---

## Success Criteria

- ✅ All TanStack API preserved
- ✅ GridKit features integrated
- ✅ Zero breaking changes
- ✅ Performance overhead < 5%
- ✅ All tests passing (>95% coverage)
- ✅ Documentation complete

---

## Files to Create

- `packages/tanstack-adapter/src/core/createEnhancedTable.ts`
- `packages/tanstack-adapter/src/core/methodInterceptor.ts`
- `packages/tanstack-adapter/src/enhancers/index.ts`
- `packages/tanstack-adapter/src/enhancers/withEvents.ts`
- `packages/tanstack-adapter/src/enhancers/withPerformanceMonitoring.ts`
- `packages/tanstack-adapter/src/enhancers/withValidation.ts`
- `packages/tanstack-adapter/src/enhancers/withPlugins.ts`
- `packages/tanstack-adapter/src/types/enhanced.ts`
- `packages/tanstack-adapter/src/__tests__/adapter.test.ts`

---

**Author**: GridKit Team  
**Created**: 2026-02-23
