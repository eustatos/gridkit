// Environment setup utilities for integration tests

import { beforeEach, afterEach, vi } from 'vitest'

/**
 * Setup test environment with mocks
 */
export function setupTestEnvironment() {
  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: () => Date.now(),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
      },
    },
    writable: true,
  })

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console }
  ;['log', 'warn', 'error'].forEach((method) => {
    ;(console as any)[method] = vi.fn()
  })

  return {
    restore: () => {
      // Restore console
      Object.assign(console, originalConsole)
    },
  }
}

/**
 * Setup window mocks for content script testing
 */
export function setupWindowMocks() {
  const originalWindow = global.window

  // Mock postMessage
  const mockPostMessage = vi.fn()
  Object.defineProperty(window, 'postMessage', {
    value: mockPostMessage,
    writable: true,
  })

  // Mock addEventListener
  const mockAddEventListener = vi.fn()
  Object.defineProperty(window, 'addEventListener', {
    value: mockAddEventListener,
    writable: true,
  })

  // Mock removeEventListener
  const mockRemoveEventListener = vi.fn()
  Object.defineProperty(window, 'removeEventListener', {
    value: mockRemoveEventListener,
    writable: true,
  })

  return {
    mockPostMessage,
    mockAddEventListener,
    mockRemoveEventListener,
    restore: () => {
      global.window = originalWindow
    },
  }
}

/**
 * Setup backend environment with DevToolsBackend and DevToolsBridge
 */
export function setupDevToolsEnvironment() {
  const { DevToolsBackend } = require('../backend/DevToolsBackend')
  const { DevToolsBridge } = require('../bridge/DevToolsBridge')

  const backend = new DevToolsBackend()
  const bridge = new DevToolsBridge()

  return {
    backend,
    bridge,
    restore: () => {
      backend.cleanup()
    },
  }
}

/**
 * Clean up after each test
 */
export function cleanupTestEnvironment() {
  // Clear any pending timers
  vi.clearAllTimers()

  // Clear all mocks
  vi.clearAllMocks()
}
