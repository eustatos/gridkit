# TASK-001: Implement Event Timeline Component for DevTools

## Goal
Implement a fully functional Event Timeline component that displays table events in real-time through the DevTools extension panel.

## Context
The DevTools extension currently has a placeholder `EventTimeline` component that shows "Event monitoring coming soon". This task implements the actual event monitoring functionality to help developers debug table interactions.

## Current State
- `packages/devtools/extension/panel/components/EventTimeline.tsx` — placeholder component
- `packages/devtools/backend/DevToolsBackend.ts` — backend sends `EVENT_LOGGED` events
- `packages/devtools/bridge/DevToolsBridge.ts` — bridge for communication
- Extension panel exists but doesn't display events

## Requirements

### 1. Event Timeline Component
Create a React component that:
- Connects to DevTools backend via bridge
- Subscribes to `EVENT_LOGGED` events
- Displays events in chronological order (newest first)
- Shows event type, timestamp, and payload
- Auto-scrolls to newest event
- Clears events when table changes

### 2. Event Data Structure
Each event should display:
- `type` — event type (e.g., "sorting", "selection", "pagination")
- `timestamp` — when event occurred
- `tableId` — which table triggered the event
- `payload` — event data (expandable view)

### 3. UI Features
- Event count badge
- Filter by event type (dropdown)
- Clear events button
- Pause/Resume event streaming
- Copy event to clipboard

## Technical Requirements

### TypeScript Best Practices
- **NO `any` types** — use proper interfaces
- **NO type assertions** (`as Type`) unless absolutely necessary
- Define explicit return types for all functions
- Use `unknown` instead of `any` for uncertain types

### React Best Practices
- Use React hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- Proper cleanup in `useEffect` (unsubscribe from events)
- Memoize expensive calculations with `useMemo`
- Use `React.FC` or explicit function component types

### Code Quality
- Follow existing code style in `packages/devtools/extension/`
- Add JSDoc comments for public functions
- Use ESLint rules (no warnings)
- Max component length: 200 lines (extract sub-components if needed)

## Implementation Steps

### Step 1: Define Event Interfaces
Create `packages/devtools/extension/panel/types/events.ts`:
```typescript
export interface DevToolsEvent {
  id: string;
  type: string;
  tableId: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface EventTimelineProps {
  tableId: string;
}
```

### Step 2: Implement EventTimeline Component
Update `packages/devtools/extension/panel/components/EventTimeline.tsx`:
- Subscribe to bridge events on mount
- Store events in state array
- Render event list with timestamps
- Implement filter and clear functionality

### Step 3: Create EventItem Sub-component
Create `packages/devtools/extension/panel/components/EventItem.tsx`:
- Display single event
- Expandable payload viewer
- Copy to clipboard button
- Formatted timestamp

### Step 4: Add Styles
Update `packages/devtools/extension/styles/components.css`:
- Event list container
- Event item styling
- Timestamp formatting
- Filter controls

## Success Criteria
- [ ] Events appear in timeline when table actions occur (sorting, selection)
- [ ] Events show correct timestamp and type
- [ ] Filter by event type works
- [ ] Clear events button removes all events
- [ ] No TypeScript errors or ESLint warnings
- [ ] Component handles 100+ events without performance issues
- [ ] Proper cleanup when component unmounts

## Related Files
- `packages/devtools/extension/panel/components/EventTimeline.tsx` (main component)
- `packages/devtools/extension/panel/components/EventItem.tsx` (new file)
- `packages/devtools/extension/panel/types/events.ts` (new file)
- `packages/devtools/backend/DevToolsBackend.ts` (event source)
- `packages/devtools/bridge/DevToolsBridge.ts` (communication layer)

## Testing
After implementation, verify manually:
1. Open DevTools extension panel
2. Select a table
3. Perform table actions (sort, select rows)
4. Verify events appear in timeline
5. Test filter and clear functionality

## Notes
- Events are sent via `devToolsBridge.send({ type: 'EVENT_LOGGED', ... })`
- Use `bridge.onCommand()` or `bridge.subscribe()` to receive events
- Timestamp should be formatted as `HH:mm:ss.mmm`
- Limit event history to 100 events (remove oldest)

## Implementation Status

### ✅ COMPLETED (26 February 2026)

**Files Created/Modified:**
- `packages/devtools/extension/panel/components/EventTimeline.tsx` — Main component (rewritten)
- `packages/devtools/extension/panel/components/EventItem.tsx` — New sub-component
- `packages/devtools/extension/panel/types/events.ts` — New types file
- `packages/devtools/extension/styles/index.css` — Added timeline styles
- `packages/devtools/extension/tsconfig.json` — Fixed include paths

**Implemented Features:**
- ✅ Event Timeline component with real-time event monitoring
- ✅ Subscription to EVENT_LOGGED events via devToolsBridge
- ✅ Events displayed in chronological order (newest first)
- ✅ Event type, timestamp, and payload display
- ✅ Event count badge
- ✅ Filter by event type (dropdown)
- ✅ Clear events button
- ✅ Pause/Resume event streaming
- ✅ Copy event to clipboard
- ✅ Auto-scroll to newest event
- ✅ Limit to 100 events
- ✅ Proper cleanup on unmount

**Technical Requirements Met:**
- ✅ NO `any` types — proper interfaces used
- ✅ NO type assertions
- ✅ Explicit return types
- ✅ React hooks (useState, useEffect, useCallback, useRef)
- ✅ Proper cleanup in useEffect
- ✅ Memoized callbacks
- ✅ TypeScript strict mode passes
- ✅ No ESLint errors

**Testing:**
Manual testing required:
1. Build extension: `pnpm build:devtools`
2. Load extension in Chrome
3. Open DevTools panel
4. Select a table
5. Perform table actions (sort, select rows)
6. Verify events appear in timeline
