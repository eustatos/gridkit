// Vitest setup for @gridkit/devtools

import { afterEach, vi } from 'vitest'

// Mock window.postMessage for bridge tests
const mockPostMessage = vi.fn()
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

Object.defineProperty(window, 'postMessage', {
  value: mockPostMessage,
  writable: true,
})

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
})

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
})

// Mock performance API for memory tests
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

// Cleanup mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Resize observer mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Intersection observer mock
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
