// DevTools Communication Bridge

import {
  DevToolsMessage,
  DevToolsCommand,
  DevToolsResponse,
  DevToolsProtocol,
  COMMAND,
  RESPONSE,
  BACKEND_READY
} from './protocol'

type CommandHandler<T = any> = (payload: any) => T | Promise<T>
type ResponseHandler = (response: DevToolsResponse) => void

export class DevToolsBridge implements DevToolsProtocol {
  private commandHandlers: Map<string, CommandHandler> = new Map()
  private responseHandlers: Set<ResponseHandler> = new Set()
  private connected = false

  constructor() {
    this.connect()
  }

  private connect(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('message', this.handleContentMessage.bind(this))
    this.notifyContentScript()
    this.connected = true
  }

  private notifyContentScript(): void {
    window.postMessage(
      {
        source: 'gridkit-devtools-backend',
        type: BACKEND_READY,
        timestamp: Date.now()
      },
      '*'
    )
  }

  private handleContentMessage(event: MessageEvent): void {
    if (event.source !== window) return
    if (!event.data || typeof event.data !== 'object') return

    const message = event.data as DevToolsMessage

    if (message.source !== 'gridkit-devtools-content') return

    switch (message.type) {
      case COMMAND:
        this.handleCommand(message)
        break

      case RESPONSE:
        this.handleResponse(message)
        break

      case 'CONTENT_READY':
        this.connected = true
        break
    }
  }

  private async handleCommand(message: DevToolsMessage): Promise<void> {
    if (!message.payload || message.payload.type === undefined) return

    const handler = this.commandHandlers.get(message.payload.type)
    if (!handler) return

    try {
      const result = await handler(message.payload)
      this.send({
        type: RESPONSE,
        payload: {
          success: true,
          data: result,
          commandType: message.payload.type,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      this.send({
        type: RESPONSE,
        payload: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          commandType: message.payload.type,
          timestamp: Date.now()
        }
      })
    }
  }

  private handleResponse(message: DevToolsMessage): void {
    if (!message.payload || message.payload.type !== RESPONSE) return

    const response = message.payload as any
    if (!response.success) {
      console.error('DevTools command failed:', response.error)
      return
    }

    this.responseHandlers.forEach((handler) => {
      try {
        handler({
          source: 'backend',
          type: response.commandType || 'UNKNOWN',
          payload: response.data,
          tableId: message.tableId,
          timestamp: message.timestamp || Date.now()
        })
      } catch (error) {
        console.error('Error in response handler:', error)
      }
    })
  }

  send(message: Omit<DevToolsMessage, 'source' | 'timestamp'>): void {
    if (!this.connected || typeof window === 'undefined') return

    window.postMessage(
      {
        ...message,
        source: 'gridkit-devtools-backend',
        timestamp: Date.now()
      },
      '*'
    )
  }

  sendCommand(command: DevToolsCommand): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('DevTools command timeout'))
      }, 5000)

      const responseHandler = (response: DevToolsResponse) => {
        if (response.type === command.type) {
          clearTimeout(timeout)
          this.responseHandlers.delete(responseHandler)
          if (response.payload?.success) {
            resolve(response.payload.data)
          } else {
            reject(new Error(response.payload?.error || 'Command failed'))
          }
        }
      }

      this.responseHandlers.add(responseHandler)

      this.send({
        type: COMMAND,
        payload: command
      })
    })
  }

  onCommand<T = any>(type: string, handler: CommandHandler<T>): () => void {
    this.commandHandlers.set(type, handler)
    return () => {
      this.commandHandlers.delete(type)
    }
  }

  onResponse(handler: ResponseHandler): () => void {
    this.responseHandlers.add(handler)
    return () => {
      this.responseHandlers.delete(handler)
    }
  }

  disconnect(): void {
    this.commandHandlers.clear()
    this.responseHandlers.clear()
    this.connected = false

    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleContentMessage.bind(this))
    }
  }

  isConnected(): boolean {
    return this.connected
  }
}

export const devToolsBridge = new DevToolsBridge()
