/**
 * ErrorBoundary provides error isolation for plugin event handlers.
 * It catches errors and prevents them from affecting other plugins or the core system.
 * 
 * The error boundary wraps plugin functions and catches both synchronous
 * and asynchronous errors, preventing them from propagating to other
 * parts of the system. It provides error reporting and logging capabilities.
 * 
 * @example
 * ```typescript
 * const errorBoundary = new ErrorBoundary('plugin-1', (error, pluginId) => {
 *   console.error(`Plugin ${pluginId} error:`, error);
 * });
 * 
 * const wrappedFunction = errorBoundary.wrap(faultyFunction, 'test-context');
 * wrappedFunction(); // Errors will be caught and logged
 * ```
 */
export class ErrorBoundary {
  private pluginId: string;
  private onErrorCallback?: (error: Error, pluginId: string) => void;

  /**
   * Creates a new error boundary for a plugin.
   * 
   * This method creates a new error boundary that will catch errors
   * from plugin functions and prevent them from affecting other parts
   * of the system.
   * 
   * @param pluginId - The plugin identifier
   * @param onError - Optional callback for handling errors
   * 
   * @example
   * ```typescript
   * const errorBoundary = new ErrorBoundary('plugin-1', (error, pluginId) => {
   *   console.error(`Plugin ${pluginId} error:`, error);
   * });
   * ```
   */
  constructor(pluginId: string, onError?: (error: Error, pluginId: string) => void) {
    this.pluginId = pluginId;
    this.onErrorCallback = onError;
  }

  /**
   * Wraps a function with error boundary protection.
   * 
   * This method wraps a function with error boundary protection,
   * catching both synchronous and asynchronous errors. It returns
   * a wrapped function that behaves the same as the original but
   * with error handling.
   * 
   * @param fn - The function to wrap
   * @param context - Optional context description for error messages
   * @returns A wrapped function that catches and handles errors
   * 
   * @example
   * ```typescript
   * const wrappedFunction = errorBoundary.wrap(faultyFunction, 'test-context');
   * wrappedFunction(); // Errors will be caught and logged
   * ```
   */
  public wrap<T extends (...args: any[]) => any>(fn: T, context?: string): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result instanceof Promise) {
          return result.catch((error: Error) => {
            this.handleError(error, context);
            // Re-throw to maintain promise rejection
            throw error;
          });
        }
        
        return result;
      } catch (error) {
        this.handleError(error as Error, context);
        // Return undefined for synchronous errors
        return undefined;
      }
    }) as T;
  }

  /**
   * Handles an error caught by the boundary.
   * 
   * This method handles an error caught by the boundary, logging it
   * and calling the error callback if provided. It ensures that
   * errors in the error callback don't cause further issues.
   * 
   * @param error - The error that occurred
   * @param context - Optional context description
   * 
   * @example
   * ```typescript
   * this.handleError(error, 'test-context');
   * ```
   */
  private handleError(error: Error, context?: string): void {
    // Log the error
    const errorMessage = `[Plugin ${this.pluginId}] Error${context ? ` in ${context}` : ''}: ${error.message}`;
    console.error(errorMessage);
    
    // Call the error callback if provided
    if (this.onErrorCallback) {
      try {
        this.onErrorCallback(error, this.pluginId);
      } catch (callbackError) {
        console.error(`[Plugin ${this.pluginId}] Error in error callback:`, callbackError);
      }
    }
    
    // Additional error handling logic could be added here:
    // - Error reporting to monitoring systems
    // - Plugin suspension logic
    // - Rate limiting for error-prone plugins
  }
}