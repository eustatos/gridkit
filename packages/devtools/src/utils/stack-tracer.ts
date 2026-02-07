/**
 * Stack trace capture utilities for development debugging
 * Implements stack trace capture as per TASK-005
 */

export interface StackTraceConfig {
  enableStackTrace: boolean;
  traceLimit: number;
  isDevelopment: boolean;
}

export interface CapturedStackTrace {
  frames: string[];
  timestamp: number;
  source?: string;
}

/**
 * Default stack trace configuration
 */
export const DEFAULT_STACK_TRACE_CONFIG: StackTraceConfig = {
  enableStackTrace: false,
  traceLimit: 10,
  isDevelopment: process.env.NODE_ENV === "development",
};

/**
 * Capture stack trace with configurable depth
 * @param limit - Number of stack frames to capture
 * @returns Captured stack trace or null if not in development
 */
export function captureStackTrace(
  limit: number = 10,
): CapturedStackTrace | null {
  // Only capture in development environment
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const stack = new Error().stack;
  if (!stack) {
    return null;
  }

  // Parse stack frames (skip first frame which is this function)
  const frames = stack
    .split("\n")
    .slice(1, limit + 1)
    .map((frame) => frame.trim())
    .filter((frame) => frame.length > 0);

  return {
    frames,
    timestamp: Date.now(),
  };
}

/**
 * Lazy stack trace generator
 * @param config - Stack trace configuration
 * @returns Function that captures stack trace when called
 */
export function createStackTraceGenerator(
  config: StackTraceConfig,
): () => CapturedStackTrace | null {
  return () => {
    if (!config.enableStackTrace || !config.isDevelopment) {
      return null;
    }

    return captureStackTrace(config.traceLimit);
  };
}

/**
 * Check if stack trace capture is enabled
 * @param config - Stack trace configuration
 * @returns True if stack trace capture is enabled
 */
export function isStackTraceEnabled(config: StackTraceConfig): boolean {
  return config.enableStackTrace && config.isDevelopment;
}
