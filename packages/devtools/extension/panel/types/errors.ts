// Error Types and Interfaces

export enum ErrorCode {
  BACKEND_UNAVAILABLE = 'BACKEND_UNAVAILABLE',
  INVALID_DATA = 'INVALID_DATA',
  CONNECTION_LOST = 'CONNECTION_LOST',
  TIMEOUT = 'TIMEOUT',
  RENDER_FAILED = 'RENDER_FAILED',
  UNKNOWN = 'UNKNOWN'
}

export interface DevToolsError {
  code: ErrorCode;
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
  stack?: string;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: DevToolsError };

export interface ErrorBoundaryState {
  hasError: boolean;
  error: DevToolsError | null;
  retryCount: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastCheck: number;
  attempts: number;
  error?: DevToolsError;
}
