// Connection Status Monitoring Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { devToolsBridge } from '@gridkit/devtools-bridge/DevToolsBridge';
import type { DevToolsError, ConnectionStatus } from '../types/errors';
import { ErrorCode } from '../types/errors';

const CHECK_INTERVAL_MS = 5000;
const CONNECTION_TIMEOUT_MS = 2000;
const MAX_RETRY_ATTEMPTS = 3;
const BACKOFF_DELAYS = [100, 200, 400];

export function useConnectionStatus(): ConnectionStatus & {
  attemptReconnect: () => Promise<boolean>;
  resetConnection: () => void;
} {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    lastCheck: 0,
    attempts: 0
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef<number>(0);

  /**
   * Check if backend is available
   */
  const checkConnection = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, CONNECTION_TIMEOUT_MS);

      try {
        const backend = (window as unknown as Record<string, unknown>).__GRIDKIT_DEVTOOLS_BACKEND__ as
          | { isConnected?: () => boolean }
          | undefined;

        if (backend && typeof backend.isConnected === 'function') {
          const connected = backend.isConnected();
          clearTimeout(timeout);
          resolve(connected);
        } else if (backend) {
          clearTimeout(timeout);
          resolve(true);
        } else {
          clearTimeout(timeout);
          resolve(false);
        }
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }, []);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const attemptReconnect = useCallback(async (): Promise<boolean> => {
    const attempt = attemptRef.current;

    if (attempt >= MAX_RETRY_ATTEMPTS) {
      const error: DevToolsError = {
        code: ErrorCode.CONNECTION_LOST,
        message: 'Failed to reconnect after maximum attempts',
        timestamp: Date.now(),
        context: { attempts: MAX_RETRY_ATTEMPTS }
      };

      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        error,
        attempts: MAX_RETRY_ATTEMPTS
      }));

      return false;
    }

    const delay = BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)];

    return new Promise((resolve) => {
      reconnectTimeoutRef.current = setTimeout(async () => {
        const connected = await checkConnection();

        if (connected) {
          attemptRef.current = 0;
          setStatus({
            isConnected: true,
            lastCheck: Date.now(),
            attempts: 0
          });
          resolve(true);
        } else {
          attemptRef.current += 1;
          setStatus((prev) => ({
            ...prev,
            isConnected: false,
            attempts: attemptRef.current
          }));
          resolve(false);
        }
      }, delay);
    });
  }, [checkConnection]);

  /**
   * Reset connection state
   */
  const resetConnection = useCallback(() => {
    attemptRef.current = 0;
    setStatus({
      isConnected: false,
      lastCheck: 0,
      attempts: 0
    });
  }, []);

  /**
   * Periodic connection check
   */
  useEffect(() => {
    const performCheck = async (): Promise<void> => {
      const connected = await checkConnection();

      setStatus((prev) => ({
        ...prev,
        isConnected: connected,
        lastCheck: Date.now(),
        attempts: connected ? 0 : prev.attempts
      }));

      if (!connected && attemptRef.current < MAX_RETRY_ATTEMPTS) {
        await attemptReconnect();
      }
    };

    // Initial check
    performCheck();

    // Periodic checks
    checkIntervalRef.current = setInterval(performCheck, CHECK_INTERVAL_MS);

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [checkConnection, attemptReconnect]);

  return {
    ...status,
    attemptReconnect,
    resetConnection
  };
}
