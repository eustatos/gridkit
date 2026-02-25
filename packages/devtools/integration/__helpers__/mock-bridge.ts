// Mock utilities for extension communication testing

import { vi } from 'vitest'

/**
 * Create a mock bridge for testing
 */
export function createMockBridge() {
  const postMessage = vi.fn()
  const addEventListener = vi.fn()
  const removeEventListener = vi.fn()

  // Store original window
  const originalWindow = global.window

  // Mock window
  Object.defineProperty(window, 'postMessage', {
    value: postMessage,
    writable: true,
  })
  Object.defineProperty(window, 'addEventListener', {
    value: addEventListener,
    writable: true,
  })
  Object.defineProperty(window, 'removeEventListener', {
    value: removeEventListener,
    writable: true,
  })

  return {
    postMessage,
    addEventListener,
    removeEventListener,
    restore: () => {
      global.window = originalWindow
    },
  }
}

/**
 * Create a mock message event
 */
export function createMockMessageEvent(
  data: any,
  source: Window | null = window,
) {
  return {
    source,
    data,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
  } as any
}

/**
 * Mock the Chrome extension API
 */
export function mockChromeAPI() {
  const mockRuntime = {
    connect: vi.fn(),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onConnect: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  }

  const mockChrome = {
    runtime: mockRuntime,
  }

  // Store original chrome
  const originalChrome = (global as any).chrome

  // Mock chrome
  ;(global as any).chrome = mockChrome

  return {
    chrome: mockChrome,
    runtime: mockRuntime,
    restore: () => {
      if (originalChrome) {
        ;(global as any).chrome = originalChrome
      } else {
        delete (global as any).chrome
      }
    },
  }
}

/**
 * Mock window.postMessage and chrome.runtime.sendMessage
 */
export function mockExtensionCommunication() {
  const bridgeMock = createMockBridge()
  const chromeMock = mockChromeAPI()

  return {
    ...bridgeMock,
    ...chromeMock,
    restore: () => {
      bridgeMock.restore()
      chromeMock.restore()
    },
  }
}
