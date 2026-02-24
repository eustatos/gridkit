# ENT-DEBUG-002: DevTools Extension

**Status**: ✅ Implementation Complete (Phase 1)
**Priority**: P1 - High
**Estimated Effort**: 4 weeks
**Phase**: 2 - Feature Complete
**Dependencies**: ENT-DEBUG-001, ENT-EVT-001, ENT-PERF-001
**Implementation Date**: 2026-02-23

---

**Implementation Summary**: See [ENT-DEBUG-002-IMPLEMENTATION-SUMMARY.md](../ENT-DEBUG-002-IMPLEMENTATION-SUMMARY.md)

---

## Target State

```typescript
// DevTools detects GridKit tables automatically
// Extension shows in browser DevTools panel

// Backend API in table
const table = useGridEnhancedTable({
  data,
  columns,
  debug: {
    devtools: true  // Enable DevTools connection
  }
})

// DevTools features:
// 1. Table Inspector - View table state, columns, rows
// 2. Event Timeline - Interactive event log with filtering
// 3. Performance Monitor - Real-time performance metrics
// 4. Time Travel - UI controls for time-travel debugging
// 5. State Diff Viewer - Visual state comparison
// 6. Memory Profiler - Memory usage and leak detection
// 7. Plugin Inspector - View loaded plugins and their state
```

---

## Technical Requirements

### 1. Extension Architecture

**Structure**:
```
packages/devtools/
├── extension/
│   ├── manifest.json           # Browser extension manifest
│   ├── background.js           # Background script
│   ├── devtools.html          # DevTools panel HTML
│   ├── devtools.js            # DevTools panel script
│   ├── content.js             # Content script (injected)
│   ├── panel/                 # DevTools panel UI
│   │   ├── index.html
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── TableInspector.tsx
│   │   │   ├── EventTimeline.tsx
│   │   │   ├── PerformanceMonitor.tsx
│   │   │   ├── TimeTravelControls.tsx
│   │   │   ├── StateDiffViewer.tsx
│   │   │   ├── MemoryProfiler.tsx
│   │   │   └── PluginInspector.tsx
│   │   └── styles/
│   ├── icons/                 # Extension icons
│   └── assets/
├── bridge/                    # Communication bridge
│   ├── DevToolsBridge.ts      # Core bridge
│   ├── messages.ts            # Message types
│   └── protocol.ts            # Communication protocol
└── backend/                   # Table integration
    ├── DevToolsBackend.ts     # Backend API
    ├── detector.ts            # Table detection
    └── hooks.ts              # Integration hooks
```

### 2. Communication Protocol

**File**: `packages/devtools/bridge/protocol.ts`

```typescript
export interface DevToolsMessage {
  source: 'devtools' | 'backend' | 'content'
  type: string
  payload?: any
  tableId?: string
  timestamp: number
}

export interface DevToolsCommand extends DevToolsMessage {
  source: 'devtools'
  type: 
    | 'GET_TABLES'
    | 'GET_STATE'
    | 'GET_EVENTS'
    | 'GET_PERFORMANCE'
    | 'TIME_TRAVEL'
    | 'REPLAY_EVENT'
    | 'GET_MEMORY'
    | 'GET_PLUGINS'
}

export interface DevToolsResponse extends DevToolsMessage {
  source: 'backend'
  type:
    | 'TABLES_LIST'
    | 'STATE_UPDATE'
    | 'EVENT_LOGGED'
    | 'PERFORMANCE_UPDATE'
    | 'MEMORY_UPDATE'
    | 'PLUGIN_UPDATE'
}

export interface DevToolsProtocol {
  sendCommand(command: DevToolsCommand): Promise<any>
  onResponse(handler: (response: DevToolsResponse) => void): void
  disconnect(): void
}
```

### 3. DevTools Backend

**File**: `packages/devtools/backend/DevToolsBackend.ts`

```typescript
export class DevToolsBackend {
  private bridge: DevToolsBridge
  private tables: Map<string, TableInstance> = new Map()
  
  constructor() {
    this.bridge = new DevToolsBridge()
    this.setupMessageHandlers()
  }
  
  // Table registration
  registerTable(table: TableInstance): void {
    const tableId = this.generateTableId(table)
    this.tables.set(tableId, table)
    
    // Send registration event
    this.bridge.send({
      type: 'TABLE_REGISTERED',
      payload: {
        id: tableId,
        metadata: this.getTableMetadata(table)
      }
    })
    
    // Setup table listeners
    this.setupTableListeners(tableId, table)
  }
  
  unregisterTable(table: TableInstance): void {
    const tableId = this.findTableId(table)
    if (tableId) {
      this.tables.delete(tableId)
      this.bridge.send({
        type: 'TABLE_UNREGISTERED',
        payload: { id: tableId }
      })
    }
  }
  
  // Command handlers
  private setupMessageHandlers(): void {
    this.bridge.onCommand('GET_TABLES', () => {
      return Array.from(this.tables.entries()).map(([id, table]) => ({
        id,
        metadata: this.getTableMetadata(table)
      }))
    })
    
    this.bridge.onCommand('GET_STATE', ({ tableId }) => {
      const table = this.tables.get(tableId)
      return table ? table.getState() : null
    })
    
    this.bridge.onCommand('GET_EVENTS', ({ tableId, filter }) => {
      const table = this.tables.get(tableId)
      return table?.debug.getEventHistory(filter) ?? []
    })
    
    this.bridge.onCommand('TIME_TRAVEL', ({ tableId, timestamp }) => {
      const table = this.tables.get(tableId)
      table?.debug.timeTravel({ to: timestamp })
    })
  }
  
  // Table monitoring
  private setupTableListeners(tableId: string, table: TableInstance): void {
    // State changes
    table.subscribe((state) => {
      this.bridge.send({
        type: 'STATE_UPDATE',
        tableId,
        payload: state
      })
    })
    
    // Events
    table.on('*', (event) => {
      this.bridge.send({
        type: 'EVENT_LOGGED',
        tableId,
        payload: event
      })
    })
    
    // Performance
    table.on('performance:measured', (metrics) => {
      this.bridge.send({
        type: 'PERFORMANCE_UPDATE',
        tableId,
        payload: metrics
      })
    })
  }
  
  private getTableMetadata(table: TableInstance) {
    return {
      id: table.options.tableId,
      rowCount: table.getRowModel().rows.length,
      columnCount: table.getAllColumns().length,
      state: table.getState(),
      performance: table.debug?.getPerformanceMetrics(),
      memory: table.debug?.getMemoryUsage()
    }
  }
}

// Global instance
export const devToolsBackend = new DevToolsBackend()

// Auto-register tables
if (typeof window !== 'undefined') {
  window.__GRIDKIT_DEVTOOLS__ = devToolsBackend
}
```

### 4. DevTools Bridge

**File**: `packages/devtools/bridge/DevToolsBridge.ts`

```typescript
export class DevToolsBridge implements DevToolsProtocol {
  private port: chrome.runtime.Port | null = null
  private commandHandlers: Map<string, CommandHandler> = new Map()
  private responseHandlers: Set<ResponseHandler> = new Set()
  
  constructor() {
    this.connect()
  }
  
  private connect(): void {
    if (typeof window === 'undefined') return
    
    // Connect to content script
    window.addEventListener('message', (event) => {
      if (event.source !== window) return
      if (event.data.source === 'gridkit-devtools-content') {
        this.handleContentMessage(event.data)
      }
    })
    
    // Notify content script
    window.postMessage({
      source: 'gridkit-devtools-backend',
      type: 'BACKEND_READY'
    }, '*')
  }
  
  // Send message to DevTools
  send(message: Omit<DevToolsMessage, 'source' | 'timestamp'>): void {
    window.postMessage({
      ...message,
      source: 'gridkit-devtools-backend',
      timestamp: Date.now()
    }, '*')
  }
  
  // Handle command from DevTools
  onCommand<T = any>(
    type: string,
    handler: (payload: any) => T | Promise<T>
  ): void {
    this.commandHandlers.set(type, handler)
  }
  
  // Handle response
  onResponse(handler: ResponseHandler): void {
    this.responseHandlers.add(handler)
  }
  
  private async handleContentMessage(message: DevToolsMessage): Promise<void> {
    if (message.type === 'COMMAND') {
      const handler = this.commandHandlers.get(message.payload.type)
      if (handler) {
        try {
          const result = await handler(message.payload)
          this.send({
            type: 'RESPONSE',
            payload: {
              success: true,
              data: result
            }
          })
        } catch (error) {
          this.send({
            type: 'RESPONSE',
            payload: {
              success: false,
              error: error.message
            }
          })
        }
      }
    }
  }
  
  disconnect(): void {
    this.commandHandlers.clear()
    this.responseHandlers.clear()
  }
}

type CommandHandler = (payload: any) => any | Promise<any>
type ResponseHandler = (response: DevToolsResponse) => void
```

### 5. Table Inspector Component

**File**: `packages/devtools/extension/panel/components/TableInspector.tsx`

```typescript
export function TableInspector({ tableId }: { tableId: string }) {
  const [state, setState] = useState<TableState | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<Row[]>([])
  
  useEffect(() => {
    // Fetch initial state
    bridge.sendCommand({
      type: 'GET_STATE',
      tableId
    }).then(setState)
    
    // Subscribe to updates
    const unsubscribe = bridge.onResponse((response) => {
      if (response.type === 'STATE_UPDATE' && response.tableId === tableId) {
        setState(response.payload)
      }
    })
    
    return unsubscribe
  }, [tableId])
  
  return (
    <div className="table-inspector">
      <div className="inspector-header">
        <h2>Table Inspector</h2>
        <span className="table-id">{tableId}</span>
      </div>
      
      <div className="inspector-tabs">
        <Tab label="State" icon={StateIcon}>
          <StateViewer state={state} />
        </Tab>
        
        <Tab label="Columns" icon={ColumnsIcon}>
          <ColumnsViewer columns={columns} />
        </Tab>
        
        <Tab label="Rows" icon={RowsIcon}>
          <RowsViewer rows={rows} />
        </Tab>
        
        <Tab label="Config" icon={ConfigIcon}>
          <ConfigViewer options={state?.options} />
        </Tab>
      </div>
    </div>
  )
}
```

### 6. Event Timeline Component

**File**: `packages/devtools/extension/panel/components/EventTimeline.tsx`

```typescript
export function EventTimeline({ tableId }: { tableId: string }) {
  const [events, setEvents] = useState<BaseEvent[]>([])
  const [filter, setFilter] = useState<EventFilter>({})
  const [selectedEvent, setSelectedEvent] = useState<BaseEvent | null>(null)
  
  useEffect(() => {
    // Fetch events
    bridge.sendCommand({
      type: 'GET_EVENTS',
      tableId,
      filter
    }).then(setEvents)
    
    // Subscribe to new events
    const unsubscribe = bridge.onResponse((response) => {
      if (response.type === 'EVENT_LOGGED' && response.tableId === tableId) {
        setEvents((prev) => [...prev, response.payload])
      }
    })
    
    return unsubscribe
  }, [tableId, filter])
  
  const handleReplayEvent = (event: BaseEvent) => {
    bridge.sendCommand({
      type: 'REPLAY_EVENT',
      tableId,
      event
    })
  }
  
  return (
    <div className="event-timeline">
      <div className="timeline-controls">
        <EventFilter value={filter} onChange={setFilter} />
        <Button onClick={() => setEvents([])}>Clear</Button>
      </div>
      
      <div className="timeline-list">
        {events.map((event, index) => (
          <EventItem
            key={index}
            event={event}
            selected={selectedEvent === event}
            onClick={() => setSelectedEvent(event)}
            onReplay={() => handleReplayEvent(event)}
          />
        ))}
      </div>
      
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
```

### 7. Performance Monitor Component

**File**: `packages/devtools/extension/panel/components/PerformanceMonitor.tsx`

```typescript
export function PerformanceMonitor({ tableId }: { tableId: string }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [flamegraph, setFlamegraph] = useState<FlameGraph | null>(null)
  
  useEffect(() => {
    // Fetch performance data
    bridge.sendCommand({
      type: 'GET_PERFORMANCE',
      tableId
    }).then(setMetrics)
    
    // Subscribe to updates
    const unsubscribe = bridge.onResponse((response) => {
      if (response.type === 'PERFORMANCE_UPDATE' && response.tableId === tableId) {
        setMetrics((prev) => [...prev, response.payload])
      }
    })
    
    return unsubscribe
  }, [tableId])
  
  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2>Performance Monitor</h2>
        <Button onClick={() => setMetrics([])}>Clear</Button>
      </div>
      
      <div className="monitor-grid">
        <MetricsChart metrics={metrics} />
        <MetricsSummary metrics={metrics} />
      </div>
      
      <div className="flamegraph-section">
        <h3>Flame Graph</h3>
        {flamegraph ? (
          <FlameGraphViewer data={flamegraph} />
        ) : (
          <EmptyState>No profiling data</EmptyState>
        )}
      </div>
      
      <div className="bottlenecks">
        <h3>Bottlenecks</h3>
        <BottlenecksList metrics={metrics} />
      </div>
    </div>
  )
}
```

### 8. Time Travel Controls

**File**: `packages/devtools/extension/panel/components/TimeTravelControls.tsx`

```typescript
export function TimeTravelControls({ tableId }: { tableId: string }) {
  const [snapshots, setSnapshots] = useState<TableSnapshot[]>([])
  const [currentSnapshot, setCurrentSnapshot] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  
  useEffect(() => {
    // Fetch snapshots
    bridge.sendCommand({
      type: 'GET_SNAPSHOTS',
      tableId
    }).then(setSnapshots)
  }, [tableId])
  
  const handleTravelTo = (timestamp: number) => {
    bridge.sendCommand({
      type: 'TIME_TRAVEL',
      tableId,
      timestamp
    })
    setCurrentSnapshot(timestamp)
  }
  
  const handlePlay = () => {
    setPlaying(true)
    // Implement replay logic
  }
  
  return (
    <div className="time-travel-controls">
      <div className="controls-header">
        <h2>Time Travel</h2>
        <div className="playback-controls">
          <Button onClick={handlePlay} disabled={playing}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button onClick={() => setPlaying(false)}>
            <StopIcon />
          </Button>
        </div>
      </div>
      
      <div className="timeline">
        <TimelineSlider
          snapshots={snapshots}
          current={currentSnapshot}
          onChange={handleTravelTo}
        />
      </div>
      
      <div className="snapshots-list">
        {snapshots.map((snapshot) => (
          <SnapshotItem
            key={snapshot.timestamp}
            snapshot={snapshot}
            active={snapshot.timestamp === currentSnapshot}
            onClick={() => handleTravelTo(snapshot.timestamp)}
          />
        ))}
      </div>
    </div>
  )
}
```

### 9. Memory Profiler Component

**File**: `packages/devtools/extension/panel/components/MemoryProfiler.tsx`

```typescript
export function MemoryProfiler({ tableId }: { tableId: string }) {
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([])
  const [leaks, setLeaks] = useState<MemoryLeak[]>([])
  
  useEffect(() => {
    // Fetch memory data
    bridge.sendCommand({
      type: 'GET_MEMORY',
      tableId
    }).then((data) => {
      setSnapshots(data.snapshots)
      setLeaks(data.leaks)
    })
    
    // Subscribe to updates
    const unsubscribe = bridge.onResponse((response) => {
      if (response.type === 'MEMORY_UPDATE' && response.tableId === tableId) {
        setSnapshots((prev) => [...prev, response.payload.snapshot])
        setLeaks(response.payload.leaks)
      }
    })
    
    return unsubscribe
  }, [tableId])
  
  return (
    <div className="memory-profiler">
      <div className="profiler-header">
        <h2>Memory Profiler</h2>
        <Button onClick={() => takeSnapshot()}>Take Snapshot</Button>
      </div>
      
      <div className="memory-chart">
        <MemoryChart snapshots={snapshots} />
      </div>
      
      <div className="leaks-section">
        <h3>Memory Leaks</h3>
        {leaks.length > 0 ? (
          <LeaksList leaks={leaks} />
        ) : (
          <EmptyState>No leaks detected</EmptyState>
        )}
      </div>
      
      <div className="objects-section">
        <h3>Tracked Objects</h3>
        <ObjectsTable snapshots={snapshots} />
      </div>
    </div>
  )
}
```

---

## Implementation Plan

- [ ] **Week 1: Extension Infrastructure**
  - [ ] Create extension structure and manifest
  - [ ] Implement content script for page injection
  - [ ] Implement background script for messaging
  - [ ] Create DevTools panel HTML/entry point
  - [ ] Setup build system (webpack/vite)
  - [ ] Test basic extension loading

- [ ] **Week 2: Communication & Backend**
  - [ ] Implement DevToolsBridge communication protocol
  - [ ] Create DevToolsBackend for table integration
  - [ ] Add table detection and registration
  - [ ] Implement command/response handling
  - [ ] Test bidirectional communication
  - [ ] Add auto-detection of GridKit tables

- [ ] **Week 3: Core UI Components**
  - [ ] Build TableInspector component
  - [ ] Build EventTimeline component
  - [ ] Build PerformanceMonitor component
  - [ ] Build TimeTravelControls component
  - [ ] Create shared UI components (tabs, buttons, etc.)
  - [ ] Add dark/light theme support

- [ ] **Week 4: Advanced Features & Polish**
  - [ ] Build StateDiffViewer component
  - [ ] Build MemoryProfiler component
  - [ ] Build PluginInspector component
  - [ ] Add flame graph visualization
  - [ ] Add export functionality (JSON, CSV)
  - [ ] Write documentation
  - [ ] Prepare for Chrome/Firefox stores

---

## Testing Strategy

```typescript
describe('DevTools Extension', () => {
  it('should detect GridKit tables on page', async () => {
    const backend = new DevToolsBackend()
    const table = createTable({ data, columns })
    
    backend.registerTable(table)
    
    const tables = await bridge.sendCommand({ type: 'GET_TABLES' })
    expect(tables).toHaveLength(1)
  })
  
  it('should send state updates to DevTools', async () => {
    const backend = new DevToolsBackend()
    const table = createTable({ data, columns })
    
    backend.registerTable(table)
    
    const updates: any[] = []
    bridge.onResponse((response) => {
      if (response.type === 'STATE_UPDATE') {
        updates.push(response.payload)
      }
    })
    
    table.setState({ sorting: [...] })
    
    await waitFor(() => expect(updates).toHaveLength(1))
  })
  
  it('should replay events from DevTools', async () => {
    const backend = new DevToolsBackend()
    const table = createTable({ data, columns })
    
    backend.registerTable(table)
    
    const event = { type: 'row:select', payload: { rowId: '1' } }
    
    await bridge.sendCommand({
      type: 'REPLAY_EVENT',
      tableId: table.id,
      event
    })
    
    expect(table.getState().rowSelection).toEqual({ '1': true })
  })
})
```

### E2E Testing

```typescript
describe('DevTools Extension E2E', () => {
  it('should show table in inspector', async () => {
    await page.goto('http://localhost:3000')
    
    // Open DevTools
    const devtools = await page.openDevTools()
    
    // Click GridKit panel
    await devtools.click('[data-panel="gridkit"]')
    
    // Should show table list
    expect(await devtools.textContent('.table-list')).toContain('Table 1')
  })
  
  it('should travel back in time', async () => {
    await page.goto('http://localhost:3000')
    const devtools = await page.openDevTools()
    
    // Make changes
    await page.click('[data-row="1"]')
    await page.click('[data-row="2"]')
    
    // Open time travel
    await devtools.click('[data-tab="time-travel"]')
    
    // Travel to first snapshot
    await devtools.click('[data-snapshot="0"]')
    
    // Should restore state
    expect(await page.isChecked('[data-row="1"]')).toBe(false)
  })
})
```

---

## Success Criteria

- [ ] Extension installs on Chrome, Firefox, Edge
- [ ] Automatically detects GridKit tables on page
- [ ] Shows real-time state updates
- [ ] Event timeline is accurate and filterable
- [ ] Time travel works reliably
- [ ] Performance monitoring shows accurate metrics
- [ ] Memory profiler detects leaks
- [ ] UI is responsive and intuitive
- [ ] Dark/light theme works
- [ ] Export functionality works
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Published to browser stores

---

## Files to Create/Modify

### New Files

- [ ] `packages/devtools/extension/manifest.json` - Extension manifest
- [ ] `packages/devtools/extension/background.js` - Background script
- [ ] `packages/devtools/extension/content.js` - Content script
- [ ] `packages/devtools/extension/devtools.html` - DevTools panel entry
- [ ] `packages/devtools/extension/devtools.js` - DevTools script
- [ ] `packages/devtools/extension/panel/index.html` - Panel HTML
- [ ] `packages/devtools/extension/panel/index.tsx` - Panel React app
- [ ] `packages/devtools/extension/panel/components/TableInspector.tsx`
- [ ] `packages/devtools/extension/panel/components/EventTimeline.tsx`
- [ ] `packages/devtools/extension/panel/components/PerformanceMonitor.tsx`
- [ ] `packages/devtools/extension/panel/components/TimeTravelControls.tsx`
- [ ] `packages/devtools/extension/panel/components/StateDiffViewer.tsx`
- [ ] `packages/devtools/extension/panel/components/MemoryProfiler.tsx`
- [ ] `packages/devtools/extension/panel/components/PluginInspector.tsx`
- [ ] `packages/devtools/bridge/DevToolsBridge.ts` - Communication bridge
- [ ] `packages/devtools/bridge/messages.ts` - Message types
- [ ] `packages/devtools/bridge/protocol.ts` - Protocol definition
- [ ] `packages/devtools/backend/DevToolsBackend.ts` - Backend API
- [ ] `packages/devtools/backend/detector.ts` - Table detection
- [ ] `packages/devtools/backend/hooks.ts` - Integration hooks
- [ ] `packages/devtools/package.json` - Package config
- [ ] `packages/devtools/tsconfig.json` - TypeScript config
- [ ] `packages/devtools/webpack.config.js` - Build config
- [ ] `packages/devtools/README.md` - Documentation

### Modified Files

- [ ] `packages/core/src/table/factory/create-table.ts` - Add DevTools registration
- [ ] `packages/core/src/types/table/TableOptions.ts` - Add devtools config
- [ ] `packages/core/src/table/factory/normalization.ts` - Normalize devtools config

---

## Integration Example

```typescript
// Automatic DevTools integration
const table = useGridEnhancedTable({
  data,
  columns,
  debug: {
    devtools: true  // Enable DevTools (auto-detected in development)
  }
})

// DevTools will automatically:
// 1. Detect the table
// 2. Start monitoring events
// 3. Track performance
// 4. Enable time-travel
// 5. Profile memory

// Manual registration (if needed)
import { devToolsBackend } from '@gridkit/devtools'

devToolsBackend.registerTable(table)
```

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Primary |
| Firefox | 88+     | ✅ Supported |
| Edge    | 90+     | ✅ Supported |
| Safari  | 14+     | ⚠️ Limited (WebExtension API) |

---

## Store Publishing

### Chrome Web Store
- Extension ID: `TBD`
- Category: Developer Tools
- Privacy: No data collection
- Pricing: Free

### Firefox Add-ons
- Add-on ID: `TBD`
- Category: Developer Tools
- License: MIT

### Edge Add-ons
- Add-on ID: `TBD`
- Category: Developer Tools

---

## Performance Considerations

- Use efficient message passing (avoid large payloads)
- Throttle/debounce frequent updates
- Virtual scrolling for large event lists
- Lazy load heavy components
- Optimize flame graph rendering
- Cache snapshot data
- Use Web Workers for heavy computations

---

## Security Considerations

- Validate all messages from content script
- Sanitize displayed data (XSS prevention)
- Don't execute arbitrary code
- Respect Content Security Policy
- Secure communication channel
- No external network requests

---

## Notes

- DevTools extension is separate from core library
- Optional dependency (dev-only)
- Works with production builds (if debug enabled)
- Gracefully degrades if extension not installed
- No performance impact when disabled
- Compatible with React DevTools

---

**Status**: 📝 Ready to Start
