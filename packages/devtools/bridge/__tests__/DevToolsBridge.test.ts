// Tests for DevToolsBridge communication
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DevToolsBridge } from '../DevToolsBridge'
import { devToolsBridge } from '../DevToolsBridge'
import { COMMAND, RESPONSE, BACKEND_READY } from '../messages'

describe('DevToolsBridge', () => {
  let originalWindow: any
  let mockPostMessage: any
  let mockAddEventListener: any

  beforeEach(() => {
    originalWindow = global.window

    mockPostMessage = vi.fn()
    mockAddEventListener = vi.fn()

    Object.defineProperty(window, 'postMessage', {
      value: mockPostMessage,
      writable: true,
    })
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
    })
    Object.defineProperty(window, 'removeEventListener', {
      value: vi.fn(),
      writable: true,
    })

    Object.defineProperty(window, 'performance', {
      value: { now: () => Date.now() },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    global.window = originalWindow
  })

  it('should export DevToolsBridge class', () => {
    expect(DevToolsBridge).toBeDefined()
    expect(typeof DevToolsBridge).toBe('function')
  })

  it('should export devToolsBridge instance', () => {
    expect(devToolsBridge).toBeDefined()
    expect(devToolsBridge).toBeInstanceOf(DevToolsBridge)
  })

  it('should have send method', () => {
    expect(devToolsBridge.send).toBeTypeOf('function')
  })

  it('should have sendCommand method', () => {
    expect(devToolsBridge.sendCommand).toBeTypeOf('function')
  })

  it('should have onCommand method', () => {
    expect(devToolsBridge.onCommand).toBeTypeOf('function')
  })

  it('should have onResponse method', () => {
    expect(devToolsBridge.onResponse).toBeTypeOf('function')
  })

  it('should have disconnect method', () => {
    expect(devToolsBridge.disconnect).toBeTypeOf('function')
  })

  it('should have isConnected method', () => {
    expect(devToolsBridge.isConnected).toBeTypeOf('function')
  })

  it('should be connected initially', () => {
    expect(devToolsBridge.isConnected()).toBe(true)
  })

  it('should setup message handlers on construction', () => {
    const bridge = new DevToolsBridge()
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    )
    expect(bridge.isConnected()).toBe(true)
  })

  it('should notify content script on construction', () => {
    new DevToolsBridge()
    expect(mockPostMessage).toHaveBeenCalled()
    const sent = mockPostMessage.mock.calls[0][0]
    expect(sent.source).toBe('backend')
    expect(sent.timestamp).toBeDefined()
  })

  it('should send message when connected', () => {
    const bridge = new DevToolsBridge()
    const message = { type: COMMAND, payload: { type: 'GET_TABLES' } } as any

    bridge.send(message)

    expect(mockPostMessage).toHaveBeenCalled()
    const sent = mockPostMessage.mock.calls[0][0]
    expect(sent.source).toBe('backend')
  })

  it('should not send when not connected', () => {
    const bridge = new DevToolsBridge()
    bridge.disconnect()
    mockPostMessage.mockClear()

    bridge.send({ type: COMMAND, payload: {} } as any)

    expect(mockPostMessage).not.toHaveBeenCalled()
  })

  it('should clear handlers on disconnect', () => {
    const bridge = new DevToolsBridge()
    const handler = vi.fn()
    bridge.onCommand('GET_TABLES', handler)
    bridge.onResponse(vi.fn())

    bridge.disconnect()

    expect(bridge['commandHandlers'].size).toBe(0)
    expect(bridge['responseHandlers'].size).toBe(0)
    expect(bridge.isConnected()).toBe(false)
  })
})
