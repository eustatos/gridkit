/**
 * Error boundary system for GridKit.
 *
 * Isolates failures and prevents crashes in production.
 * Inspired by React Error Boundaries but framework-agnostic.
 *
 * @module @gridkit/core/validation/error-boundary
 */

// Import types from base
import type { GridId, ColumnId, RowId, CellId } from '@/types';

// ===================================================================
// Error Boundary Interface
// ===================================================================

/**
 * Error boundary that isolates failures and prevents crashes.
 * Inspired by React Error Boundaries but framework-agnostic.
 */
export interface ErrorBoundary {
  /**
   * Unique identifier for this boundary.
   */
  readonly id: string;

  /**
   * Scope of errors this boundary catches.
   */
  readonly scope: ErrorScope;

  /**
   * Capture an error and isolate it.
   *
   * @param error - The error to capture
   * @param context - Additional context for debugging
   * @returns Error capture information
   */
  capture(error: unknown, context?: ErrorContext): ErrorCapture;

  /**
   * Attempt to recover from errors.
   *
   * @returns Recovery result
   */
  recover(): RecoveryResult;

  /**
   * Whether this boundary is currently active.
   */
  readonly isActive: boolean;

  /**
   * Number of errors captured.
   */
  readonly errorCount: number;

  /**
   * Last captured error if any.
   */
  readonly lastError?: CapturedError;

  /**
   * Reset the boundary to clean state.
   */
  reset(): void;

  /**
   * Get all captured errors.
   */
  getErrors(): readonly CapturedError[];

  /**
   * Get recovery strategies for this boundary.
   */
  getRecoveryStrategies(): readonly RecoveryStrategy[];
}

/**
 * Scope for error boundary isolation.
 */
export type ErrorScope =
  | 'global' // Catches all errors
  | 'plugin' // Plugin-specific isolation
  | 'column' // Column operations
  | 'row' // Row operations
  | 'cell' // Cell operations
  | 'event' // Event handlers
  | 'render' // Rendering operations
  | 'data' // Data operations
  | 'custom'; // Custom scope

/**
 * Error capture information.
 */
export interface ErrorCapture {
  /**
   * Unique capture ID.
   */
  readonly id: string;

  /**
   * Whether error was successfully isolated.
   */
  readonly isolated: boolean;

  /**
   * Scope of the error.
   */
  readonly scope: ErrorScope;

  /**
   * Whether recovery was attempted.
   */
  readonly recoveryAttempted: boolean;

  /**
   * Whether recovery was successful.
   */
  readonly recoverySuccessful?: boolean;

  /**
   * Timestamp of capture.
   */
  readonly capturedAt: number;
}

/**
 * Captured error with context.
 */
export interface CapturedError {
  /**
   * Unique error ID.
   */
  readonly id: string;

  /**
   * The original error object.
   */
  readonly error: unknown;

  /**
   * Human-readable error message.
   */
  readonly message: string;

  /**
   * Error stack trace.
   */
  readonly stack?: string;

  /**
   * Scope where error occurred.
   */
  readonly scope: ErrorScope;

  /**
   * Timestamp of error.
   */
  readonly timestamp: number;

  /**
   * Context information for debugging.
   */
  readonly context: ErrorContext;

  /**
   * Severity level.
   */
  readonly severity: ErrorSeverity;

  /**
   * Whether error is recoverable.
   */
  readonly isRecoverable: boolean;

  /**
   * Whether recovery was attempted.
   */
  readonly recoveryAttempted: boolean;

  /**
   * Whether recovery was successful.
   */
  readonly recoverySuccessful?: boolean;

  /**
   * Custom data associated with error.
   */
  readonly customData?: Record<string, unknown>;
}

/**
 * Error severity levels.
 */
export type ErrorSeverity =
  | 'critical' // Application crash imminent
  | 'error' // Feature broken, needs attention
  | 'warning' // Degraded experience
  | 'info' // Informational, no action needed
  | 'debug'; // Development/debugging

/**
 * Error context for debugging.
 */
export interface ErrorContext {
  /**
   * Operation being performed.
   */
  readonly operation: string;

  /**
   * Component where error occurred.
   */
  readonly component?: string;

  /**
   * Plugin ID if applicable.
   */
  readonly pluginId?: string;

  /**
   * Table ID if applicable.
   */
  readonly tableId?: GridId;

  /**
   * Column ID if applicable.
   */
  readonly columnId?: ColumnId;

  /**
   * Row ID if applicable.
   */
  readonly rowId?: RowId;

  /**
   * Cell ID if applicable.
   */
  readonly cellId?: CellId;

  /**
   * Event name if applicable.
   */
  readonly event?: string;

  /**
   * Current state snapshot.
   */
  readonly state?: unknown;

  /**
   * Data being processed.
   */
  readonly data?: unknown;

  /**
   * User information (if available).
   */
  readonly user?: Record<string, unknown>;

  /**
   * Custom context properties.
   */
  readonly [key: string]: unknown;
}

/**
 * Recovery result.
 */
export interface RecoveryResult {
  /**
   * Whether recovery succeeded.
   */
  readonly success: boolean;

  /**
   * Recovery strategy used.
   */
  readonly strategy?: RecoveryStrategy;

  /**
   * Error that occurred during recovery.
   */
  readonly recoveryError?: CapturedError;

  /**
   * Details about the recovery.
   */
  readonly details?: RecoveryDetails;
}

/**
 * Recovery strategy.
 */
export interface RecoveryStrategy {
  /**
   * Strategy ID.
   */
  readonly id: string;

  /**
   * Strategy name.
   */
  readonly name: string;

  /**
   * Strategy description.
   */
  readonly description: string;

  /**
   * Recovery priority.
   */
  readonly priority: number;

  /**
   * Whether this is a fallback strategy.
   */
  readonly isFallback: boolean;

  /**
   * Apply the recovery strategy.
   */
  readonly apply: () => Promise<RecoveryResult>;
}

/**
 * Recovery details.
 */
export interface RecoveryDetails {
  /**
   * Recovery strategy ID.
   */
  readonly strategyId: string;

  /**
   * Time taken for recovery.
   */
  readonly duration: number;

  /**
   * State after recovery.
   */
  readonly newState?: unknown;

  /**
   * Operations that were skipped.
   */
  readonly skippedOperations?: string[];
}

/**
 * Error boundary options for creation.
 */
export interface BoundaryOptions {
  /**
   * Boundary ID.
   */
  readonly id?: string;

  /**
   * Initial recovery strategies.
   */
  readonly strategies?: RecoveryStrategy[];

  /**
   * Whether to auto-recover.
   * @default false
   */
  readonly autoRecover?: boolean;

  /**
   * Maximum errors before disabling.
   * @default Infinity
   */
  readonly maxErrors?: number;

  /**
   * Custom error handler.
   */
  readonly onError?: (error: CapturedError) => void;

  /**
   * Custom recovery handler.
   */
  readonly onRecover?: (result: RecoveryResult) => void;
}

/**
 * Factory function for creating error boundaries.
 */
export interface ErrorBoundaryFactory {
  /**
   * Create a new error boundary.
   *
   * @param scope - Scope of errors to catch
   * @param options - Boundary options
   * @returns New error boundary instance
   */
  createBoundary(scope: ErrorScope, options?: BoundaryOptions): ErrorBoundary;

  /**
   * Create a global error boundary.
   *
   * @param options - Boundary options
   * @returns Global error boundary
   */
  createGlobalBoundary(options?: BoundaryOptions): ErrorBoundary;

  /**
   * Create a plugin-specific boundary.
   *
   * @param pluginId - Plugin identifier
   * @param options - Boundary options
   * @returns Plugin error boundary
   */
  createPluginBoundary(pluginId: string, options?: BoundaryOptions): ErrorBoundary;

  /**
   * Create a column-specific boundary.
   *
   * @param columnId - Column identifier
   * @param options - Boundary options
   * @returns Column error boundary
   */
  createColumnBoundary(columnId: string, options?: BoundaryOptions): ErrorBoundary;

  /**
   * Create a row-specific boundary.
   *
   * @param rowId - Row identifier
   * @param options - Boundary options
   * @returns Row error boundary
   */
  createRowBoundary(rowId: string, options?: BoundaryOptions): ErrorBoundary;

  /**
   * Create a custom scope boundary.
   *
   * @param scope - Custom scope name
   * @param options - Boundary options
   * @returns Custom error boundary
   */
  createCustomBoundary(scope: string, options?: BoundaryOptions): ErrorBoundary;
}

// ===================================================================
// Error Boundary Implementation
// ===================================================================

/**
 * Default implementation of ErrorBoundary interface.
 */
export class ErrorBoundaryImpl implements ErrorBoundary {
  readonly id: string;
  readonly scope: ErrorScope;
  
  private errors: CapturedError[] = [];
  private options: BoundaryOptions;
  private _isActive: boolean = true;
  private _errorCount: number = 0;

  constructor(scope: ErrorScope, options: BoundaryOptions = {}) {
    this.id = options.id || `boundary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.scope = scope;
    this.options = options;
  }

  capture(error: unknown, context?: ErrorContext): ErrorCapture {
    if (!this._isActive) {
      throw new Error(`Boundary ${this.id} is not active`);
    }

    const capturedError: CapturedError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      scope: this.scope,
      timestamp: Date.now(),
      context: context || {
        operation: 'unknown',
      },
      severity: this.determineSeverity(error),
      isRecoverable: true,
      recoveryAttempted: false,
    };

    this.errors.push(capturedError);
    this._errorCount++;

    // Check if boundary should be disabled
    if (this.options.maxErrors !== undefined && this._errorCount >= this.options.maxErrors) {
      this._isActive = false;
    }

    // Call custom error handler if provided
    if (this.options.onError) {
      this.options.onError(capturedError);
    }

    // Auto-recover if enabled
    if (this.options.autoRecover) {
      return this.recover() as unknown as ErrorCapture;
    }

    return {
      id: capturedError.id,
      isolated: true,
      scope: this.scope,
      recoveryAttempted: false,
      recoverySuccessful: false,
      capturedAt: Date.now(),
    };
  }

  recover(): RecoveryResult {
    if (this.errors.length === 0) {
      return {
        success: true,
        strategy: {
          id: 'no-errors',
          name: 'No Errors',
          description: 'No errors to recover from',
          priority: 0,
          isFallback: false,
          apply: async () => ({ success: true }),
        },
      };
    }

    // Get last error
    const lastError = this.errors[this.errors.length - 1];

    // Simple recovery strategy: just acknowledge the error
    const recoveryResult: RecoveryResult = {
      success: true,
      strategy: {
        id: 'acknowledge',
        name: 'Acknowledge',
        description: 'Acknowledge and move on',
        priority: 1,
        isFallback: true,
        apply: async () => ({
          success: true,
          strategy: { id: 'acknowledge', name: 'Acknowledge', description: 'Acknowledge and move on', priority: 1, isFallback: true, apply: async () => ({ success: true }) },
        }),
      },
    };

    // Call custom recovery handler if provided
    if (this.options.onRecover) {
      this.options.onRecover(recoveryResult);
    }

    return recoveryResult;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get errorCount(): number {
    return this._errorCount;
  }

  get lastError(): CapturedError | undefined {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : undefined;
  }

  reset(): void {
    this.errors = [];
    this._errorCount = 0;
    this._isActive = true;
  }

  getErrors(): readonly CapturedError[] {
    return this.errors;
  }

  getRecoveryStrategies(): readonly RecoveryStrategy[] {
    return [
      {
        id: 'acknowledge',
        name: 'Acknowledge',
        description: 'Acknowledge and move on',
        priority: 1,
        isFallback: true,
        apply: async () => ({ success: true }),
      },
    ];
  }

  private determineSeverity(error: unknown): ErrorSeverity {
    if (error instanceof Error) {
      if (error.name === 'TypeError' || error.name === 'ReferenceError') {
        return 'error';
      }
      if (error.name === 'RangeError') {
        return 'warning';
      }
    }
    return 'info';
  }
}

/**
 * Factory function for creating error boundaries.
 */
export function createErrorBoundary(scope: ErrorScope, options?: BoundaryOptions): ErrorBoundary {
  return new ErrorBoundaryImpl(scope, options);
}

// Export the interface
export default ErrorBoundary;
