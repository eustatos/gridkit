# ENT-DEBUG-001: Advanced Debugging Tools

**Status**: 📝 Planning  
**Priority**: P1 - High  
**Estimated Effort**: 3 weeks  
**Phase**: 2 - Feature Complete  
**Dependencies**: ENT-EVT-001, ENT-PERF-001

---

## Objective

Implement advanced debugging tools including time-travel debugging, event replay, performance profiling, and memory leak detection with programmatic API.

---

## Target State

```typescript
// ✅ Advanced debugging API
const table = useGridEnhancedTable({
  data,
  columns,
  debug: {
    events: true,      // Event logging
    performance: true, // Performance metrics
    validation: true,  // Validation errors
    memory: true,      // Memory tracking
    plugins: true,     // Plugin activity
    timeTravel: true   // Time-travel debugging
  }
})

// Time travel debugging
table.debug.timeTravel({
  to: timestamp,
  replay: true
})

// Event replay
table.debug.replayEvents([event1, event2, event3])

// Get debug info
const debugInfo = table.getDebugInfo()

// Performance profiling
const profile = table.debug.profile(() => {
  // Expensive operation
  table.setSorting([...])
})
```

---

## Technical Requirements

### 1. Debug Configuration

**File**: `packages/core/src/debug/types.ts`

```typescript
export interface DebugConfig {
  events?: boolean | EventDebugConfig
  performance?: boolean | PerformanceDebugConfig
  validation?: boolean
  memory?: boolean | MemoryDebugConfig
  plugins?: boolean
  timeTravel?: boolean | TimeTravelConfig
  output?: DebugOutput
}

export interface EventDebugConfig {
  enabled: boolean
  filter?: (event: BaseEvent) => boolean
  maxHistory?: number
  includePayload?: boolean
}

export interface PerformanceDebugConfig {
  enabled: boolean
  operations?: string[]
  threshold?: number
  flamegraph?: boolean
}

export interface MemoryDebugConfig {
  enabled: boolean
  interval?: number
  trackLeaks?: boolean
  snapshotOnLeak?: boolean
}

export interface TimeTravelConfig {
  enabled: boolean
  maxSnapshots?: number
  snapshotInterval?: number
}

export type DebugOutput = 'console' | 'file' | 'devtools' | 'custom'
```

### 2. Debug Manager

**File**: `packages/core/src/debug/DebugManager.ts`

```typescript
export class DebugManager {
  private config: DebugConfig
  private eventHistory: BaseEvent[] = []
  private snapshots: Map<number, TableSnapshot> = new Map()
  private profiler: Profiler
  
  constructor(config: DebugConfig) {
    this.config = config
    this.profiler = new Profiler()
  }
  
  // Event debugging
  logEvent(event: BaseEvent): void
  getEventHistory(filter?: EventFilter): BaseEvent[]
  clearEventHistory(): void
  
  // Time travel
  createSnapshot(timestamp?: number): TableSnapshot
  restoreSnapshot(timestamp: number): void
  listSnapshots(): TableSnapshot[]
  
  // Event replay
  replayEvents(events: BaseEvent[]): void
  replayFromSnapshot(timestamp: number): void
  
  // Performance profiling
  profile<T>(fn: () => T): ProfilingResult<T>
  startProfiling(label: string): void
  stopProfiling(label: string): ProfilingResult
  
  // Memory debugging
  trackMemory(): MemorySnapshot
  detectLeaks(): MemoryLeak[]
  createHeapSnapshot(): HeapSnapshot
  
  // Debug info
  getDebugInfo(): DebugInfo
  exportDebugData(format: 'json' | 'zip'): Blob
}
```

### 3. Time Travel

**File**: `packages/core/src/debug/timetravel/TimeTravelManager.ts`

```typescript
export class TimeTravelManager {
  private snapshots: CircularBuffer<TableSnapshot>
  private eventStore: EventStore
  
  // Snapshot management
  createSnapshot(state: TableState, eventIndex: number): TableSnapshot
  
  getSnapshot(timestamp: number): TableSnapshot | undefined
  
  listSnapshots(): TableSnapshot[]
  
  // Time travel
  travelTo(timestamp: number): void
  
  travelBack(steps: number): void
  
  travelForward(steps: number): void
  
  // Replay
  replay(from: number, to: number, speed?: number): void
  
  pause(): void
  resume(): void
  stop(): void
}

export interface TableSnapshot {
  timestamp: number
  eventIndex: number
  state: TableState
  metadata: {
    rowCount: number
    columnCount: number
    memory: number
  }
}
```

### 4. Event Replay

**File**: `packages/core/src/debug/replay/EventReplayer.ts`

```typescript
export class EventReplayer {
  constructor(
    private eventBus: EventBus,
    private stateManager: StateManager
  ) {}
  
  // Replay single event
  replayEvent(event: BaseEvent): void
  
  // Replay multiple events
  replayEvents(events: BaseEvent[], options?: ReplayOptions): void
  
  // Replay from event store
  replayFromStore(from: number, to: number, options?: ReplayOptions): void
  
  // Replay with speed control
  replayWithSpeed(events: BaseEvent[], speed: number): void
}

export interface ReplayOptions {
  speed?: number        // 1 = real-time, 2 = 2x speed
  pauseOnError?: boolean
  skipValidation?: boolean
  emitEvents?: boolean
}
```

### 5. Profiler

**File**: `packages/core/src/debug/profiler/Profiler.ts`

```typescript
export class Profiler {
  private activeProfiles: Map<string, ProfileSession> = new Map()
  private completedProfiles: ProfilingResult[] = []
  
  // Profiling
  profile<T>(label: string, fn: () => T): ProfilingResult<T>
  
  start(label: string): void
  stop(label: string): ProfilingResult
  
  // Flame graph
  generateFlameGraph(results: ProfilingResult[]): FlameGraph
  
  // Analysis
  analyze(results: ProfilingResult[]): ProfilingAnalysis
  
  getBottlenecks(threshold: number): Bottleneck[]
}

export interface ProfilingResult<T = void> {
  label: string
  duration: number
  memory: {
    before: number
    after: number
    delta: number
  }
  operations: OperationProfile[]
  result?: T
}

export interface OperationProfile {
  name: string
  duration: number
  calls: number
  children: OperationProfile[]
}

export interface FlameGraph {
  root: FlameGraphNode
  totalDuration: number
  maxDepth: number
}

export interface FlameGraphNode {
  name: string
  value: number
  children: FlameGraphNode[]
}
```

### 6. Memory Debugger

**File**: `packages/core/src/debug/memory/MemoryDebugger.ts`

```typescript
export class MemoryDebugger {
  private snapshots: MemorySnapshot[] = []
  private leakDetector: LeakDetector
  
  // Snapshots
  createSnapshot(): MemorySnapshot
  
  compareSnapshots(before: MemorySnapshot, after: MemorySnapshot): MemoryDiff
  
  // Leak detection
  detectLeaks(): MemoryLeak[]
  
  trackObject(obj: any, label: string): void
  
  getTrackedObjects(): TrackedObject[]
  
  // Analysis
  analyzeMemoryGrowth(): MemoryGrowthReport
  
  findRetainedObjects(): RetainedObject[]
}

export interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  objects: {
    rows: number
    columns: number
    cells: number
    subscriptions: number
  }
}

export interface MemoryLeak {
  type: 'row' | 'column' | 'subscription' | 'listener'
  count: number
  size: number
  objects: WeakRef<any>[]
}
```

---

## Implementation Plan

### Week 1: Core Debug Infrastructure
- [ ] Define debug types and interfaces
- [ ] Implement DebugManager
- [ ] Add debug configuration to table
- [ ] Implement event logging
- [ ] Write unit tests

### Week 2: Time Travel & Replay
- [ ] Implement TimeTravelManager
- [ ] Add snapshot creation/restoration
- [ ] Implement EventReplayer
- [ ] Add replay controls (pause, resume, speed)
- [ ] Write tests

### Week 3: Profiling & Memory
- [ ] Implement Profiler
- [ ] Add flame graph generation
- [ ] Implement MemoryDebugger
- [ ] Add leak detection
- [ ] Integration tests
- [ ] Documentation

---

## Testing Strategy

```typescript
describe('DebugManager', () => {
  it('should log events', () => {
    const debug = new DebugManager({ events: true })
    
    debug.logEvent({ type: 'row:select', payload: {} })
    
    expect(debug.getEventHistory()).toHaveLength(1)
  })
  
  it('should create and restore snapshots', () => {
    const debug = new DebugManager({ timeTravel: true })
    
    const snapshot = debug.createSnapshot()
    
    // Modify state
    table.setSorting([...])
    
    // Restore
    debug.restoreSnapshot(snapshot.timestamp)
    
    expect(table.getState()).toEqual(snapshot.state)
  })
  
  it('should detect memory leaks', () => {
    const debug = new DebugManager({ memory: true })
    
    // Create leak
    for (let i = 0; i < 1000; i++) {
      table.createRow() // without cleanup
    }
    
    const leaks = debug.detectLeaks()
    
    expect(leaks.length).toBeGreaterThan(0)
  })
})
```

---

## Success Criteria

- ✅ Time-travel debugging functional
- ✅ Event replay working
- ✅ Performance profiling accurate
- ✅ Memory leak detection reliable
- ✅ Flame graph generation working
- ✅ All tests passing (>95% coverage)
- ✅ Documentation complete

---

## Files to Create

- `packages/core/src/debug/types.ts`
- `packages/core/src/debug/DebugManager.ts`
- `packages/core/src/debug/timetravel/TimeTravelManager.ts`
- `packages/core/src/debug/replay/EventReplayer.ts`
- `packages/core/src/debug/profiler/Profiler.ts`
- `packages/core/src/debug/memory/MemoryDebugger.ts`
- `packages/core/src/debug/__tests__/debug.test.ts`

---

**Author**: GridKit Team  
**Created**: 2026-02-23
