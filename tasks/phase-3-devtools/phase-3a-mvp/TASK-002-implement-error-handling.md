# TASK-002: Implement Error Handling and Graceful Degradation

## Goal
Implement robust error handling throughout the DevTools extension to ensure the application remains stable even when errors occur.

## Context
Currently, the DevTools extension may fail silently or crash when encountering errors (e.g., backend unavailable, invalid data, connection lost). This task implements comprehensive error handling.

## Current State
- Error handling is ad-hoc with `console.warn` and `console.error`
- No centralized error boundary
- No user feedback when errors occur
- Extension may stop working without notification

## Requirements

### 1. Error Boundary Component
Create React Error Boundary that:
- Catches rendering errors in DevTools panel
- Displays user-friendly error message
- Provides "Retry" button
- Logs error to console for debugging

### 2. Connection Status Monitoring
Implement connection health check:
- Detect when backend becomes unavailable
- Show visual indicator (disconnected state)
- Auto-reconnect when backend recovers
- Queue events during disconnection

### 3. Input Validation
Validate all external data:
- Table data from backend
- User input (filter values, settings)
- Bridge messages
- Handle null/undefined gracefully

### 4. Error Recovery
Implement recovery strategies:
- Retry failed operations (max 3 attempts)
- Fallback to default values
- Clear corrupted state
- Notify user of recovery actions

## Technical Requirements

### TypeScript Best Practices
- **NO `any` types** — use discriminated unions for errors
- Define explicit error types: `type Result<T, E> = { success: true; data: T } | { success: false; error: E }`
- Use `never` for functions that always throw
- Properly type error boundaries

### Error Handling Best Practices
- Never swallow errors silently
- Log errors with context (component, action, data)
- Use custom error classes for different error types
- Implement `onError` callbacks for components

### Code Quality
- Follow existing code style
- Add error messages in English (user-friendly)
- Include error codes for debugging
- Max retry attempts: 3

## Implementation Steps

### Step 1: Define Error Types
Create `packages/devtools/extension/panel/types/errors.ts`:
```typescript
export enum ErrorCode {
  BACKEND_UNAVAILABLE = 'BACKEND_UNAVAILABLE',
  INVALID_DATA = 'INVALID_DATA',
  CONNECTION_LOST = 'CONNECTION_LOST',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface DevToolsError {
  code: ErrorCode;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: DevToolsError };
```

### Step 2: Create Error Boundary
Create `packages/devtools/extension/panel/components/ErrorBoundary.tsx`:
- Class component implementing `componentDidCatch`
- Display error UI with retry option
- Log error to console with context

### Step 3: Implement Connection Monitor
Create `packages/devtools/extension/panel/hooks/useConnectionStatus.ts`:
- Periodic health check (every 5 seconds)
- Emit connection status changes
- Auto-reconnect on disconnect

### Step 4: Add Validation Utilities
Create `packages/devtools/extension/panel/utils/validation.ts`:
- `isValidTableData(data: unknown): boolean`
- `isValidEvent(event: unknown): boolean`
- `sanitizeInput(input: string): string`

### Step 5: Update Components with Error Handling
- Wrap DevToolsPanel with ErrorBoundary
- Add connection status indicator to header
- Handle errors in all async operations

## Success Criteria
- [ ] Rendering errors show ErrorBoundary UI (not blank screen)
- [ ] Connection status indicator shows disconnected state
- [ ] Auto-reconnect works when backend recovers
- [ ] Invalid data is handled gracefully (no crashes)
- [ ] All errors are logged with context
- [ ] No TypeScript errors or ESLint warnings
- [ ] User can retry failed operations

## Related Files
- `packages/devtools/extension/panel/components/ErrorBoundary.tsx` (new)
- `packages/devtools/extension/panel/types/errors.ts` (new)
- `packages/devtools/extension/panel/hooks/useConnectionStatus.ts` (new)
- `packages/devtools/extension/panel/utils/validation.ts` (new)
- `packages/devtools/extension/panel/DevToolsPanel.tsx` (update)

## Error Messages (User-Facing)
- "DevTools backend not available. Retrying..."
- "Connection lost. Reconnecting..."
- "Invalid data received. Please refresh the page."
- "Operation failed. [Error Code: XXX]"

## Notes
- Use exponential backoff for retries (100ms, 200ms, 400ms)
- Store last error in state for debugging
- Connection check timeout: 2 seconds
- Maximum queued events during disconnection: 50
