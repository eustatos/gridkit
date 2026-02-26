# TASK-004: Implement Performance Monitoring Component

## Goal
Implement a Performance Monitor component that displays table rendering metrics and helps developers identify performance bottlenecks.

## Context
Developers need to understand table performance characteristics (render time, re-render count, memory usage) to optimize their applications. This task implements real-time performance monitoring.

## Current State
- `packages/devtools/extension/panel/components/PerformanceMonitor.tsx` — placeholder or basic component
- `packages/devtools/backend/DevToolsBackend.ts` — can collect performance metrics
- No real-time performance display in extension

## Requirements

### 1. Performance Metrics Collection
Collect and display:
- `renderCount` — number of table renders
- `lastRenderDuration` — time for last render (ms)
- `averageRenderDuration` — average render time
- `totalRenderTime` — cumulative render time
- `reRenderReason` — why last re-render occurred

### 2. Real-Time Updates
- Update metrics on every table operation
- Show trend indicators (↑ worse, ↓ better, → stable)
- Highlight slow renders (>100ms warning, >500ms error)

### 3. Performance History
- Store last 10 render metrics
- Display sparkline or mini-chart
- Show min/max/average for history

### 4. Threshold Alerts
- Configurable thresholds (default: 100ms warning, 500ms critical)
- Visual alerts when thresholds exceeded
- Log performance warnings to console

## Technical Requirements

### TypeScript Best Practices
- **NO `any` types** — use interfaces for metrics
- Define `PerformanceMetrics` interface with explicit types
- Use `number | null` for optional metrics
- Properly type all hook returns

### React Best Practices
- Use `useReducer` for complex state (metrics history)
- Use `useEffect` for subscription cleanup
- Memoize calculations with `useMemo`
- Separate concerns (collection vs display)

### Performance Best Practices
- Don't block main thread for metrics collection
- Use `requestIdleCallback` for non-urgent updates
- Limit history size (max 10 entries)
- Debounce rapid updates (100ms)

## Implementation Steps

### Step 1: Define Performance Interfaces
Create `packages/devtools/extension/panel/types/performance.ts`:
```typescript
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderDuration: number | null;
  averageRenderDuration: number | null;
  totalRenderTime: number;
  reRenderReason: string | null;
  timestamp: number;
}

export interface PerformanceHistory {
  entries: PerformanceMetrics[];
  min: number;
  max: number;
  average: number;
}
```

### Step 2: Implement PerformanceMonitor Component
Update `packages/devtools/extension/panel/components/PerformanceMonitor.tsx`:
- Subscribe to performance updates from backend
- Display current metrics with formatting
- Show trend indicators
- Implement threshold alerts

### Step 3: Create MetricCard Sub-component
Create `packages/devtools/extension/panel/components/MetricCard.tsx`:
- Display single metric with label and value
- Show trend arrow (↑↓→)
- Color coding (green/yellow/red based on thresholds)

### Step 4: Add Performance History Hook
Create `packages/devtools/extension/panel/hooks/usePerformanceHistory.ts`:
- Store metrics history
- Calculate min/max/average
- Limit history size
- Provide cleanup function

## Success Criteria
- [ ] Render count updates on table operations
- [ ] Render duration displayed in milliseconds
- [ ] Trend indicators show changes correctly
- [ ] Threshold alerts trigger at 100ms/500ms
- [ ] History shows last 10 renders
- [ ] No TypeScript errors or ESLint warnings
- [ ] Component updates without lag

## Related Files
- `packages/devtools/extension/panel/components/PerformanceMonitor.tsx` (main)
- `packages/devtools/extension/panel/components/MetricCard.tsx` (new)
- `packages/devtools/extension/panel/types/performance.ts` (new)
- `packages/devtools/extension/panel/hooks/usePerformanceHistory.ts` (new)
- `packages/devtools/backend/DevToolsBackend.ts` (metrics source)

## Thresholds (Default)
| Metric | Warning | Critical |
|--------|---------|----------|
| Render Duration | >100ms | >500ms |
| Average Duration | >80ms | >300ms |
| Render Count/min | >60 | >120 |

## Notes
- Use `performance.now()` for accurate timing
- Format durations as `XX.XX ms`
- Show `—` for null/undefined values
- Consider using `PerformanceObserver` for browser metrics
