# Debug System

GridKit's advanced debugging system provides powerful tools for development and debugging of table applications.

## Features

- **Event Logging**: Track all table events with filtering and history
- **Time Travel**: Navigate through table states with snapshots
- **Performance Profiling**: Profile operations and identify bottlenecks
- **Memory Management**: Detect memory leaks and track object lifecycles
- **Event Replay**: Replay events for debugging purposes
- **State Inspection**: View and compare state changes

## Quick Start

```typescript
import { createTable } from '@gridkit/core';

const table = createTable({
  data: yourData,
  columns: yourColumns,
  debug: {
    events: true,
    performance: true,
    memory: true,
    timeTravel: true,
  },
});

const debug = table.debug!;
debug.logEvent({ type: 'custom:event', payload: {}, timestamp: Date.now() });
```

---

## DebugManager API

### Event Debugging

#### logEvent()

Log an event to history.

```typescript
logEvent(event: DebugEvent): void;
```

**Example:**
```typescript
debug.logEvent({
  type: 'user:action',
  payload: { action: 'sort', column: 'name' },
  timestamp: Date.now(),
});
```

#### getEventHistory()

Get logged events with optional filter.

```typescript
getEventHistory(filter?: EventFilter): DebugEvent[];
```

**Example:**
```typescript
// Get all events
const allEvents = debug.getEventHistory();

// Filter by type
const sortEvents = debug.getEventHistory({ type: 'sorting:*' });

// Filter by time range
const recentEvents = debug.getEventHistory({
  startTime: Date.now() - 60000, // Last minute
});
```

#### clearEventHistory()

Clear event history.

```typescript
clearEventHistory(): void;
```

---

### Time Travel

#### createSnapshot()

Create a snapshot of current state.

```typescript
createSnapshot(state?: TableState, timestamp?: number): Snapshot;
```

**Example:**
```typescript
const snapshot = debug.createSnapshot();
console.log(`Snapshot created at ${snapshot.timestamp}`);
```

#### restoreSnapshot()

Restore to a specific snapshot.

```typescript
restoreSnapshot(timestamp: number): void;
```

**Example:**
```typescript
// Save current state
const beforeChange = debug.createSnapshot();

// Make changes
table.setState({ sorting: [{ id: 'name', desc: true }] });

// Restore previous state
debug.restoreSnapshot(beforeChange.timestamp);
```

#### listSnapshots()

List all available snapshots.

```typescript
listSnapshots(): SnapshotInfo[];
```

**Example:**
```typescript
const snapshots = debug.listSnapshots();
snapshots.forEach(s => {
  console.log(`${s.timestamp}: ${s.description}`);
});
```

#### travelBack()

Travel back N snapshots.

```typescript
travelBack(steps: number): void;
```

**Example:**
```typescript
// Go back 3 states
debug.travelBack(3);
```

#### travelForward()

Travel forward N snapshots.

```typescript
travelForward(steps: number): void;
```

---

### Performance Profiling

#### profile()

Profile a function.

```typescript
profile<T>(fn: () => T): ProfileResult<T>;
```

**Example:**
```typescript
const result = debug.profile(() => {
  table.setData(largeDataset);
});

console.log(`Operation took ${result.duration}ms`);
```

#### profileWithLabel()

Profile with custom label.

```typescript
profileWithLabel<T>(label: string, fn: () => T): ProfileResult<T>;
```

**Example:**
```typescript
const result = debug.profileWithLabel('loadData', () => {
  table.setData(largeDataset);
});

console.log(`Load time: ${result.duration}ms`);
```

#### startProfiling()

Start profiling (manual).

```typescript
startProfiling(label: string): void;
```

#### stopProfiling()

Stop profiling (manual).

```typescript
stopProfiling(label: string): ProfileResult;
```

**Example:**
```typescript
debug.startProfiling('import');
// ... perform import
const result = debug.stopProfiling('import');
console.log(`Import took ${result.duration}ms`);
```

#### getBottlenecks()

Get operations above threshold.

```typescript
getBottlenecks(thresholdMs: number): ProfileResult[];
```

**Example:**
```typescript
const slowOps = debug.getBottlenecks(100);
slowOps.forEach(op => {
  console.log(`${op.label}: ${op.duration}ms`);
});
```

---

### Memory Debugging

#### trackMemory()

Create memory snapshot.

```typescript
trackMemory(): MemorySnapshot;
```

#### detectLeaks()

Detect potential memory leaks.

```typescript
detectLeaks(): MemoryLeak[];
```

**Example:**
```typescript
const leaks = debug.detectLeaks();
if (leaks.length > 0) {
  console.warn('Memory leaks detected:', leaks);
}
```

#### createHeapSnapshot()

Create heap snapshot.

```typescript
createHeapSnapshot(): HeapSnapshot;
```

#### analyzeMemoryGrowth()

Analyze memory growth over time.

```typescript
analyzeMemoryGrowth(): MemoryGrowthReport;
```

---

### Debug Info

#### getDebugInfo()

Get complete debug information.

```typescript
getDebugInfo(): DebugInfo;
```

**Returns:**
```typescript
interface DebugInfo {
  events: DebugEvent[];
  snapshots: SnapshotInfo[];
  performance: ProfileResult[];
  memory: MemorySnapshot;
  state: TableState;
}
```

#### exportDebugData()

Export debug data (JSON or ZIP).

```typescript
exportDebugData(format: 'json' | 'zip' = 'json'): string | Blob;
```

**Example:**
```typescript
// Export as JSON
const jsonData = debug.exportDebugData('json');

// Export as ZIP (includes more data)
const zipBlob = debug.exportDebugData('zip');

// Download
const url = URL.createObjectURL(zipBlob);
const a = document.createElement('a');
a.href = url;
a.download = `debug-${Date.now()}.zip`;
a.click();
```

#### clear()

Clear all debug data.

```typescript
clear(): void;
```

---

## Examples

### Time Travel Debugging

```typescript
const table = createTable({
  data: initialData,
  columns,
  debug: { timeTravel: true },
});

// Save state before changes
const snapshot1 = table.debug!.createSnapshot();

// Make changes
table.setSorting([{ id: 'name', desc: true }]);
const snapshot2 = table.debug!.createSnapshot();

// More changes
table.setFiltering([{ id: 'status', value: 'active' }]);

// Restore to first snapshot
table.debug!.restoreSnapshot(snapshot1.timestamp);

// Or travel back
table.debug!.travelBack(2);
```

### Performance Profiling

```typescript
const table = createTable({
  data: largeDataset,
  columns,
  debug: { performance: true },
});

// Profile single operation
const result = table.debug!.profileWithLabel('loadData', () => {
  table.setData(largeDataset);
});

console.log('Load time:', result.duration, 'ms');
console.log('Breakdown:', result.breakdown);

// Profile multiple operations
debug.startProfiling('bulk-import');

for (const chunk of chunks) {
  debug.startProfiling('chunk-import');
  table.appendData(chunk);
  const chunkResult = debug.stopProfiling('chunk-import');
  console.log(`Chunk took ${chunkResult.duration}ms`);
}

const totalResult = debug.stopProfiling('bulk-import');
console.log('Total import time:', totalResult.duration, 'ms');
```

### Memory Leak Detection

```typescript
const table = createTable({
  data: [],
  columns,
  debug: { memory: true },
});

// Take initial snapshot
const initialMemory = debug.trackMemory();

// Perform operations
for (let i = 0; i < 100; i++) {
  table.setData(generateData(1000));
  table.setData([]);
}

// Check for leaks
const leaks = debug.detectLeaks();
console.log('Leaks:', leaks);

// Analyze growth
const report = debug.analyzeMemoryGrowth();
console.log('Memory growth:', report.growthRate);
```

### Event Debugging

```typescript
const table = createTable({
  data,
  columns,
  debug: { events: true },
});

// Log custom events
table.debug!.logEvent({
  type: 'user:action',
  payload: { action: 'filter', column: 'name' },
  timestamp: Date.now(),
});

// Get event history
const events = table.debug!.getEventHistory({
  type: 'row:*',
  startTime: Date.now() - 60000,
});

// Export for analysis
const exportData = table.debug!.exportDebugData('json');
console.log(exportData);
```

---

## DevTools Extension

GridKit provides a browser DevTools extension for enhanced debugging.

### Installation

1. Clone the GridKit repository
2. Build the extension: `pnpm build:extension`
3. Load in Chrome: `chrome://extensions/` → Load unpacked → Select `packages/devtools/extension-dist`

### Features

- **Table Inspector**: View table state, columns, and rows
- **Event Timeline**: Interactive event log with filtering
- **Performance Monitor**: Real-time performance metrics
- **Time Travel UI**: Visual controls for time-travel debugging
- **State Diff Viewer**: Visual state comparison
- **Memory Profiler**: Memory usage and leak detection

### Usage

```typescript
import { useGridEnhancedTable } from '@gridkit/tanstack-adapter';
import { useDevToolsTable } from '@gridkit/devtools';

const table = useGridEnhancedTable({
  data,
  columns,
  debug: {
    devtools: true, // Enable DevTools connection
  },
});

// Automatically register with DevTools
useDevToolsTable(table);
```

---

## Best Practices

### 1. Use in Development Only

```typescript
const table = createTable({
  data,
  columns,
  debug: {
    events: process.env.NODE_ENV === 'development',
    performance: process.env.NODE_ENV === 'development',
    memory: process.env.NODE_ENV === 'development',
  },
});
```

### 2. Limit Event History

```typescript
const table = createTable({
  data,
  columns,
  debug: {
    maxEventHistory: 1000, // Prevent memory issues
  },
});
```

### 3. Monitor Memory Regularly

```typescript
// Check for leaks periodically
setInterval(() => {
  const leaks = table.debug!.detectLeaks();
  if (leaks.length > 0) {
    console.warn('Memory leaks detected:', leaks);
  }
}, 60000); // Every minute
```

### 4. Profile Critical Paths

```typescript
// Profile operations that feel slow
const result = debug.profileWithLabel('expensive-operation', () => {
  // Operation
});

if (result.duration > 100) {
  console.warn(`Slow operation: ${result.duration}ms`);
}
```

### 5. Snapshot Strategically

```typescript
// Create snapshots at meaningful points
const beforeFilter = debug.createSnapshot({ description: 'Before filter' });
table.setFiltering(filters);
const afterFilter = debug.createSnapshot({ description: 'After filter' });

// Compare states
console.log('State diff:', diff(beforeFilter.state, afterFilter.state));
```

### 6. Export for Analysis

```typescript
// Export debug data when reporting bugs
function reportBug(error: Error) {
  const debugData = table.debug!.exportDebugData('zip');
  
  // Send to support
  api.reportBug({
    error: error.message,
    debugData,
    timestamp: Date.now(),
  });
}
```

---

## Troubleshooting

### Debug features not working

**Check:**
- Debug mode is enabled: `debug: { events: true }`
- Table instance has debug property
- No TypeScript errors

```typescript
// Verify debug is available
if (table.debug) {
  table.debug.logEvent({ type: 'test', payload: {}, timestamp: Date.now() });
}
```

### High memory usage

**Solution:**
```typescript
// Limit event history
const table = createTable({
  data,
  columns,
  debug: {
    maxEventHistory: 500,
    maxSnapshots: 50,
  },
});

// Clear periodically
table.debug!.clear();
```

### Performance overhead

**Solution:**
```typescript
// Disable in production
const table = createTable({
  data,
  columns,
  debug: {
    enabled: process.env.NODE_ENV === 'development',
  },
});
```

---

## See Also

- [Events API](../api/events.md) - Event system
- [Performance Monitoring](../../packages/core/src/performance/README.md) - Performance metrics
- [DevTools Package](../../packages/devtools/README.md) - Browser extension
- [Core API](../api/core.md) - Table creation
