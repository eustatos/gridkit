// DevTools Communication Bridge

import {
  DevToolsMessage,
  DevToolsCommand,
  DevToolsResponse,
  DevToolsProtocol
} from './protocol'
import { COMMAND, RESPONSE, BACKEND_READY } from './messages'

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
    if (typeof window === 'undefined') return

    window.postMessage(
      {
        source: 'backend',
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

    if (message.source !== 'content') return

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
    const payload = message.payload as Record<string, unknown> | undefined;
    if (!payload || typeof payload.type !== 'string') return;

    const handler = this.commandHandlers.get(payload.type);
    if (!handler) return;

    try {
      const result = await handler(payload);
      this.send({
        type: RESPONSE,
        payload: {
          success: true,
          data: result,
          commandType: payload.type,
          timestamp: Date.now()
        } as Record<string, unknown>
      });
    } catch (error) {
      this.send({
        type: RESPONSE,
        payload: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          commandType: payload.type,
          timestamp: Date.now()
        } as Record<string, unknown>
      });
    }
  }

  private handleResponse(message: DevToolsMessage): void {
    const payload = message.payload as Record<string, unknown> | undefined;
    if (!payload || payload.type !== RESPONSE) return;

    const response = payload;
    const success = (response as Record<string, unknown>).success as boolean | undefined;
    
    if (!success) {
      const error = (response as Record<string, unknown>).error as string | undefined;
      console.error('DevTools command failed:', error);
      return;
    }

    this.responseHandlers.forEach((handler) => {
      try {
        const commandType = (response as Record<string, unknown>).commandType as string | undefined;
        const data = (response as Record<string, unknown>).data as unknown;
        
        handler({
          source: 'backend',
          type: (commandType || 'UNKNOWN') as DevToolsResponse['type'],
          payload: data,
          tableId: message.tableId,
          timestamp: message.timestamp || Date.now()
        });
      } catch (error) {
        console.error('Error in response handler:', error);
      }
    });
  }

  send(message: Omit<DevToolsMessage, 'source' | 'timestamp'>): void {
    if (!this.connected || typeof window === 'undefined') return;

    window.postMessage(
      {
        ...message,
        source: 'backend',
        timestamp: Date.now()
      },
      '*'
    );
  }

  sendCommand(command: DevToolsCommand): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('DevTools command timeout'));
      }, 5000);

      const responseHandler = (response: DevToolsResponse) => {
        if (response.type === command.type) {
          clearTimeout(timeout);
          this.responseHandlers.delete(responseHandler);
          const payload = response.payload as Record<string, unknown> | undefined;
          if (payload?.success) {
            resolve(payload.data);
          } else {
            const error = payload?.error as string | undefined;
            reject(new Error(error || 'Command failed'));
          }
        }
      };

      this.responseHandlers.add(responseHandler);

      this.send({
        type: COMMAND,
        payload: command
      });
    });
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
