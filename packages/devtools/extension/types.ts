// Extension-specific types

import type { DevToolsCommand, DevToolsResponse } from '@gridkit/devtools-bridge/protocol'

// Helper to create a command with required fields
export function createCommand<T extends string>(type: T, tableId?: string): DevToolsCommand & { type: T } {
  return {
    source: 'devtools',
    type,
    timestamp: Date.now(),
    tableId,
    payload: undefined
  }
}

// Helper to handle responses
export function createResponseHandler<T = any>(callback: (response: DevToolsResponse & { type: T }) => void) {
  return (response: DevToolsResponse) => {
    callback(response as DevToolsResponse & { type: T })
  }
}
